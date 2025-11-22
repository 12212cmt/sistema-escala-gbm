// ====== CONFIG (já com suas credenciais) ======
const SUPABASE_URL = 'https://rizprzmjxrspctlivfyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpenByem1qeHJzcGN0bGl2ZnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODA3NDQsImV4cCI6MjA3OTM1Njc0NH0.D-5G3eQTRr1bK607zOfvdDzomwJkRFvl8MHTJLsJuXg';

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// util: transforma warname em email interno (não precisa ser um email real)
function warToEmail(w){ return `${w}@interno.project`; }

// Estado
let currentUser = null;
let currentProfile = null;
let currentMonthId = null;

// DOM
const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const registerExtra = document.getElementById('registerExtra');

// Inicial
init();

async function init(){
  // check session
  const { data } = await supabase.auth.getSession();
  if(data && data.session){
    await fetchProfile(data.session.user);
    showApp();
  } else {
    showAuth();
  }
  attachHandlers();
}

function showAuth(){ authView.style.display='block'; appView.style.display='none'; }
function showApp(){ authView.style.display='none'; appView.style.display='block'; }

function attachHandlers(){
  document.getElementById('btnLogin').onclick = login;
  document.getElementById('btnRegister').onclick = ()=> registerExtra.style.display = 'block';
  document.getElementById('btnFinishRegister').onclick = register;
  document.getElementById('btnLogout').onclick = logout;
  document.getElementById('btnCreateMonth').onclick = createMonth;
  document.getElementById('monthsSelect').onchange = loadMonthFromSelect;
  document.getElementById('btnToggleActive').onclick = toggleActive;
  document.getElementById('btnToggleLock').onclick = toggleLock;
  document.getElementById('btnExport').onclick = exportCSV;
}

async function login(){
  const war = document.getElementById('warname').value.trim();
  const pass = document.getElementById('password').value.trim();
  if(!war || !pass){ alert('Preencha nome de guerra e senha'); return; }
  const email = warToEmail(war);
  const { error, data } = await supabase.auth.signInWithPassword({ email, password: pass });
  if(error){ alert('Erro: '+error.message); return; }
  await fetchProfile(data.user);
  showApp();
}

async function register(){
  const war = document.getElementById('warname').value.trim();
  const pass = document.getElementById('password').value.trim();
  const full = document.getElementById('fullName').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  if(!war||!pass||!full||!cpf){ alert('Preencha todos'); return; }
  const email = warToEmail(war);
  // sign up
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if(error){ alert('Erro: '+error.message); return; }
  // sign in to get user id (imediato)
  const s = await supabase.auth.signInWithPassword({ email, password: pass });
  if(s.error){ alert('Erro signIn: '+s.error.message); return; }
  const user = s.data.user;
  // insert profile
  const p = await supabase.from('profiles').insert({
    id: user.id,
    warname: war,
    full_name: full,
    cpf: cpf
  });
  if(p.error){ alert('Erro ao criar perfil: '+p.error.message); return; }
  await fetchProfile(user);
  showApp();
}

async function fetchProfile(user){
  currentUser = user;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if(error){ console.warn('profile fetch', error); currentProfile = null; return; }
  currentProfile = data;
  document.getElementById('whoDisplay').textContent = currentProfile.full_name || currentProfile.warname;
  document.getElementById('roleDisplay').textContent = currentProfile.is_admin ? 'Gestor' : 'Usuário';
  document.getElementById('adminControls').style.display = currentProfile.is_admin ? 'flex' : 'none';
  await loadMonthsList();
}

async function logout(){
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  showAuth();
}

// ---------- Months / Slots / Grid ----------
async function loadMonthsList(){
  const { data: months } = await supabase.from('months').select('*').order('year', {ascending:false}).order('month', {ascending:false});
  const sel = document.getElementById('monthsSelect');
  sel.innerHTML = '';
  if(!months) return;
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.text = `${m.year}-${String(m.month).padStart(2,'0')} ${m.is_active? '(ATIVO)':''} ${m.is_locked? '(BLOQ)':''}`;
    sel.appendChild(opt);
  });
  if(months.length){
    currentMonthId = months[0].id;
    sel.value = currentMonthId;
    loadMonth(currentMonthId);
  }
}

async function loadMonthFromSelect(){ currentMonthId = Number(document.getElementById('monthsSelect').value); loadMonth(currentMonthId); }

