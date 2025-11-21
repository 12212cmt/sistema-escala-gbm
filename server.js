const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    throw error;
  }
}

// Helper function to write data
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
    throw error;
  }
}

// Helper function to get next ID
function getNextId(array) {
  if (array.length === 0) return 1;
  return Math.max(...array.map(item => item.id)) + 1;
}

// ==================== USERS ====================

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await readData();
    
    const user = data.users.find(u => 
      u.login === username && 
      u.password === password && 
      u.isActive
    );
    
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.json({ success: false, error: 'Credenciais inválidas ou usuário inativo' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const data = await readData();
    res.json({ success: true, data: data.users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const data = await readData();
    const newUser = {
      id: getNextId(data.users),
      ...req.body,
      isActive: req.body.isActive !== false
    };
    
    data.users.push(newUser);
    await writeData(data);
    
    res.json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const data = await readData();
    const userId = parseInt(req.params.id);
    const index = data.users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      return res.json({ success: false, error: 'Usuário não encontrado' });
    }
    
    data.users[index] = { ...data.users[index], ...req.body, id: userId };
    await writeData(data);
    
    res.json({ success: true, data: data.users[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const data = await readData();
    const userId = parseInt(req.params.id);
    
    data.users = data.users.filter(u => u.id !== userId);
    await writeData(data);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== MONTHS ====================

app.get('/api/months', async (req, res) => {
  try {
    const data = await readData();
    res.json({ success: true, data: data.months });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/months', async (req, res) => {
  try {
    const data = await readData();
    const { year, month } = req.body;
    
    const newMonth = {
      id: getNextId(data.months),
      year,
      month,
      isActive: false
    };
    
    data.months.push(newMonth);
    
    // Create shifts for this month
    const daysInMonth = new Date(year, month, 0).getDate();
    const shiftTypes = ['I', 'D', 'N'];
    
    for (let day = 1; day <= daysInMonth; day++) {
      shiftTypes.forEach(type => {
        data.shifts.push({
          id: getNextId(data.shifts),
          monthId: newMonth.id,
          day,
          type,
          capacity: 3
        });
      });
    }
    
    await writeData(data);
    res.json({ success: true, data: newMonth });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/months/:id', async (req, res) => {
  try {
    const data = await readData();
    const monthId = parseInt(req.params.id);
    const index = data.months.findIndex(m => m.id === monthId);
    
    if (index === -1) {
      return res.json({ success: false, error: 'Mês não encontrado' });
    }
    
    data.months[index] = { ...data.months[index], ...req.body, id: monthId };
    await writeData(data);
    
    res.json({ success: true, data: data.months[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/months/:id', async (req, res) => {
  try {
    const data = await readData();
    const monthId = parseInt(req.params.id);
    
    // Get shift IDs before deleting
    const shiftIds = data.shifts.filter(s => s.monthId === monthId).map(s => s.id);
    
    // Delete month
    data.months = data.months.filter(m => m.id !== monthId);
    
    // Delete shifts
    data.shifts = data.shifts.filter(s => s.monthId !== monthId);
    
    // Delete reservations
    data.reservations = data.reservations.filter(r => !shiftIds.includes(r.shiftId));
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SHIFTS ====================

app.get('/api/shifts', async (req, res) => {
  try {
    const data = await readData();
    const monthId = req.query.monthId ? parseInt(req.query.monthId) : null;
    
    let shifts = data.shifts;
    if (monthId) {
      shifts = shifts.filter(s => s.monthId === monthId);
    }
    
    res.json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/shifts/:id', async (req, res) => {
  try {
    const data = await readData();
    const shiftId = parseInt(req.params.id);
    const index = data.shifts.findIndex(s => s.id === shiftId);
    
    if (index === -1) {
      return res.json({ success: false, error: 'Turno não encontrado' });
    }
    
    data.shifts[index] = { ...data.shifts[index], ...req.body, id: shiftId };
    await writeData(data);
    
    res.json({ success: true, data: data.shifts[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RESERVATIONS ====================

app.get('/api/reservations', async (req, res) => {
  try {
    const data = await readData();
    const monthId = req.query.monthId ? parseInt(req.query.monthId) : null;
    
    let reservations = data.reservations;
    
    if (monthId) {
      const shiftIds = data.shifts.filter(s => s.monthId === monthId).map(s => s.id);
      reservations = reservations.filter(r => shiftIds.includes(r.shiftId));
    }
    
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const data = await readData();
    
    const newReservation = {
      id: getNextId(data.reservations),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    data.reservations.push(newReservation);
    await writeData(data);
    
    res.json({ success: true, data: newReservation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const data = await readData();
    const reservationId = parseInt(req.params.id);
    
    data.reservations = data.reservations.filter(r => r.id !== reservationId);
    await writeData(data);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SETTINGS ====================

app.get('/api/settings', async (req, res) => {
  try {
    const data = await readData();
    res.json({ success: true, data: data.settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const data = await readData();
    data.settings = { ...data.settings, ...req.body };
    await writeData(data);
    
    res.json({ success: true, data: data.settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SERVER ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Sistema de Escalas de Plantões - GBM`);
});
