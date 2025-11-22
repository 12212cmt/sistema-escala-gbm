// ===== MOCK GLOBAL =====
// Usuário admin padrão
const users = {
    admin: { password: '1234', fullName: 'Administrador', cpf: '00000000000', isAdmin: true }
};
let currentUser = null;
let currentMonth = null;

// DOM
const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const registerExtra = document.getElementById('registerExtra');
const whoDisplay = document.getElementById('whoDisplay');
const roleDisplay = document.getElementById('roleDisplay');
const adminControls = document.getElementById('adminControls');
const statusBox = document.getElementById('statusBox');
const gridContainer = document.getElementById('gridContainer');
const monthsSelect = document.getElementById('monthsSelect');

// ===== ESTADO DO MÊS =====
const months = []; // array de {id, year, month, isActive, isLocked, slots: [{id, day, capacity, reservations: [{warname, shiftCode}]}] }
let monthCounter = 1;

// ===== UTIL =====
function showAuth() { authView.style.display='block'; appView.style.display='none'; }
function showApp()  { authView.style.display='none'; appView.style.display='block'; }

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    attachHandlers();
    showAuth();
});

// ===== HANDLERS =====
function attachHandlers(){
    document.getElementById('btnLogin').onclick = login;
    document.getElementById('btnRegister').onclick = ()=> registerExtra.style.display='block';
    document.getElementById('btnFinishRegister').onclick = register;
    document.getElementById('btnLogout').onclick = logout;

    document.getElementById('btnCreateMonth').onclick = createMonth;
    document.getElementById('monthsSelect').onchange = loadMonthFromSelect;
    document.getElementById('btnToggleActive').onclick = toggleActive;
    document.getElementById('btnToggleLock').onclick = toggleLock;
    document.getElementById('btnExport').onclick = exportCSV;
}

// ===== LOGIN =====
function login(){
    const war = document.getElementById('warname').value.trim();
    const pass = document.getElementById('password').value.trim();
    if(!war || !pass){ alert('Preencha nome de guerra e senha'); return; }

    const user = users[war];
    if(!user || user.password !== pass){
        alert('Usuário ou senha incorretos');
        return;
    }

    currentUser = { warname: war, fullName: user.fullName, isAdmin: user.isAdmin };
    updateUserDisplay();
    showApp();
}

// ===== REGISTRO =====
function register(){
    const war = document.getElementById('warname').value.trim();
    const pass = document.getElementById('password').value.trim();
    const full = document.getElementById('fullName').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    if(!war || !pass || !full || !cpf){ alert('Preencha todos os campos'); return; }
    if(users[war]){ alert('Nome de guerra já existe'); return; }

    // cria usuário
    users[war] = { password: pass, fullName: full, cpf, isAdmin:false };
    currentUser = { warname: war, fullName: full, isAdmin:false };
    updateUserDisplay();
    showApp();
}

// ===== LOGOUT =====
function logout(){
    currentUser = null;
    showAuth();
    document.getElementById('warname').value='';
    document.getElementById('password').value='';
    document.getElementById('fullName').value='';
    document.getElementById('cpf').value='';
    registerExtra.style.display='none';
}

// ===== DISPLAY USER =====
function updateUserDisplay(){
    whoDisplay.textContent = currentUser.fullName;
    roleDisplay.textContent = currentUser.isAdmin ? 'Gestor' : 'Usuário';
    adminControls.style.display = currentUser.isAdmin ? 'flex' : 'none';
}

// ===== MESES =====
function createMonth(){
    if(!currentUser.isAdmin){ alert('Apenas gestor'); return; }
    const year = Number(prompt('Ano:', new Date().getFullYear()));
    const monthNum = Number(prompt('Mês (1-12):', new Date().getMonth()+1));
    if(!year || !monthNum) return;

    const days = new Date(year, monthNum, 0).getDate();
    const slots = [];
    for(let d=1; d<=days; d++){
        slots.push({ id: d, day: d, capacity:3, reservations:[] });
    }

    const newMonth = {
        id: monthCounter++, year, month: monthNum, isActive:false, isLocked:false, slots
    };
    months.push(newMonth);
    loadMonthsList();
}

