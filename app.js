// app.js (module)
console.log("app.js carregado (module)");

// Utilidades
function q(id){ return document.getElementById(id); }
function el(html){ const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

// Estado global
let supabase;
let currentUser = null; // { id, warname, full_name, is_admin }
let currentMonthId = null;

// DOM refs
const authView = q('authView');
const appView = q('appView');
const registerExtra = q('registerExtra');
const whoDisplay = q('whoDisplay');
const roleDisplay = q('roleDisplay');
const adminControls = q('adminControls');
const statusBox = q('statusBox');
const gridContainer = q('gridContainer');
const monthsSelect = q('monthsSelect');

document.addEventListener('DOMContentLoaded', async () => {
  if(!window.supabase){
    console.error("window.supabase não definido — verifique index.html (chave/esm import).");
    alert("Erro: Supabase não inicializado. Verifique console.");
    return;
  }
  supabase = window.supabase;

  attachHandlers();

  // tenta restaurar sessão via auth (não obrigatório com seu esquema, mas tentamos)
  try {
    const { data } = await supabase.auth.getSession();
    if(data && data.session && data.session.user){
      // se você quiser usar auth real, adapte aqui. Com schema atual, não depende de auth.
      console.log("Sessão Supabase encontrada (não usada para login via cpf).");
    }
  } catch(e){
    console.warn("getSession erro:", e);
  }

  showAuth();
  await loadMonthsList(); // carrega meses (se houver)
});

function attachHandlers(){
  q('btnLogin').onclick = login;
  q('btnRegister').onclick = ()=> registerExtra.style.display = 'block';
  q('btnFinishRegister').onclick = register;
  q('btnLogout').onclick = logout;

  q('btnCreateMonth').onclick = createMonth;
  monthsSelect.onchange = loadMonthFromSelect;
  q('btnToggleActive').onclick = toggleActive;
  q('btnToggleLock').onclick = toggleLock;
  q('btnExport').onclick = exportCSV;
}

function showAuth(){ authView.style.display='block'; appView.style.display='none'; }
function showApp(){ authView.style.display='none'; appView.style.display='block'; }

// ---------- AUTH (cpf = senha) ----------
async function login(){
  const warname = q('warname').value.trim();
  const password = q('password').value.trim(); // esperamos CPF aqui

  if(!warname || !password){ alert('Preencha nome de guerra e senha (CPF)'); return; }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, warname, full_name, cpf, is_admin')
      .eq('warname', warname)
      .eq('cpf', password)
      .maybeSingle();

    if(error){ console.error("login query error:", error); alert('Erro ao consultar usuário'); return; }
    if(!data){ alert('Usuário ou senha incorretos'); return; }

    currentUser = {
      id: data.id,
      warname: data.warname,
      full_name: data.full_name,
      is_admin: !!data.is_admin
    };

    updateUIForUser();
    await loadMonthsList();
    showApp();
  } catch(e){
    console.error("Erro login:", e);
    alert('Erro ao tentar logar (veja console).');
  }
}

async function register(){
  const warname = q('warname').value.trim();
  const password = q('password').value.trim();
  const full = q('fullName').value.trim();
  const cpf = q('cpf').value.trim();

  if(!warname || !password || !full || !cpf){ alert('Preencha todos os campos'); return; }

  // preventiva: normalizar warname minúsculo
  const normalized = warname.trim();

  try {
    // checa existência
    const { data: exists } = await supabase.from('profiles').select('id').eq('warname', normalized).maybeSingle();
    if(exists){ alert('Nome de guerra já existe'); return; }

    const insertObj = {
      warname: normalized,
      full_name: full,
      cpf: cpf,
      is_admin: false
    };

    const { data, error } = await supabase.from('profiles').insert(insertObj).select().single();
    if(error){ console.error("Erro inserção profile:", error); alert('Erro ao registrar: '+error.message); return; }

    // login imediato (via cpf)
    currentUser = {
      id: data.id,
      warname: data.warname,
      full_name: data.full_name,
      is_admin: !!data.is_admin
    };

    updateUIForUser();
    registerExtra.style.display = 'none';
    showApp();
    await loadMonthsList();
  } catch(e){
    console.error("Erro register:", e);
    alert('Erro ao tentar registrar (veja console).');
  }
}

function logout(){
  currentUser = null;
  updateUIForUser();
  showAuth();
  // limpa campos
  q('warname').value = '';
  q('password').value = '';
  q('fullName').value = '';
  q('cpf').value = '';
}

