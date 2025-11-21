// ==================== API CONFIGURATION ====================
const API_BASE_URL = window.location.origin + '/api';

// ==================== HELPER FUNCTIONS ====================
async function callAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro desconhecido');
    }
    
    return result.data;
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
}

function showLoading(show = true) {
  let loader = document.getElementById('loadingOverlay');
  if (!loader && show) {
    loader = document.createElement('div');
    loader.id = 'loadingOverlay';
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    loader.innerHTML = '<div style="background:white;padding:30px;border-radius:12px;text-align:center;"><div style="font-size:18px;font-weight:600;margin-bottom:10px;">Carregando...</div><div style="color:#666;">Aguarde um momento</div></div>';
    document.body.appendChild(loader);
  } else if (loader && !show) {
    loader.remove();
  }
}

// ==================== DATA CACHE ====================
window.dataCache = {
  users: [],
  months: [],
  shifts: [],
  reservations: [],
  settings: {}
};

// ==================== API WRAPPER FUNCTIONS ====================

// Override localStorage functions to use API instead
const originalLocalStorage = {
  getItem: localStorage.getItem.bind(localStorage),
  setItem: localStorage.setItem.bind(localStorage),
  removeItem: localStorage.removeItem.bind(localStorage)
};

// Intercept localStorage.getItem
Storage.prototype.getItem = function(key) {
  // For non-escalas keys, use original localStorage
  if (!key.startsWith('escalas_')) {
    return originalLocalStorage.getItem(key);
  }
  
  // Return cached data
  if (key === 'escalas_users') {
    return JSON.stringify(window.dataCache.users);
  } else if (key === 'escalas_months') {
    return JSON.stringify(window.dataCache.months);
  } else if (key === 'escalas_shifts') {
    return JSON.stringify(window.dataCache.shifts);
  } else if (key === 'escalas_reservations') {
    return JSON.stringify(window.dataCache.reservations);
  } else if (key === 'escalas_settings') {
    return JSON.stringify(window.dataCache.settings);
  }
  
  return originalLocalStorage.getItem(key);
};

// Intercept localStorage.setItem to trigger API calls
Storage.prototype.setItem = function(key, value) {
  // For non-escalas keys, use original localStorage
  if (!key.startsWith('escalas_')) {
    return originalLocalStorage.setItem(key, value);
  }
  
  const data = JSON.parse(value);
  
  // Update cache
  if (key === 'escalas_users') {
    window.dataCache.users = data;
    syncUsers();
  } else if (key === 'escalas_months') {
    window.dataCache.months = data;
    syncMonths();
  } else if (key === 'escalas_shifts') {
    window.dataCache.shifts = data;
    syncShifts();
  } else if (key === 'escalas_reservations') {
    window.dataCache.reservations = data;
    syncReservations();
  } else if (key === 'escalas_settings') {
    window.dataCache.settings = data;
    syncSettings();
  }
};

// ==================== SYNC FUNCTIONS ====================

async function syncUsers() {
  // This is called after cache is updated, we need to sync with server
  // For now, we'll handle this in specific functions
}

async function syncMonths() {
  // Sync months with server
}

async function syncShifts() {
  // Sync shifts with server
}

async function syncReservations() {
  // Sync reservations with server
}

async function syncSettings() {
  // Sync settings with server
}

// ==================== LOAD INITIAL DATA ====================

async function loadAllData() {
  try {
    showLoading(true);
    
    // Load all data from server
    window.dataCache.users = await callAPI('/users');
    window.dataCache.months = await callAPI('/months');
    window.dataCache.settings = await callAPI('/settings');
    
    showLoading(false);
  } catch (error) {
    showLoading(false);
    console.error('Error loading data:', error);
  }
}

// ==================== OVERRIDE SPECIFIC FUNCTIONS ====================

// Override handleLogin
window.originalHandleLogin = window.handleLogin;
window.handleLogin = async function() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!username || !password) {
    alert('Por favor, preencha usuário e senha.');
    return;
  }
  
  showLoading(true);
  
  try {
    const user = await callAPI('/login', 'POST', { username, password });
    
    if (!user) {
      alert('Usuário ou senha inválidos, ou usuário desativado.');
      showLoading(false);
      return;
    }
    
    // Load all data
    await loadAllData();
    
    // Set current user
    window.currentUser = user;
    
    // Show app screen
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userRole').textContent = user.isAdmin ? 'Gestor' : 'Usuário';
    
    window.setupInterface();
    await window.loadMonthsDropdown();
    
    showLoading(false);
  } catch (error) {
    alert('Erro ao fazer login: ' + error.message);
    showLoading(false);
  }
};

// Override createMonth
window.originalCreateMonth = window.createMonth;
window.createMonth = async function() {
  const year = parseInt(document.getElementById('createMonthYear').value);
  const month = parseInt(document.getElementById('createMonthMonth').value);
  
  if (!year || !month) {
    alert('Por favor, selecione ano e mês.');
    return;
  }
  
  showLoading(true);
  
  try {
    const newMonth = await callAPI('/months', 'POST', { year, month });
    
    // Reload months
    window.dataCache.months = await callAPI('/months');
    
    // Close modal and reload
    window.closeCreateMonthModal();
    await window.loadMonthsDropdown();
    
    showLoading(false);
    alert('Mês criado com sucesso!');
  } catch (error) {
    alert('Erro ao criar mês: ' + error.message);
    showLoading(false);
  }
};

