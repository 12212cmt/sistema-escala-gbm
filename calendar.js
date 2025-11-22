import { supabase } from "./supabaseClient.js";

export async function getMonth(year, month) {
  const { data: monthData } = await supabase
    .from('months')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single();

  const { data: days } = await supabase
    .from('days')
    .select('*')
    .eq('month_id', monthData.id);

  const { data: turns } = await supabase
    .from('turns')
    .select('*')
    .in('day_id', days.map(d => d.id));

  return { month: monthData, days, turns };
}
