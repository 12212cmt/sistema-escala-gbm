import { supabase } from './supabaseClient.js'

let currentUser = null;

window.loginUser = async function() {
  const name = document.getElementById('name').value
  const password = document.getElementById('password').value

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .single()

  if (error || !data) return alert('Usuário não encontrado')
  if (data.password !== password) return alert('Senha incorreta')

  currentUser = data
  localStorage.setItem('user', JSON.stringify(currentUser))
  document.getElementById('login').style.display = 'none'
  document.getElementById('app').style.display = 'block'
  document.getElementById('userLabel').innerText = `Olá, ${currentUser.name}`

  loadCalendar()
}

window.logoutUser = function() {
  localStorage.removeItem('user')
  currentUser = null
  document.getElementById('login').style.display = 'block'
  document.getElementById('app').style.display = 'none'
}

async function loadCalendar() {
  const today = new Date()
  const month = today.getMonth() + 1
  const year = today.getFullYear()

  const { data: monthData } = await supabase
    .from('months')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single()

  if (!monthData) return document.getElementById('calendar').innerHTML = 'Mês não encontrado'

  const { data: days } = await supabase
    .from('days')
    .select('*')
    .eq('month_id', monthData.id)

  const { data: turns } = await supabase
    .from('turns')
    .select('*')
    .in('day_id', days.map(d => d.id))

  renderCalendar(days, turns)
}

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

async function selectTurn(turnId, slot, userId) {
  const update = {}
  update[`slot${slot}`] = userId

  const { error } = await supabase
    .from('turns')
    .update(update)
    .eq('id', turnId)

  if (error) return alert('Erro ao atualizar')

  loadCalendar()
}
