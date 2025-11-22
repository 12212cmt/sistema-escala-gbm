// Admin functions using Supabase
let currentUser = null;

// Check authentication
function checkAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = getCurrentUser();
  if (!currentUser.isadmin) {
    window.location.href = 'escalas.html';
    return;
  }
  
  document.getElementById('headerUserName').textContent = currentUser.fullname;
}

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
  
  if (tabName === 'meses') loadMonths();
  if (tabName === 'usuarios') loadUsers();
  if (tabName === 'config') loadSettings();
}

// ==================== MONTHS ====================

async function loadMonths() {
  try {
    const { data, error } = await supabase
      .from('months')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) throw error;
    
    const container = document.getElementById('monthsList');
    container.innerHTML = '';
    
    if (data.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum mês cadastrado</div>';
      return;
    }
    
    data.forEach(month => {
      const div = document.createElement('div');
      div.className = 'month-item';
      div.innerHTML = `
        <div class="month-info">
          <div class="month-name">${getMonthName(month.month)}/${month.year}</div>
          <div class="month-status">${month.isactive ? 'Ativo' : 'Inativo'}</div>
        </div>
        <div class="month-actions">
          <button class="btn-small btn-toggle ${!month.isactive ? 'inactive' : ''}" onclick="toggleMonth(${month.id})">
            ${month.isactive ? 'Desativar' : 'Ativar'}
          </button>
          <button class="btn-small btn-delete" onclick="deleteMonth(${month.id})">Excluir</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar meses:', error);
    alert('Erro ao carregar meses');
  }
}

async function createMonth() {
  const month = document.getElementById('newMonth').value;
  const year = document.getElementById('newYear').value;
  
  if (!month || !year) {
    alert('Por favor, preencha todos os campos');
    return;
  }
  
  try {
    // Create month
    const { data: newMonth, error: monthError } = await supabase
      .from('months')
      .insert([{
        year: parseInt(year),
        month: parseInt(month),
        isactive: false
      }])
      .select()
      .single();
    
    if (monthError) throw monthError;
    
    // Create shifts for this month
    const daysInMonth = new Date(year, month, 0).getDate();
    const shiftTypes = ['I', 'D', 'N'];
    const shifts = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      shiftTypes.forEach(type => {
        shifts.push({
          monthid: newMonth.id,
          day,
          type,
          capacity: 3
        });
      });
    }
    
    const { error: shiftsError } = await supabase
      .from('shifts')
      .insert(shifts);
    
    if (shiftsError) throw shiftsError;
    
    alert('Mês criado com sucesso!');
    loadMonths();
    
    // Clear form
    document.getElementById('newMonth').value = '';
    document.getElementById('newYear').value = '';
  } catch (error) {
    console.error('Erro ao criar mês:', error);
    alert('Erro ao criar mês: ' + error.message);
  }
}

async function toggleMonth(monthId) {
  try {
    // Get current month
    const { data: month, error: getError } = await supabase
      .from('months')
      .select('*')
      .eq('id', monthId)
      .single();
    
    if (getError) throw getError;
    
    // Update month
    const { error: updateError } = await supabase
      .from('months')
      .update({ isactive: !month.isactive })
      .eq('id', monthId);
    
    if (updateError) throw updateError;
    
    loadMonths();
  } catch (error) {
    console.error('Erro ao alterar mês:', error);
    alert('Erro ao alterar mês');
  }
}

async function deleteMonth(monthId) {
  if (!confirm('Tem certeza que deseja excluir este mês? Todas as reservas serão perdidas!')) {
    return;
  }
  
  try {
    // Get shift IDs
    const { data: shifts } = await supabase
      .from('shifts')
      .select('id')
      .eq('monthid', monthId);
    
    const shiftIds = shifts.map(s => s.id);
    
    // Delete reservations
    if (shiftIds.length > 0) {
      await supabase
        .from('reservations')
        .delete()
        .in('shiftid', shiftIds);
    }
    
    // Delete shifts
    await supabase
      .from('shifts')
      .delete()
      .eq('monthid', monthId);
    
    // Delete month
    const { error } = await supabase
      .from('months')
      .delete()
      .eq('id', monthId);
    
    if (error) throw error;
    
    alert('Mês excluído com sucesso!');
    loadMonths();
  } catch (error) {
    console.error('Erro ao excluir mês:', error);
    alert('Erro ao excluir mês');
  }
}

function getMonthName(month) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return months[month - 1];
}

// ==================== USERS ====================

async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id');
    
    if (error) throw error;
    
    const container = document.getElementById('usersList');
    container.innerHTML = '';
    
    if (data.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum usuário cadastrado</div>';
      return;
    }
    
    data.forEach(user => {
      const div = document.createElement('div');
      div.className = 'user-item';
      div.innerHTML = `
        <div class="user-info">
          <div class="user-name">${user.fullname}</div>
          <div class="user-details">
            <span>CPF: ${user.cpf}</span>
            <span>Login: ${user.login}</span>
            <span>${user.isadmin ? 'Administrador' : 'Usuário'}</span>
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    alert('Erro ao carregar usuários');
  }
}

function openUserModal() {
  document.getElementById('userModal').classList.add('show');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('show');
  document.getElementById('userName').value = '';
  document.getElementById('userCPF').value = '';
  document.getElementById('userLogin').value = '';
  document.getElementById('userPassword').value = '';
}

async function saveUser() {
  const name = document.getElementById('userName').value.trim();
  const cpf = document.getElementById('userCPF').value.trim();
  const username = document.getElementById('userLogin').value.trim();
  const password = document.getElementById('userPassword').value;
  
  if (!name || !cpf || !username || !password) {
    alert('Por favor, preencha todos os campos');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        fullname: name,
        cpf: cpf,
        login: username,
        password: password,
        isadmin: false,
        isactive: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    alert('Usuário criado com sucesso!');
    closeUserModal();
    loadUsers();
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    alert('Erro ao criar usuário: ' + error.message);
  }
}

// ==================== SETTINGS ====================

async function loadSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) throw error;
    
    document.getElementById('value12h').value = data.value12h;
    document.getElementById('valueIntegral').value = data.valueintegral;
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    alert('Erro ao carregar configurações');
  }
}

async function saveSettings() {
  const value12h = parseFloat(document.getElementById('value12h').value);
  const valueIntegral = parseFloat(document.getElementById('valueIntegral').value);
  
  if (isNaN(value12h) || isNaN(valueIntegral)) {
    alert('Por favor, insira valores válidos');
    return;
  }
  
  try {
    // Get the first settings record
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();
    
    const { error } = await supabase
      .from('settings')
      .update({
        value12h: value12h,
        valueintegral: valueIntegral
      })
      .eq('id', existing.id);
    
    if (error) throw error;
    
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações');
  }
}

// Initialize
checkAuth();
loadMonths();
