// Configuração do cliente Supabase
const SUPABASE_URL = 'https://dymgizqguhbsijhdcuju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bWdpenFndWhic2lqaGRjdWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzE4MDYsImV4cCI6MjA3OTM0NzgwNn0.rDu3NsgznPX8wJhzA3McvSV1Vpsd-OmcHgQtNqoeVT4';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper para armazenar usuário logado
const AUTH_STORAGE_KEY = 'gbm_current_user';

// Salvar usuário no localStorage
function saveCurrentUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

// Obter usuário do localStorage
function getCurrentUser() {
  const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

// Limpar usuário do localStorage
function clearCurrentUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Verificar se usuário está logado
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Verificar se usuário é admin
function isAdmin() {
  const user = getCurrentUser();
  return user && user.isadmin === true;
}

// Fazer logout
function logout() {
  clearCurrentUser();
  window.location.href = '/index.html';
}
