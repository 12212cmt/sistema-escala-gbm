require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== USERS ====================

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('login', username)
      .eq('password', password)
      .eq('isactive', true)
      .single();
    
    if (error || !data) {
      return res.json({ success: false, error: 'Credenciais inválidas ou usuário inativo' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id');
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        fullname: req.body.fullName,
        cpf: req.body.cpf,
        login: req.body.login,
        password: req.body.password,
        isadmin: req.body.isAdmin || false,
        isactive: req.body.isActive !== false
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const updateData = {};
    if (req.body.fullName) updateData.fullname = req.body.fullName;
    if (req.body.cpf) updateData.cpf = req.body.cpf;
    if (req.body.login) updateData.login = req.body.login;
    if (req.body.password) updateData.password = req.body.password;
    if (req.body.isAdmin !== undefined) updateData.isadmin = req.body.isAdmin;
    if (req.body.isActive !== undefined) updateData.isactive = req.body.isActive;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== MONTHS ====================

app.get('/api/months', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('months')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/months', async (req, res) => {
  try {
    const { year, month } = req.body;
    
    // Create month
    const { data: newMonth, error: monthError } = await supabase
      .from('months')
      .insert([{
        year,
        month,
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
    
    res.json({ success: true, data: newMonth });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/months/:id', async (req, res) => {
  try {
    const monthId = parseInt(req.params.id);
    
    const updateData = {};
    if (req.body.isActive !== undefined) updateData.isactive = req.body.isActive;
    
    const { data, error } = await supabase
      .from('months')
      .update(updateData)
      .eq('id', monthId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/months/:id', async (req, res) => {
  try {
    const monthId = parseInt(req.params.id);
    
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
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SHIFTS ====================

app.get('/api/shifts', async (req, res) => {
  try {
    const monthId = req.query.monthId ? parseInt(req.query.monthId) : null;
    
    let query = supabase.from('shifts').select('*').order('day').order('type');
    
    if (monthId) {
      query = query.eq('monthid', monthId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/shifts/:id', async (req, res) => {
  try {
    const shiftId = parseInt(req.params.id);
    
    const updateData = {};
    if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
    
    const { data, error } = await supabase
      .from('shifts')
      .update(updateData)
      .eq('id', shiftId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RESERVATIONS ====================

app.get('/api/reservations', async (req, res) => {
  try {
    const monthId = req.query.monthId ? parseInt(req.query.monthId) : null;
    
    let query = supabase.from('reservations').select('*');
    
    if (monthId) {
      // Get shift IDs for this month
      const { data: shifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('monthid', monthId);
      
      const shiftIds = shifts.map(s => s.id);
      
      if (shiftIds.length > 0) {
        query = query.in('shiftid', shiftIds);
      } else {
        return res.json({ success: true, data: [] });
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        shiftid: req.body.shiftId,
        userid: req.body.userId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SETTINGS ====================

app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    // Get the first settings record
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();
    
    const updateData = {};
    if (req.body.value12h !== undefined) updateData.value12h = req.body.value12h;
    if (req.body.valueIntegral !== undefined) updateData.valueintegral = req.body.valueIntegral;
    
    const { data, error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SERVER ====================

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Erro ao carregar a página. Verifique se a pasta public existe.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Sistema de Escalas de Plantões - GBM`);
  console.log(`🔗 Conectado ao Supabase: ${process.env.SUPABASE_URL}`);
});