// Override deleteMonth
window.originalDeleteMonth = window.deleteMonth;
window.deleteMonth = async function() {
  if (!window.currentMonthId) {
    alert('Nenhum mês selecionado.');
    return;
  }
  
  if (!confirm('Tem certeza que deseja excluir este mês? Todos os turnos e reservas serão perdidos!')) {
    return;
  }
  
  showLoading(true);
  
  try {
    await callAPI(`/months/${window.currentMonthId}`, 'DELETE');
    
    // Reload data
    window.dataCache.months = await callAPI('/months');
    window.currentMonthId = null;
    
    await window.loadMonthsDropdown();
    
    showLoading(false);
    alert('Mês excluído com sucesso!');
  } catch (error) {
    alert('Erro ao excluir mês: ' + error.message);
    showLoading(false);
  }
};

// Override toggleMonthActive
window.originalToggleMonthActive = window.toggleMonthActive;
window.toggleMonthActive = async function() {
  if (!window.currentMonthId) {
    alert('Nenhum mês selecionado.');
    return;
  }
  
  showLoading(true);
  
  try {
    const month = window.dataCache.months.find(m => m.id === window.currentMonthId);
    
    await callAPI(`/months/${window.currentMonthId}`, 'PUT', {
      ...month,
      isActive: !month.isActive
    });
    
    // Reload months
    window.dataCache.months = await callAPI('/months');
    
    await window.loadSchedule();
    
    showLoading(false);
  } catch (error) {
    alert('Erro ao atualizar mês: ' + error.message);
    showLoading(false);
  }
};

// Override loadSchedule
window.originalLoadSchedule = window.loadSchedule;
window.loadSchedule = async function() {
  if (!window.currentMonthId) {
    document.getElementById('scheduleContent').innerHTML = '<p style="text-align:center;color:#666;padding:40px;">Selecione um mês para visualizar a escala.</p>';
    return;
  }
  
  showLoading(true);
  
  try {
    // Load shifts and reservations for this month
    window.dataCache.shifts = await callAPI(`/shifts?monthId=${window.currentMonthId}`);
    window.dataCache.reservations = await callAPI(`/reservations?monthId=${window.currentMonthId}`);
    
    // Call original function to render
    if (window.originalLoadSchedule) {
      window.originalLoadSchedule();
    }
    
    showLoading(false);
  } catch (error) {
    alert('Erro ao carregar escala: ' + error.message);
    showLoading(false);
  }
};

// Override handleSlotClick
window.originalHandleSlotClick = window.handleSlotClick;
window.handleSlotClick = async function(shiftId, reservationId) {
  showLoading(true);
  
  try {
    if (reservationId) {
      // Delete reservation
      await callAPI(`/reservations/${reservationId}`, 'DELETE');
    } else {
      // Create reservation
      await callAPI('/reservations', 'POST', {
        shiftId: shiftId,
        userId: window.currentUser.id
      });
    }
    
    // Reload schedule
    await window.loadSchedule();
    
    showLoading(false);
  } catch (error) {
    alert('Erro ao atualizar reserva: ' + error.message);
    showLoading(false);
  }
};

// Override saveUser
window.originalSaveUser = window.saveUser;
window.saveUser = async function() {
  const userId = window.editingUserId;
  const fullName = document.getElementById('userFullName').value.trim();
  const cpf = document.getElementById('userCPF').value.trim();
  const login = document.getElementById('userLogin').value.trim();
  const password = document.getElementById('userPassword').value.trim();
  
  if (!fullName || !cpf || !login || !password) {
    alert('Por favor, preencha todos os campos.');
    return;
  }
  
  showLoading(true);
  
  try {
    const userData = {
      fullName,
      cpf,
      login,
      password,
      isAdmin: false,
      isActive: true
    };
    
    if (userId) {
      // Update
      await callAPI(`/users/${userId}`, 'PUT', { ...userData, id: userId });
    } else {
      // Create
      await callAPI('/users', 'POST', userData);
    }
    
    // Reload users
    window.dataCache.users = await callAPI('/users');
    
    window.closeUserModal();
    await window.loadUsersTable();
    
    showLoading(false);
    alert('Usuário salvo com sucesso!');
  } catch (error) {
    alert('Erro ao salvar usuário: ' + error.message);
    showLoading(false);
  }
};

// Override deleteUser
window.originalDeleteUser = window.deleteUser;
window.deleteUser = async function(userId) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) {
    return;
  }
  
  showLoading(true);
  
  try {
    await callAPI(`/users/${userId}`, 'DELETE');
    
    // Reload users
    window.dataCache.users = await callAPI('/users');
    
    await window.loadUsersTable();
    
    showLoading(false);
    alert('Usuário excluído com sucesso!');
  } catch (error) {
    alert('Erro ao excluir usuário: ' + error.message);
    showLoading(false);
  }
};

// Override saveSettings
window.originalSaveSettings = window.saveSettings;
window.saveSettings = async function() {
  const value12h = parseFloat(document.getElementById('value12h').value);
  const valueIntegral = parseFloat(document.getElementById('valueIntegral').value);
  
  if (isNaN(value12h) || isNaN(valueIntegral)) {
    alert('Por favor, preencha valores válidos.');
    return;
  }
  
  showLoading(true);
  
  try {
    await callAPI('/settings', 'PUT', {
      value12h,
      valueIntegral
    });
    
    // Reload settings
    window.dataCache.settings = await callAPI('/settings');
    
    showLoading(false);
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    alert('Erro ao salvar configurações: ' + error.message);
    showLoading(false);
  }
};

console.log('✅ API integration loaded successfully');