async function loadMonth(monthId){
  if(!monthId) return;
  const { data: month } = await supabase.from('months').select('*').eq('id', monthId).single();
  const { data: slots } = await supabase.from('slots').select('*').eq('month_id', monthId).order('day',{ascending:true});
  const slotIds = (slots || []).map(s=>s.id);
  const { data: reservations } = await supabase.from('reservations').select('*').in('slot_id', slotIds);
  // update status
  document.getElementById('statusBox').innerHTML = `<div>Status do mês <b>${month.year}-${String(month.month).padStart(2,'0')}</b> &nbsp; <span>${month.is_locked ? 'BLOQUEADO' : (month.is_active ? 'ATIVO':'INATIVO')}</span></div>`;
  // build grid: rows D and N (I is represented by D+N on UI)
  const shiftTypes = ['D','N'];
  let html = '<table><thead><tr><th>DIA</th>';
  (slots || []).forEach(s => html += `<th>${String(s.day).padStart(2,'0')}</th>`);
  html += '</tr></thead><tbody>';
  shiftTypes.forEach(code => {
    html += `<tr><td>${code}</td>`;
    (slots || []).forEach(s => {
      const res = (reservations || []).filter(r => r.slot_id === s.id && r.shift_code === code);
      let cell = `<td id="cell_${s.id}_${code}">`;
      for(let i=0;i<s.capacity;i++){
        const r = res[i];
        if(r){
          const mine = r.user_id === currentUser.id;
          cell += `<div class="slot ${res.length>=s.capacity? 'full':''} ${mine? 'mine':''}" data-res="${r.id}" onclick="onClickReservation(${s.id},'${code}', ${r.id})">${mine ? currentProfile.full_name : 'Usuário' }</div>`;
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
  document.getElementById('gridContainer').innerHTML = html;
}

// Expose functions to window that UI uses
window.onClickEmpty = async function(slotId, shiftCode){
  // load month meta
  const { data: month } = await supabase.from('months').select('*').eq('id', currentMonthId).single();
  if(!month.is_active || month.is_locked){ alert('Mês não está aberto para marcação.'); return; }

  // capacity check
  const { count } = await supabase.from('reservations').select('*', { count: 'exact', head: false }).eq('slot_id', slotId).eq('shift_code', shiftCode);
  const { data: slot } = await supabase.from('slots').select('*').eq('id', slotId).single();
  if(count >= slot.capacity){ alert('Capacidade atingida'); return; }

  // insert reservation as current user (RLS will ensure user_id = currentUser.id if policies set)
  const { error } = await supabase.from('reservations').insert({ slot_id: slotId, user_id: currentUser.id, shift_code: shiftCode });
  if(error){ alert('Erro: '+error.message); return; }
  loadMonth(currentMonthId);
};

window.onClickReservation = async function(slotId, shiftCode, reservationId){
  const { data: r } = await supabase.from('reservations').select('*').eq('id', reservationId).single();
  if(!r) return;
  if(r.user_id === currentUser.id){
    if(confirm('Remover sua reserva?')){
      await supabase.from('reservations').delete().eq('id', reservationId);
      loadMonth(currentMonthId);
    }
    return;
  }
  // if admin allow remove
  if(currentProfile.is_admin){
    if(confirm('Gestor: remover esta reserva?')){
      await supabase.from('reservations').delete().eq('id', reservationId);
      loadMonth(currentMonthId);
    }
    return;
  }
  alert('Não pode editar esta reserva.');
};

// Admin functions
async function createMonth(){
  if(!currentProfile.is_admin){ alert('Apenas gestor'); return; }
  const year = Number(prompt('Ano:', new Date().getFullYear()));
  const month = Number(prompt('Mês (1-12):', new Date().getMonth()+1));
  if(!year || !month) return;
  const { data, error } = await supabase.from('months').insert({ year, month, is_active: false, is_locked:false, created_by: currentUser.id }).select().single();
  if(error){ alert('Erro: '+error.message); return; }
  const days = new Date(year, month, 0).getDate();
  const inserts = [];
  for(let d=1; d<=days; d++) inserts.push({ month_id: data.id, day: d, capacity: 3 });
  const r = await supabase.from('slots').insert(inserts);
  if(r.error){ alert('Erro slots: '+r.error.message); }
  loadMonthsList();
}

async function toggleActive(){
  if(!currentProfile.is_admin) return alert('Apenas gestor');
  const { data: m } = await supabase.from('months').select('*').eq('id', currentMonthId).single();
  await supabase.from('months').update({ is_active: !m.is_active, is_locked: !m.is_active ? false : m.is_locked }).eq('id', currentMonthId);
  loadMonth(currentMonthId);
  loadMonthsList();
}

async function toggleLock(){
  if(!currentProfile.is_admin) return alert('Apenas gestor');
  const { data: m } = await supabase.from('months').select('*').eq('id', currentMonthId).single();
  await supabase.from('months').update({ is_locked: !m.is_locked }).eq('id', currentMonthId);
  loadMonth(currentMonthId);
  loadMonthsList();
}

async function exportCSV(){
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
