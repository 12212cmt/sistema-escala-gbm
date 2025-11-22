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

// RESTANTE DO CALENDÁRIO (loadCalendar, renderCalendar, selectTurn) permanece igual
