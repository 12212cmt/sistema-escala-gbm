// Escalas functions using Supabase
let currentUser = null;
let currentMonth = null;
let shifts = [];
let reservations = [];
let settings = { value12h: 125, valueintegral: 250 };

// Check authentication
function checkAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = getCurrentUser();
  document.getElementById('userName').textContent = currentUser.fullname;
  document.getElementById('userType').textContent = currentUser.isadmin ? 'Administrador' : 'Usuário';
}

// Load months
async function loadMonths() {
  try {
    const { data, error } = await supabase
      .from('months')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) throw error;
    
    const select = document.getElementById('monthSelect');
    select.innerHTML = '<option value="">Selecione um mês</option>';
    
    data.forEach(month => {
      const option = document.createElement('option');
      option.value = month.id;
      option.textContent = `${getMonthName(month.month)}/${month.year}`;
      if (month.isactive) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    // Load first active month
    const activeMonth = data.find(m => m.isactive);
    if (activeMonth) {
      select.value = activeMonth.id;
      await loadMonth(activeMonth.id);
    }
  } catch (error) {
    console.error('Erro ao carregar meses:', error);
    alert('Erro ao carregar meses');
  }
}

// Load month data
async function loadMonth(monthId) {
  if (!monthId) {
    document.getElementById('calendar').innerHTML = '<div class="empty-state">Selecione um mês</div>';
    return;
  }
  
  try {
    document.getElementById('loading').classList.add('show');
    
    // Load all data in parallel
    const [monthsResult, shiftsResult, reservationsResult, settingsResult] = await Promise.all([
      supabase.from('months').select('*').eq('id', monthId).single(),
      supabase.from('shifts').select('*').eq('monthid', monthId).order('day').order('type'),
      supabase.from('reservations').select('*'),
      supabase.from('settings').select('*').limit(1).single()
    ]);
    
    if (monthsResult.error) throw monthsResult.error;
    if (shiftsResult.error) throw shiftsResult.error;
    if (settingsResult.error) throw settingsResult.error;
    
    currentMonth = monthsResult.data;
    shifts = shiftsResult.data;
    settings = settingsResult.data;
    
    // Filter reservations for this month's shifts
    const shiftIds = shifts.map(s => s.id);
    reservations = reservationsResult.data.filter(r => shiftIds.includes(r.shiftid));
    
    renderCalendar();
    updateSummary();
  } catch (error) {
    console.error('Erro ao carregar mês:', error);
    alert('Erro ao carregar dados do mês');
  } finally {
    document.getElementById('loading').classList.remove('show');
  }
}

// Render calendar
function renderCalendar() {
  const container = document.getElementById('calendar');
  container.innerHTML = '';
  
  if (!currentMonth || shifts.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum dado disponível</div>';
    return;
  }
  
  const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayShifts = shifts.filter(s => s.day === day);
    const date = new Date(currentMonth.year, currentMonth.month - 1, day);
    const dayName = getDayName(date.getDay());
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-card';
    dayDiv.innerHTML = `
      <div class="day-header">
        <span class="day-number">${day}</span>
        <span class="day-name">${dayName}</span>
      </div>
      <div class="shifts" id="shifts-${day}"></div>
    `;
    
    container.appendChild(dayDiv);
    
    // Render shifts for this day
    dayShifts.forEach(shift => {
      const shiftReservations = reservations.filter(r => r.shiftid === shift.id);
      const myReservation = shiftReservations.find(r => r.userid === currentUser.id);
      const isFull = shiftReservations.length >= shift.capacity;
      
      const shiftDiv = document.createElement('div');
      shiftDiv.className = 'shift';
      
      let buttonClass = 'shift-btn';
      if (myReservation) {
        buttonClass += ' reserved';
      } else if (isFull) {
        buttonClass += ' full';
      }
      
      shiftDiv.innerHTML = `
        <button class="${buttonClass}" onclick="toggleReservation(${shift.id})" ${isFull && !myReservation ? 'disabled' : ''}>
          <span class="shift-type">${shift.type}</span>
          <span class="shift-count">${shiftReservations.length}/${shift.capacity}</span>
        </button>
      `;
      
      document.getElementById(`shifts-${day}`).appendChild(shiftDiv);
    });
  }
}

// Toggle reservation
async function toggleReservation(shiftId) {
  const shift = shifts.find(s => s.id === shiftId);
  const shiftReservations = reservations.filter(r => r.shiftid === shiftId);
  const myReservation = shiftReservations.find(r => r.userid === currentUser.id);
  
  try {
    if (myReservation) {
      // Remove reservation
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', myReservation.id);
      
      if (error) throw error;
      
      // Update local state
      reservations = reservations.filter(r => r.id !== myReservation.id);
    } else {
      // Check if full
      if (shiftReservations.length >= shift.capacity) {
        alert('Este turno já está lotado');
        return;
      }
      
      // Add reservation
      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          shiftid: shiftId,
          userid: currentUser.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      reservations.push(data);
    }
    
    renderCalendar();
    updateSummary();
  } catch (error) {
    console.error('Erro ao alterar reserva:', error);
    alert('Erro ao alterar reserva');
  }
}

// Update summary
function updateSummary() {
  const myReservations = reservations.filter(r => r.userid === currentUser.id);
  const count = myReservations.length;
  
  let total = 0;
  myReservations.forEach(reservation => {
    const shift = shifts.find(s => s.id === reservation.shiftid);
    if (shift) {
      if (shift.type === 'I') {
        total += parseFloat(settings.valueintegral);
      } else {
        total += parseFloat(settings.value12h);
      }
    }
  });
  
  document.getElementById('shiftCount').textContent = count;
  document.getElementById('totalValue').textContent = `R$ ${total.toFixed(2)}`;
}

// Helper functions
function getMonthName(month) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return months[month - 1];
}

function getDayName(day) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[day];
}

// Event listeners
document.getElementById('monthSelect').addEventListener('change', (e) => {
  loadMonth(parseInt(e.target.value));
});

// Initialize
checkAuth();
loadMonths();
