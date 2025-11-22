// ====== CONFIG ======
const SUPABASE_URL = 'https://rizprzmjxrspctlivfyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpenByem1qeHJzcGN0bGl2ZnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODA3NDQsImV4cCI6MjA3OTM1Njc0NH0.D-5G3eQTRr1bK607zOfvdDzomwJkRFvl8MHTJLsJuXg';

// Cria cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// util: transforma warname em email interno
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
async function init(){
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

// ---------- Auth ----------
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

  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if(error){ alert('Erro: '+error.message); return; }

  // login imediato
  const s = await supabase.auth.signInWithPassword({ email, password: pass });
  if(s.error){ alert('Erro signIn: '+s.error.message); return; }
  const user = s.data.user;

  // criar profile
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

// ---------- DOM + Grid ----------
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

// ---------- Resto do app ----------
// As funções de loadMonth, reservas, admin, exportCSV podem ser copiadas do seu app.js atual
// já que não interferem nos botões de login/registro

// ---------- Inicializa app quando DOM pronto ----------
document.addEventListener('DOMContentLoaded', init);
