import { supabase } from './supabaseClient.js'

let currentUser = null;

// LOGIN
window.loginUser = async function() {
  const name = document.getElementById('name').value.trim()
  const password = document.getElementById('password').value.trim()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('name', name) // ignora maiúsculas/minúsculas
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

  loadCalendar()
}

// LOGOUT
window.logoutUser = function() {
  localStorage.removeItem('user')
  currentUser = null
  document.getElementById('login').style.display = 'block'
  document.getElementById('app').style.display = 'none'
}

// CARREGAR CALENDÁRIO
async function loadCalendar() {
  const today = new Date()
  const month = today.getMonth() + 1
  const year = today.getFullYear()

  const { data: monthData, error: monthError } = await supabase
    .from('months')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single()

  if (monthError) {
    console.log('Erro ao buscar mês:', monthError)
    return document.getElementById('calendar').innerHTML = 'Erro ao carregar mês'
  }

  if (!monthData) return document.getElementById('calendar').innerHTML = 'Mês não encontrado'

  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('*')
    .eq('month_id', monthData.id)

  if (daysError) {
    console.log('Erro ao buscar dias:', daysError)
    return document.getElementById('calendar').innerHTML = 'Erro ao carregar dias'
  }

  const { data: turns, error: turnsError } = await supabase
    .from('turns')
    .select('*')
    .in('day_id', days.map(d => d.id))

  if (turnsError) {
    console.log('Erro ao buscar turnos:', turnsError)
    return document.getElementById('calendar').innerHTML = 'Erro ao carregar turnos'
  }

  renderCalendar(days, turns)
}

// RENDERIZAÇÃO DO CALENDÁRIO
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

// ATUALIZAÇÃO DE TURNO
async function selectTurn(turnId, slot, userId) {
  const update = {}
  update[`slot${slot}`] = userId

  const { error } = await supabase
    .from('turns')
    .update(update)
    .eq('id', turnId)

  if (error) {
    console.log('Erro ao atualizar turno:', error)
    return alert('Erro ao atualizar')
  }

  loadCalendar()
}
