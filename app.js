// CARREGAR CALENDÁRIO
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
  if (!monthData) { console.log('Nenhum mês encontrado'); return }

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
