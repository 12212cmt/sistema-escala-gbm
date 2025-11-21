// ==================== STORAGE-API.JS ====================
// Intercepta localStorage e sincroniza com a API do servidor
// Permite que o código existente funcione sem modificações

(function() {
  'use strict';
  
  const API_BASE_URL = window.location.origin + '/api';
  const CACHE = {};
  let isInitialized = false;
  
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
  
  // ==================== LOAD ALL DATA FROM API ====================
  
  async function loadAllDataFromAPI() {
    if (isInitialized) return;
    
    try {
      // Load all data from API into cache
      const [users, months, shifts, reservations, settings] = await Promise.all([
        callAPI('/users'),
        callAPI('/months'),
        callAPI('/shifts'),
        callAPI('/reservations'),
        callAPI('/settings')
      ]);
      
      CACHE['users'] = JSON.stringify(users);
      CACHE['months'] = JSON.stringify(months);
      CACHE['shifts'] = JSON.stringify(shifts);
      CACHE['reservations'] = JSON.stringify(reservations);
      CACHE['settings'] = JSON.stringify(settings);
      
      isInitialized = true;
    } catch (error) {
      console.error('Erro ao carregar dados da API:', error);
    }
  }
  
  // ==================== SYNC FUNCTIONS ====================
  
  async function syncUsersToAPI(users) {
    // Sync each user
    for (const user of users) {
      if (user.id) {
        // Update existing user
        await callAPI(`/users/${user.id}`, 'PUT', user);
      } else {
        // Create new user
        await callAPI('/users', 'POST', user);
      }
    }
  }
  
  async function syncMonthsToAPI(months) {
    for (const month of months) {
      if (month.id) {
        await callAPI(`/months/${month.id}`, 'PUT', month);
      } else {
        await callAPI('/months', 'POST', { year: month.year, month: month.month });
      }
    }
  }
  
  async function syncShiftsToAPI(shifts) {
    for (const shift of shifts) {
      if (shift.id) {
        await callAPI(`/shifts/${shift.id}`, 'PUT', shift);
      }
    }
  }
  
  async function syncReservationsToAPI(reservations) {
    // Get current reservations from API
    const currentReservations = await callAPI('/reservations');
    
    // Delete reservations that don't exist in the new list
    for (const current of currentReservations) {
      if (!reservations.find(r => r.id === current.id)) {
        await callAPI(`/reservations/${current.id}`, 'DELETE');
      }
    }
    
    // Create new reservations
    for (const reservation of reservations) {
      if (!currentReservations.find(r => r.id === reservation.id)) {
        await callAPI('/reservations', 'POST', {
          shiftId: reservation.shiftId,
          userId: reservation.userId
        });
      }
    }
  }
  
  async function syncSettingsToAPI(settings) {
    await callAPI('/settings', 'PUT', settings);
  }
  
  // ==================== OVERRIDE localStorage ====================
  
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;
  
  Storage.prototype.setItem = function(key, value) {
    // Update cache
    CACHE[key] = value;
    
    // Sync to API asynchronously
    (async () => {
      try {
        const data = JSON.parse(value);
        
        switch(key) {
          case 'users':
            await syncUsersToAPI(data);
            break;
          case 'months':
            await syncMonthsToAPI(data);
            break;
          case 'shifts':
            await syncShiftsToAPI(data);
            break;
          case 'reservations':
            await syncReservationsToAPI(data);
            break;
          case 'settings':
            await syncSettingsToAPI(data);
            break;
        }
        
        // Reload data from API to ensure consistency
        await loadAllDataFromAPI();
      } catch (error) {
        console.error(`Erro ao sincronizar ${key}:`, error);
      }
    })();
    
    // Don't actually save to localStorage
    return;
  };
  
  Storage.prototype.getItem = function(key) {
    // Return from cache
    return CACHE[key] || null;
  };
  
  Storage.prototype.removeItem = function(key) {
    delete CACHE[key];
  };
  
  Storage.prototype.clear = function() {
    Object.keys(CACHE).forEach(key => delete CACHE[key]);
  };
  
  // ==================== INITIALIZATION ====================
  
  // Load data when page loads
  window.addEventListener('DOMContentLoaded', async () => {
    await loadAllDataFromAPI();
  });
  
  // Expose reload function for manual refresh
  window.reloadDataFromAPI = loadAllDataFromAPI;
  
})();
