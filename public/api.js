// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Helper function to call API
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
    alert('Erro ao comunicar com o servidor: ' + error.message);
    throw error;
  }
}

// Loading overlay
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

// API Functions
const API = {
  // Auth
  login: (username, password) => callAPI('/login', 'POST', { username, password }),
  
  // Users
  getUsers: () => callAPI('/users'),
  createUser: (user) => callAPI('/users', 'POST', user),
  updateUser: (user) => callAPI(`/users/${user.id}`, 'PUT', user),
  deleteUser: (userId) => callAPI(`/users/${userId}`, 'DELETE'),
  
  // Months
  getMonths: () => callAPI('/months'),
  createMonth: (year, month) => callAPI('/months', 'POST', { year, month }),
  updateMonth: (month) => callAPI(`/months/${month.id}`, 'PUT', month),
  deleteMonth: (monthId) => callAPI(`/months/${monthId}`, 'DELETE'),
  
  // Shifts
  getShifts: (monthId) => callAPI(`/shifts?monthId=${monthId}`),
  updateShift: (shift) => callAPI(`/shifts/${shift.id}`, 'PUT', shift),
  
  // Reservations
  getReservations: (monthId) => callAPI(`/reservations?monthId=${monthId}`),
  createReservation: (reservation) => callAPI('/reservations', 'POST', reservation),
  deleteReservation: (reservationId) => callAPI(`/reservations/${reservationId}`, 'DELETE'),
  
  // Settings
  getSettings: () => callAPI('/settings'),
  updateSettings: (settings) => callAPI('/settings', 'PUT', settings)
};
