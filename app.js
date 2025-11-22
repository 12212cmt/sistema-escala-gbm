import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://exhfpeeslhjpvfmbonyz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4aGZwZWVzbGhqcHZmbWJvbnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzEyOTcsImV4cCI6MjA3OTQwNzI5N30.zwLuyDV8vuZhH0vSl22CmK0QxXHyzY3jcJMNA2wt-zo'

const supabase = createClient(supabaseUrl, supabaseKey)

let currentUser = null

// ================= LOGIN =================
window.loginUser = async function() {
  const name = document.getElementById('name').value.trim()
  const password = document.getElementById('password').value.trim()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('name', name)
    .single()

  if (error) {
    console.log('Erro no login:', error)
    return alert('Usuário não encontrado')
  }

  if (!data) return alert('Usuário não encontrado')
  if (data.password.trim() !== password) return alert('Senha incorreta')

  currentUser = data
  localStorage.setItem('user', JSON.stringify(currentUser))
  document.getElementById('login').style.display = 'none'
  document.getElementById('app').style.display = 'block'
  document.getElementById('userLabel').innerText = `Olá, ${currentUser.name}`

  await loadCalendar()
}

// ================= LOGOUT =================
window.logoutUser = function() {
  localStorage.removeItem('user')
  currentUser = null
  document.getElementById('login').style.display = 'block'
  document.getElementById('app').style.display = 'none'
}

// ================= CARREGAR CALENDÁRIO =================
window.loadCalendar = async function() {
  const today = new Date()
  const month = today.getMonth() + 1
  const year = today.getFullYear()

  const { data: monthData, error: monthError } = await supabase
    .from('months')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single()

  if (monthError) { console.log('Erro ao buscar mês:', monthError); return }
  if (!monthData) { console.log('Mês não encontrado'); return }

  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('*')
    .eq('month_id', monthData.id)

  if (daysError) { console.log('Erro ao buscar dias:', daysError); return }

  const { data: turns, error: turnsError } = await supabase
    .from('turns')
    .select('*')
    .in('day_id', days.map(d => d.id))

  if (turnsError) { console.log('Erro ao buscar turnos:', turnsError); return }

  renderCalendar(days, turns)
}

// ================= RENDER CALENDÁRIO =================
function renderCalendar(days, turns) {
  const container = document.getElementById('calendar')
  container.innerHTML = ''

  days.forEach(day => {
    const dayTurns = turns.filter(t => t.day_id === day.id)

    const card = document.createElement('div')
    card.className = 'dayCard'
    card.innerHTML = `<h3>${day.date} (${day.weekday})</h3>`

    dayTurns.forEach(t => {
      const slots = [t.slot1, t.slot2, t.slot3]
      const section = document.createElement('div')
      section.innerHTML = `<b>${t.type.toUpperCase()}</b>`

      slots.forEach((slot, i) => {
        const btn = document.createElement('button')

        if (!slot) {
          btn.innerText = 'Disponível'
          btn.onclick = () => selectTurn(t.id, i + 1, currentUser.id)
        } else {
          btn.innerText = slot === currentUser.id ? 'Você (remover)' : slot
          btn.disabled = slot !== currentUser.id
          btn.onclick = slot === currentUser.id ? () => selectTurn(t.id, i + 1, null) : null
        }

        section.appendChild(btn)
      })

      card.appendChild(section)
    })

    container.appendChild(card)
  })
}

// ================= ATUALIZAÇÃO DE TURNO =================
async function selectTurn(turnId, slot, userId) {
  const update = {}
  update[`slot${slot}`] = userId

  const { error } = await supabase
    .from('turns')
    .update(update)
    .eq('id', turnId)

  if (error) { console.log('Erro ao atualizar turno:', error); return alert('Erro ao atualizar') }

  await loadCalendar()
}
