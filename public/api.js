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

// ==================== API WRAPPER OBJECT ====================
window.API = {
  async getUsers() {
    return await callAPI('/users');
  },
  
  async getMonths() {
    return await callAPI('/months');
  },
  
  async getShifts(monthId) {
    return await callAPI(`/shifts?monthId=${monthId}`);
  },
  
  async getReservations(monthId) {
    return await callAPI(`/reservations?monthId=${monthId}`);
  },
  
  async getSettings() {
    return await callAPI('/settings');
  },
  
  async login(username, password) {
    return await callAPI('/login', 'POST', { username, password });
  },
  
  async createUser(userData) {
    return await callAPI('/users', 'POST', userData);
  },
  
  async updateUser(userId, userData) {
    return await callAPI(`/users/${userId}`, 'PUT', userData);
  },
  
  async deleteUser(userId) {
    return await callAPI(`/users/${userId}`, 'DELETE');
  },
  
  async createMonth(year, month) {
    return await callAPI('/months', 'POST', { year, month });
  },
  
  async updateMonth(monthId, monthData) {
    return await callAPI(`/months/${monthId}`, 'PUT', monthData);
  },
  
  async deleteMonth(monthId) {
    return await callAPI(`/months/${monthId}`, 'DELETE');
  },
  
  async createReservation(shiftId, userId) {
    return await callAPI('/reservations', 'POST', { shiftId, userId });
  },
  
  async deleteReservation(reservationId) {
    return await callAPI(`/reservations/${reservationId}`, 'DELETE');
  },
  
  async updateSettings(settings) {
    return await callAPI('/settings', 'PUT', settings);
  },
  
  async updateShift(shiftId, shiftData) {
    return await callAPI(`/shifts/${shiftId}`, 'PUT', shiftData);
  }
};

// ==================== OVERRIDE FUNCTIONS ====================