// ---------- UI ----------
function updateUIForUser(){
  if(currentUser){
    whoDisplay.textContent = currentUser.full_name || currentUser.warname;
    roleDisplay.textContent = currentUser.is_admin ? 'Gestor' : 'Usuário';
    adminControls.style.display = currentUser.is_admin ? 'flex' : 'none';
  } else {
    whoDisplay.textContent = '';
    roleDisplay.textContent = '';
    adminControls.style.display = 'none';
  }
}

// ---------- MONTHS / SLOTS / GRID ----------
async function loadMonthsList(){
  try {
    const { data: months, error } = await supabase.from('months').select('*').order('year', { ascending: false }).order('month', { ascending: false });
    if(error){ console.error("loadMonthsList error:", error); return; }

    monthsSelect.innerHTML = '';
    if(!months || months.length === 0){
      // vazio
      const opt = document.createElement('option');
      opt.text = '-- nenhum mês --';
      monthsSelect.appendChild(opt);
      currentMonthId = null;
      gridContainer.innerHTML = '<p>Nenhum mês disponível.</p>';
      statusBox.innerHTML = '';
      return;
    }

    months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.text = `${m.year}-${String(m.month).padStart(2,'0')} ${m.is_active? '(ATIVO)':''} ${m.is_locked? '(BLOQ)':''}`;
      monthsSelect.appendChild(opt);
    });

    // selecionar primeiro (mais recente)
    monthsSelect.selectedIndex = 0;
    currentMonthId = Number(monthsSelect.value);
    await loadMonth(currentMonthId);
  } catch(e){
    console.error("loadMonthsList exception:", e);
  }
}

async function loadMonthFromSelect(){
  const val = monthsSelect.value;
  if(!val) return;
  currentMonthId = Number(val);
  await loadMonth(currentMonthId);
}

