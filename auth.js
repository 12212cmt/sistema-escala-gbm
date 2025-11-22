import { supabase } from './supabaseClient.js';

export async function login(name, password) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, password, role')
    .eq('name', name)
    .single();

  if (error) return { error: "Usuário não encontrado" };
  if (data.password !== password) return { error: "Senha incorreta" };

  localStorage.setItem("user", JSON.stringify(data));
  return { user: data };
}

export function logout() {
  localStorage.removeItem("user");
  location.reload();
}