// Override handleLogin
const originalHandleLogin = window.handleLogin;
window.handleLogin = async function() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!username || !password) {
    alert('Por favor, preencha usuário e senha.');
    return;
  }
  
  showLoading(true);
  
  try {
    const user = await API.login(username, password);
    
    if (!user) {
      alert('Usuário ou senha inválidos, ou usuário desativado.');
      showLoading(false);
      return;
    }
    
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

// Override loadMonthsDropdown
const originalLoadMonthsDropdown = window.loadMonthsDropdown;
window.loadMonthsDropdown = async function() {
  showLoading(true);
  try {
    const months = await API.getMonths();
    const select = document.getElementById('monthSelect');
    
    select.innerHTML = '<option value="">Selecione um mês</option>';
    
    // Show only active months for regular users
    const availableMonths = window.currentUser.isAdmin ? months : months.filter(m => m.isActive);
    
    availableMonths.forEach(month => {
      const option = document.createElement('option');
      option.value = month.id;
      const monthName = new Date(month.year, month.month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      option.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      if (!month.isActive) {
        option.textContent += ' (Inativo)';
      }
      select.appendChild(option);
    });
    
    showLoading(false);
  } catch (error) {
    showLoading(false);
    alert('Erro ao carregar meses: ' + error.message);
  }
};

// Override createMonth
const originalCreateMonth = window.createMonth;
window.createMonth = async function() {
  const year = parseInt(document.getElementById('createMonthYear').value);
  const month = parseInt(document.getElementById('createMonthMonth').value);
  
  if (!year || !month) {
    alert('Por favor, selecione ano e mês.');
    return;
  }
  
  showLoading(true);
  
  try {
    await API.createMonth(year, month);
    
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
const originalDeleteMonth = window.deleteMonth;
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
    await API.deleteMonth(window.currentMonthId);
    
    window.currentMonthId = null;
    await window.loadMonthsDropdown();
    document.getElementById('scheduleContent').innerHTML = '<p style="text-align:center;color:#666;padding:40px;">Selecione um mês para visualizar a escala.</p>';
    
    showLoading(false);
    alert('Mês excluído com sucesso!');
  } catch (error) {
    alert('Erro ao excluir mês: ' + error.message);
    showLoading(false);
  }
};

// Override toggleMonthActive
const originalToggleMonthActive = window.toggleMonthActive;
window.toggleMonthActive = async function() {
  if (!window.currentMonthId) {
    alert('Nenhum mês selecionado.');
    return;
  }
  
  showLoading(true);
  
  try {
    const months = await API.getMonths();
    const month = months.find(m => m.id === window.currentMonthId);
    
    if (!month) {
      throw new Error('Mês não encontrado');
    }
    
    await API.updateMonth(window.currentMonthId, {
      ...month,
      isActive: !month.isActive
    });
    
    await window.loadMonthsDropdown();
    await window.loadSchedule();
    
    showLoading(false);
    alert(`Mês ${month.isActive ? 'desativado' : 'ativado'} com sucesso!`);
  } catch (error) {
    alert('Erro ao atualizar mês: ' + error.message);
    showLoading(false);
  }
};

// Override loadSchedule
const originalLoadSchedule = window.loadSchedule;
window.loadSchedule = async function() {
  if (!window.currentMonthId) {
    document.getElementById('scheduleContent').innerHTML = '<p style="text-align:center;color:#666;padding:40px;">Selecione um mês para visualizar a escala.</p>';
    return;
  }
  
  showLoading(true);
  
  try {
    const months = await API.getMonths();
    const month = months.find(m => m.id === window.currentMonthId);
    
    if (!month) {
      throw new Error('Mês não encontrado');
    }
    
    const shifts = await API.getShifts(window.currentMonthId);
    const reservations = await API.getReservations(window.currentMonthId);
    const users = await API.getUsers();
    
    // Build schedule HTML
    const daysInMonth = new Date(month.year, month.month, 0).getDate();
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = '';
    
    // Process in blocks of 10 days
    for (let blockStart = 1; blockStart <= daysInMonth; blockStart += 10) {
      const blockEnd = Math.min(blockStart + 9, daysInMonth);
      
      html += '<div style="margin-bottom: 30px;">';
      html += '<table class="schedule-table">';
      html += '<thead><tr><th>Turno</th>';
      
      for (let day = blockStart; day <= blockEnd; day++) {
        const date = new Date(month.year, month.month - 1, day);
        const dayOfWeek = weekDays[date.getDay()];
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        html += `<th style="${isWeekend ? 'background:#ffe6e6;' : ''}">${day}<br><small>${dayOfWeek}</small></th>`;
      }
      
      html += '</tr></thead><tbody>';
      
      // Turnos: Integral, Diurno, Noturno
      const turnos = [
        { code: 'I', name: 'Integral' },
        { code: 'D', name: 'Diurno' },
        { code: 'N', name: 'Noturno' }
      ];
      
      turnos.forEach(turno => {
        html += `<tr><td><strong>${turno.name}</strong></td>`;
        
        for (let day = blockStart; day <= blockEnd; day++) {
          const dayShifts = shifts.filter(s => s.day === day && s.type === turno.code);
          
          html += '<td>';
          
          dayShifts.forEach(shift => {
            const shiftReservations = reservations.filter(r => r.shiftId === shift.id);
            const available = shift.capacity - shiftReservations.length;
            const userReservation = shiftReservations.find(r => r.userId === window.currentUser.id);
            
            if (userReservation) {
              html += `<div class="slot my-reservation" onclick="handleSlotClick(${shift.id}, ${userReservation.id})">${window.currentUser.fullName.split(' ')[0]}</div>`;
            } else if (available > 0 && (!month.isActive && !window.currentUser.isAdmin)) {
              html += `<div class="slot unavailable">Inativo</div>`;
            } else if (available > 0) {
              html += `<div class="slot available" onclick="handleSlotClick(${shift.id}, null)">Disponível (${available})</div>`;
            } else {
              const otherUsers = shiftReservations.map(r => {
                const user = users.find(u => u.id === r.userId);
                return user ? user.fullName.split(' ')[0] : 'Usuário';
              }).join(', ');
              html += `<div class="slot full">${otherUsers}</div>`;
            }
          });
          
          html += '</td>';
        }
        
        html += '</tr>';
      });
      
      html += '</tbody></table></div>';
    }
    
    document.getElementById('scheduleContent').innerHTML = html;
    showLoading(false);
  } catch (error) {
    alert('Erro ao carregar escala: ' + error.message);
    showLoading(false);
  }
};

// Override handleSlotClick
window.handleSlotClick = async function(shiftId, reservationId) {
  showLoading(true);
  
  try {
    if (reservationId) {
      // Delete reservation
      await API.deleteReservation(reservationId);
    } else {
      // Create reservation
      await API.createReservation(shiftId, window.currentUser.id);
    }
    
    // Reload schedule
    await window.loadSchedule();
    
    showLoading(false);
  } catch (error) {
    alert('Erro ao atualizar reserva: ' + error.message);
    showLoading(false);
  }
};

// Override loadUsersTable
const originalLoadUsersTable = window.loadUsersTable;
window.loadUsersTable = async function() {
  showLoading(true);
  try {
    const users = await API.getUsers();
    const tbody = document.querySelector('#usersTab table tbody');
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.fullName}</td>
        <td>${user.cpf}</td>
        <td>${user.login}</td>
        <td>${user.isAdmin ? 'Gestor' : 'Usuário'}</td>
        <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn-action btn-edit" onclick="editUser(${user.id})">Editar</button>
          <button class="btn-action btn-warning" onclick="toggleUserActive(${user.id})">${user.isActive ? 'Desativar' : 'Ativar'}</button>
          <button class="btn-action btn-danger" onclick="deleteUser(${user.id})">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    showLoading(false);
  } catch (error) {
    showLoading(false);
    alert('Erro ao carregar usuários: ' + error.message);
  }
};

// Override saveUser
const originalSaveUser = window.saveUser;
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
      await API.updateUser(userId, { ...userData, id: userId });
    } else {
      await API.createUser(userData);
    }
    
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
window.deleteUser = async function(userId) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) {
    return;
  }
  
  showLoading(true);
  
  try {
    await API.deleteUser(userId);
    await window.loadUsersTable();
    
    showLoading(false);
    alert('Usuário excluído com sucesso!');
  } catch (error) {
    alert('Erro ao excluir usuário: ' + error.message);
    showLoading(false);
  }
};