async function loadMonth(monthId){
  if(!monthId) return;
  try {
    // busca month meta
    const { data: month, error: e1 } = await supabase.from('months').select('*').eq('id', monthId).single();
    if(e1){ console.error("loadMonth month error:", e1); return; }

    // busca slots
    const { data: slots, error: e2 } = await supabase.from('slots').select('*').eq('month_id', monthId).order('day', { ascending: true });
    if(e2){ console.error("loadMonth slots error:", e2); return; }

    const slotIds = (slots || []).map(s => s.id);
    // busca reservations
    let reservations = [];
    if(slotIds.length){
      const { data: resv, error: e3 } = await supabase.from('reservations').select('*').in('slot_id', slotIds);
      if(e3){ console.error("loadMonth reservations error:", e3); }
      reservations = resv || [];
    }

    // atualiza status
    statusBox.innerHTML = `<div>Status do mês <b>${month.year}-${String(month.month).padStart(2,'0')}</b> &nbsp; <span>${month.is_locked ? 'BLOQUEADO' : (month.is_active ? 'ATIVO':'INATIVO')}</span></div>`;

    // constrói grid
    const shiftTypes = ['D','N'];
    let html = '<table><thead><tr><th>DIA</th>';
    slots.forEach(s => html += `<th>${String(s.day).padStart(2,'0')}</th>`);
    html += '</tr></thead><tbody>';

    shiftTypes.forEach(code => {
      html += `<tr><td>${code}</td>`;
      slots.forEach(s => {
        const resForSlot = reservations.filter(r => r.slot_id === s.id && r.shift_code === code);
        let cell = `<td id="cell_${s.id}_${code}">`;
        for(let i=0;i<s.capacity;i++){
          const r = resForSlot[i];
          if(r){
            const mine = (currentUser && r.user_id === currentUser.id);
            const displayName = mine ? (currentUser.full_name || currentUser.warname) : 'Usuário';
            const cls = `slot ${resForSlot.length >= s.capacity ? 'full' : ''} ${mine ? 'mine' : ''}`;
            cell += `<div class="${cls}" data-res="${r.id}" onclick="onClickReservation(${s.id},'${code}', ${r.id})">${displayName}</div>`;
          } else {
            cell += `<div class="slot placeholder" onclick="onClickEmpty(${s.id},'${code}')">[livre]</div>`;
          }
        }
        cell += '</td>';
        html += cell;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    gridContainer.innerHTML = html;

  } catch(e){
    console.error("loadMonth exception:", e);
  }
}

// expose helper functions on window for inline onclicks in generated HTML
window.onClickEmpty = async function(slotId, shiftCode){
  if(!currentUser){ alert('Faça login para reservar'); return; }

  // fetch month to check active/locked
  const { data: month } = await supabase.from('months').select('*').eq('id', currentMonthId).single();
  if(!month.is_active || month.is_locked){ alert('Mês não está aberto para marcação.'); return; }

  // capacity check
  const { count, error: cErr } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('slot_id', slotId).eq('shift_code', shiftCode);
  if(cErr){ console.error("count error:", cErr); alert('Erro ao checar capacidade'); return; }

  // get slot capacity
  const { data: slot } = await supabase.from('slots').select('*').eq('id', slotId).single();
  if(count >= slot.capacity){ alert('Capacidade atingida'); return; }

  // insert reservation
  const { error } = await supabase.from('reservations').insert({
    slot_id: slotId,
    user_id: currentUser.id,
    shift_code: shiftCode
  });

  if(error){ console.error("insert reservation error:", error); alert('Erro ao reservar: '+error.message); return; }

  // reload month
  await loadMonth(currentMonthId);
};

window.onClickReservation = async function(slotId, shiftCode, reservationId){
  if(!currentUser){ alert('Faça login'); return; }
  const { data: r, error } = await supabase.from('reservations').select('*').eq('id', reservationId).single();
  if(error){ console.error("fetch reservation error:", error); return; }
  if(!r) return;

  if(r.user_id === currentUser.id){
    if(confirm('Remover sua reserva?')){
      const { error: delErr } = await supabase.from('reservations').delete().eq('id', reservationId);
      if(delErr){ console.error("delete reservation error:", delErr); alert('Erro ao remover reserva'); return; }
      await loadMonth(currentMonthId);
    }
    return;
  }

  if(currentUser.is_admin){
    if(confirm('Gestor: remover esta reserva?')){
      const { error: delErr } = await supabase.from('reservations').delete().eq('id', reservationId);
      if(delErr){ console.error("delete reservation error admin:", delErr); alert('Erro ao remover reserva'); return; }
      await loadMonth(currentMonthId);
    }
    return;
  }

  alert('Não pode editar esta reserva.');
};

// ---------- Admin functions ----------
async function createMonth(){
  if(!currentUser || !currentUser.is_admin){ alert('Apenas gestor'); return; }
  const year = Number(prompt('Ano:', new Date().getFullYear()));
  const month = Number(prompt('Mês (1-12):', new Date().getMonth()+1));
  if(!year || !month) return;

  try {
    const { data, error } = await supabase.from('months').insert({
      year, month, is_active: false, is_locked: false, created_by: currentUser.id
    }).select().single();

    if(error){ console.error("createMonth error:", error); alert('Erro criando mês'); return; }

    const days = new Date(year, month, 0).getDate();
    const inserts = [];
    for(let d=1; d<=days; d++) inserts.push({ month_id: data.id, day: d, capacity: 3 });

    const r = await supabase.from('slots').insert(inserts);
    if(r.error){ console.error("create slots error:", r.error); alert('Erro criando slots'); return; }

    await loadMonthsList();
    // select the new month
    monthsSelect.value = data.id;
    currentMonthId = data.id;
    await loadMonth(currentMonthId);

  } catch(e){
    console.error("createMonth exception:", e);
    alert('Erro ao criar mês (veja console).');
  }
}

async function toggleActive(){
  if(!currentUser || !currentUser.is_admin) return alert('Apenas gestor');
  const { data: m } = await supabase.from('months').select('*').eq('id', currentMonthId).single();
  await supabase.from('months').update({ is_active: !m.is_active, is_locked: !m.is_active ? false : m.is_locked }).eq('id', currentMonthId);
  await loadMonth(currentMonthId);
  await loadMonthsList();
}

async function toggleLock(){
  if(!currentUser || !currentUser.is_admin) return alert('Apenas gestor');
  const { data: m } = await supabase.from('months').select('*').eq('id', currentMonthId).single();
  await supabase.from('months').update({ is_locked: !m.is_locked }).eq('id', currentMonthId);
  await loadMonth(currentMonthId);
  await loadMonthsList();
}

async function exportCSV(){
  if(!currentMonthId) return alert('Nenhum mês selecionado');
  const { data: slots } = await supabase.from('slots').select('*').eq('month_id', currentMonthId).order('day',{ascending:true});
  const { data: users } = await supabase.from('profiles').select('*');
  const { data: reservations } = await supabase.from('reservations').select('*');
  const days = (slots || []).map(s => s.day);
  const header = ['NOME', ...days.map(d=>String(d).padStart(2,'0')), 'TOTAL'];
  const rows = [header];
  for(const u of (users || [])){
    const row = [u.full_name];
    let total = 0;
    for(const s of (slots || [])){
      const codes = (reservations || []).filter(r => r.user_id === u.id && r.slot_id === s.id).map(r=>r.shift_code);
      total += codes.length;
      row.push(codes.join(','));
    }
    row.push(String(total));
    rows.push(row);
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `escala_mes_${currentMonthId}.csv`; a.click();
  URL.revokeObjectURL(url);
}