// ===== LISTA DE MESES =====
function loadMonthsList(){
    monthsSelect.innerHTML = '';
    months.forEach(m=>{
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.text = `${m.year}-${String(m.month).padStart(2,'0')} ${m.isActive? '(ATIVO)':''} ${m.isLocked? '(BLOQ)':''}`;
        monthsSelect.appendChild(opt);
    });
    if(months.length){
        loadMonthFromSelect();
    }
}

// ===== CARREGAR MÊS SELECIONADO =====
function loadMonthFromSelect(){
    const monthId = Number(monthsSelect.value);
    const m = months.find(x=>x.id===monthId);
    if(m){ currentMonth = m; renderGrid(); }
}

// ===== RENDER GRID =====
function renderGrid(){
    if(!currentMonth) return;
    const shiftTypes = ['D','N'];
    let html = '<table><thead><tr><th>DIA</th>';
    currentMonth.slots.forEach(s=> html+=`<th>${String(s.day).padStart(2,'0')}</th>`);
    html+='</tr></thead><tbody>';

    shiftTypes.forEach(code=>{
        html+=`<tr><td>${code}</td>`;
        currentMonth.slots.forEach(slot=>{
            let cell = `<td>`;
            for(let i=0;i<slot.capacity;i++){
                const res = slot.reservations[i];
                if(res){
                    const mine = res.warname===currentUser.warname;
                    cell += `<div class="slot ${mine?'mine':''}" onclick="removeReservation(${slot.id},'${code}')">${mine ? currentUser.fullName : res.warname}</div>`;
                } else {
                    cell += `<div class="slot placeholder" onclick="addReservation(${slot.id},'${code}')">[livre]</div>`;
                }
            }
            cell += '</td>';
            html+=cell;
        });
        html+='</tr>';
    });
    html+='</tbody></table>';
    gridContainer.innerHTML = html;

    statusBox.innerHTML = `<b>Mês ${currentMonth.year}-${String(currentMonth.month).padStart(2,'0')}</b> ${currentMonth.isActive?'ATIVO':'INATIVO'} ${currentMonth.isLocked?'BLOQUEADO':''}`;
}

// ===== RESERVAS =====
function addReservation(slotId, shiftCode){
    if(!currentMonth.isActive || currentMonth.isLocked){ alert('Mês não disponível'); return; }
    const slot = currentMonth.slots.find(s=>s.id===slotId);
    if(slot.reservations.length>=slot.capacity){ alert('Capacidade atingida'); return; }
    slot.reservations.push({ warname: currentUser.warname, shiftCode });
    renderGrid();
}

function removeReservation(slotId, shiftCode){
    const slot = currentMonth.slots.find(s=>s.id===slotId);
    const idx = slot.reservations.findIndex(r=>r.warname===currentUser.warname && r.shiftCode===shiftCode);
    if(idx!==-1){ slot.reservations.splice(idx,1); renderGrid(); }
}

// ===== TOGGLE =====
function toggleActive(){
    if(!currentUser.isAdmin) return alert('Apenas gestor');
    currentMonth.isActive = !currentMonth.isActive;
    if(currentMonth.isActive) currentMonth.isLocked=false;
    renderGrid();
    loadMonthsList();
}

function toggleLock(){
    if(!currentUser.isAdmin) return alert('Apenas gestor');
    currentMonth.isLocked = !currentMonth.isLocked;
    renderGrid();
    loadMonthsList();
}

// ===== EXPORT CSV =====
function exportCSV(){
    if(!currentMonth) return;
    const header = ['NOME', ...currentMonth.slots.map(s=>String(s.day).padStart(2,'0'))];
    const rows = [header];

    Object.values(users).forEach(u=>{
        const row = [u.fullName];
        currentMonth.slots.forEach(slot=>{
            const codes = slot.reservations.filter(r=>r.warname===u.warname).map(r=>r.shiftCode);
            row.push(codes.join(','));
        });
        rows.push(row);
    });

    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala_mes_${currentMonth.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