// Override toggleUserActive
window.toggleUserActive = async function(userId) {
  showLoading(true);
  
  try {
    const users = await API.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    await API.updateUser(userId, {
      ...user,
      isActive: !user.isActive
    });
    
    await window.loadUsersTable();
    
    showLoading(false);
    alert(`Usuário ${user.isActive ? 'desativado' : 'ativado'} com sucesso!`);
  } catch (error) {
    alert('Erro ao atualizar usuário: ' + error.message);
    showLoading(false);
  }
};

// Override loadSettings
const originalLoadSettings = window.loadSettings;
window.loadSettings = async function() {
  showLoading(true);
  try {
    const settings = await API.getSettings();
    
    document.getElementById('value12h').value = settings.value12h || 125;
    document.getElementById('valueIntegral').value = settings.valueIntegral || 250;
    
    showLoading(false);
  } catch (error) {
    showLoading(false);
    alert('Erro ao carregar configurações: ' + error.message);
  }
};

// Override saveSettings
const originalSaveSettings = window.saveSettings;
window.saveSettings = async function() {
  const value12h = parseFloat(document.getElementById('value12h').value);
  const valueIntegral = parseFloat(document.getElementById('valueIntegral').value);
  
  if (isNaN(value12h) || isNaN(valueIntegral)) {
    alert('Por favor, preencha valores válidos.');
    return;
  }
  
  showLoading(true);
  
  try {
    await API.updateSettings({
      value12h,
      valueIntegral
    });
    
    showLoading(false);
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    alert('Erro ao salvar configurações: ' + error.message);
    showLoading(false);
  }
};

// Override exportToCSV
const originalExportToCSV = window.exportToCSV;
window.exportToCSV = async function() {
  if (!window.currentMonthId) {
    alert('Selecione um mês para exportar.');
    return;
  }
  
  showLoading(true);
  
  try {
    const months = await API.getMonths();
    const month = months.find(m => m.id === window.currentMonthId);
    const shifts = await API.getShifts(window.currentMonthId);
    const reservations = await API.getReservations(window.currentMonthId);
    const users = await API.getUsers();
    const settings = await API.getSettings();
    
    const daysInMonth = new Date(month.year, month.month, 0).getDate();
    
    // Build CSV
    let csv = 'NOME,CPF,';
    for (let day = 1; day <= daysInMonth; day++) {
      csv += `${day.toString().padStart(2, '0')},`;
    }
    csv += 'VALOR,CONFLITOS\n';
    
    // For each user
    users.forEach(user => {
      const userReservations = reservations.filter(r => r.userId === user.id);
      
      if (userReservations.length === 0) return;
      
      csv += `${user.fullName},${user.cpf},`;
      
      let totalValue = 0;
      const conflicts = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayReservations = userReservations.filter(r => {
          const shift = shifts.find(s => s.id === r.shiftId);
          return shift && shift.day === day;
        });
        
        if (dayReservations.length === 0) {
          csv += ',';
        } else {
          const types = dayReservations.map(r => {
            const shift = shifts.find(s => s.id === r.shiftId);
            return shift ? shift.type : '';
          });
          
          csv += types.join('+') + ',';
          
          // Calculate value
          types.forEach(type => {
            if (type === 'I') {
              totalValue += settings.valueIntegral || 250;
            } else {
              totalValue += settings.value12h || 125;
            }
          });
          
          // Check conflicts
          if (types.includes('I') && types.length > 1) {
            conflicts.push(`Dia ${day}: Integral + outro turno`);
          } else if (types.includes('D') && types.includes('N')) {
            conflicts.push(`Dia ${day}: Diurno + Noturno`);
          }
        }
      }
      
      csv += `${totalValue.toFixed(2)},`;
      csv += conflicts.length > 0 ? `"${conflicts.join('; ')}"` : 'Nenhum';
      csv += '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `escalas_${month.month}_${month.year}.csv`;
    link.click();
    
    showLoading(false);
  } catch (error) {
    alert('Erro ao exportar CSV: ' + error.message);
    showLoading(false);
  }
};

console.log('✅ API integration loaded successfully');
