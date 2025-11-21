// ==================== STORAGE-API.JS ====================
// Intercepta localStorage e sincroniza com a API do servidor

(async function() {
  'use strict';
  
  const API_BASE_URL = window.location.origin + '/api';
  const CACHE = {};
  
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
      return null;
    }
  }
  
  // ==================== LOAD DATA FROM API ====================
  
  console.log('🔄 Carregando dados da API...');
  
  try {
    const [users, months, shifts, reservations, settings] = await Promise.all([
      callAPI('/users'),
      callAPI('/months'),
      callAPI('/shifts'),
      callAPI('/reservations'),
      callAPI('/settings')
    ]);
    
    // Populate cache with API data
    if (users) CACHE['users'] = JSON.stringify(users);
    if (months) CACHE['months'] = JSON.stringify(months);
    if (shifts) CACHE['shifts'] = JSON.stringify(shifts);
    if (reservations) CACHE['reservations'] = JSON.stringify(reservations);
    if (settings) CACHE['settings'] = JSON.stringify(settings);
    
    console.log('✅ Dados carregados da API:', {
      users: users?.length || 0,
      months: months?.length || 0,
      shifts: shifts?.length || 0,
      reservations: reservations?.length || 0
    });
  } catch (error) {
    console.error('❌ Erro ao carregar dados da API:', error);
  }
  
  // ==================== OVERRIDE localStorage ====================
  
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;
  
  Storage.prototype.setItem = function(key, value) {
    console.log(`💾 localStorage.setItem("${key}")`);
    
    // Update cache immediately
    CACHE[key] = value;
    
    // Sync to API in background
    (async () => {
      try {
        const data = JSON.parse(value);
        
        switch(key) {
          case 'users':
            // Sync users
            for (const user of data) {
              if (user.id) {
                await callAPI(`/users/${user.id}`, 'PUT', user);
              } else {
                const newUser = await callAPI('/users', 'POST', user);
                if (newUser) {
                  user.id = newUser.id;
                }
              }
            }
            break;
            
          case 'months':
            // Sync months
            for (const month of data) {
              if (month.id) {
                await callAPI(`/months/${month.id}`, 'PUT', month);
              } else {
                const newMonth = await callAPI('/months', 'POST', { year: month.year, month: month.month });
                if (newMonth) {
                  month.id = newMonth.id;
                }
              }
            }
            break;
            
          case 'shifts':
            // Shifts are created automatically by the server
            break;
            
          case 'reservations':
            // Sync reservations
            const currentReservations = await callAPI('/reservations');
            
            // Delete removed reservations
            if (currentReservations) {
              for (const current of currentReservations) {
                if (!data.find(r => r.id === current.id)) {
                  await callAPI(`/reservations/${current.id}`, 'DELETE');
                }
              }
            }
            
            // Create new reservations
            for (const reservation of data) {
              if (!currentReservations?.find(r => r.id === reservation.id)) {
                const newRes = await callAPI('/reservations', 'POST', {
                  shiftId: reservation.shiftId,
                  userId: reservation.userId
                });
                if (newRes) {
                  reservation.id = newRes.id;
                }
              }
            }
            break;
            
          case 'settings':
            await callAPI('/settings', 'PUT', data);
            break;
        }
        
        console.log(`✅ Sincronizado "${key}" com a API`);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar "${key}":`, error);
      }
    })();
    
    return;
  };
  
  Storage.prototype.getItem = function(key) {
    const value = CACHE[key] || null;
    console.log(`📖 localStorage.getItem("${key}"):`, value ? 'encontrado' : 'não encontrado');
    return value;
  };
  
  Storage.prototype.removeItem = function(key) {
    console.log(`🗑️ localStorage.removeItem("${key}")`);
    delete CACHE[key];
  };
  
  Storage.prototype.clear = function() {
    console.log(`🗑️ localStorage.clear()`);
    Object.keys(CACHE).forEach(key => delete CACHE[key]);
  };
  
  console.log('✅ storage-api.js inicializado com sucesso!');
  
})();
