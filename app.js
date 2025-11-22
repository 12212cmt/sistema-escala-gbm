// ===== CONFIGURAÇÃO =====
const SUPABASE_URL = 'https://rizprzmjxrspctlivfyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpenByem1qeHJzcGN0bGl2ZnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODA3NDQsImV4cCI6MjA3OTM1Njc0NH0.D-5G3eQTRr1bK607zOfvdDzomwJkRFvl8MHTJLsJuXg';

// Variável global para o cliente Supabase
let supabaseClient;

// Estado
let currentUser = null;
let currentProfile = null;
let currentMonthId = null;

// DOM
let authView, appView, registerExtra;

// Utilitário: converte warname em email interno
function warToEmail(w){ return `${w}@interno.project`; }

// ---------- Inicialização ----------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inicializa supabase só agora
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Referências DOM
    authView = document.getElementById('authView');
    appView = document.getElementById('appView');
    registerExtra = document.getElementById('registerExtra');

    attachHandlers();

    // Checa sessão atual
    const { data } = await supabaseClient.auth.getSession();
    if(data && data.session){
      await fetchProfile(data.session.user);
      showApp();
    } else {
      showAuth();
    }
  } catch(e){
    console.error("Erro inicializando app:", e);
  }
});

function showAuth(){ authView.style.display='block'; appView.style.display='none'; }
function showApp(){ authView.style.display='none'; appView.style.display='block'; }

// ---------- Eventos ----------
function attachHandlers(){
  document.getElementById('btnLogin').onclick = login;
  document.getElementById('btnRegister').onclick = ()=> registerExtra.style.display = 'block';
  document.getElementById('btnFinishRegister').onclick = register;
  document.getElementById('btnLogout').onclick = logout;
}

// ---------- Auth ----------
async function login(){
  const war = document.getElementById('warname').value.trim();
  const pass = document.getElementById('password').value.trim();
  if(!war || !pass){ alert('Preencha nome de guerra e senha'); return; }
  const email = warToEmail(war);

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if(error){ alert('Erro login: '+error.message); return; }
    await fetchProfile(data.user);
    showApp();
  } catch(e){
    console.error("Erro login:", e);
    alert("Erro ao tentar logar");
  }
}

async function register(){
  const war = document.getElementById('warname').value.trim();
  const pass = document.getElementById('password').value.trim();
  const full = document.getElementById('fullName').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  if(!war||!pass||!full||!cpf){ alert('Preencha todos os campos'); return; }
  const email = warToEmail(war);

  try {
    // Cadastro
    const { data, error } = await supabaseClient.auth.signUp({ email, password: pass });
    if(error){ alert('Erro registro: '+error.message); return; }

    // login imediato
    const s = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if(s.error){ alert('Erro login após registro: '+s.error.message); return; }

    const user = s.data.user;

    // criar profile
    const p = await supabaseClient.from('profiles').insert({
      id: user.id,
      warname: war,
      full_name: full,
      cpf: cpf
    });
    if(p.error){ alert('Erro ao criar perfil: '+p.error.message); return; }

    await fetchProfile(user);
    showApp();

  } catch(e){
    console.error("Erro register:", e);
    alert("Erro ao tentar registrar");
  }
}

async function fetchProfile(user){
  currentUser = user;
  try {
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
    if(error){ console.warn('Erro fetchProfile:', error); currentProfile = null; return; }
    currentProfile = data;
    document.getElementById('whoDisplay').textContent = currentProfile.full_name || currentProfile.warname;
    document.getElementById('roleDisplay').textContent = currentProfile.is_admin ? 'Gestor' : 'Usuário';
  } catch(e){
    console.error("Erro fetchProfile:", e);
  }
}

async function logout(){
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  showAuth();
}
