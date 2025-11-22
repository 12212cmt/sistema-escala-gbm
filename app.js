console.log("app.js carregado");

// Aguarda DOM
document.addEventListener("DOMContentLoaded", () => {

  if (!window.supabase) {
    console.error("Supabase NÃO carregou!");
    return;
  }

  const supabase = window.supabase;

  const war = document.getElementById("warname");
  const pass = document.getElementById("password");

  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");
  const btnFinishRegister = document.getElementById("btnFinishRegister");

  const registerExtra = document.getElementById("registerExtra");

  // LOGIN
  btnLogin.onclick = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("warname", war.value)
      .eq("password", pass.value)
      .maybeSingle();

    if (error || !data) {
      alert("Usuário ou senha incorretos");
      return;
    }

    alert("LOGIN OK!");
    console.log("Usuário:", data);
  };

  // REGISTRAR (etapa 1)
  btnRegister.onclick = () => {
    registerExtra.style.display = "block";
  };

  // REGISTRAR (final)
  btnFinishRegister.onclick = async () => {
    const full = document.getElementById("fullName").value;
    const cpf = document.getElementById("cpf").value;

    const { error } = await supabase.from("profiles").insert({
      warname: war.value,
      password: pass.value,
      fullname: full,
      cpf: cpf,
      role: "user"
    });

    if (error) {
      alert("Erro registrando: " + error.message);
      return;
    }

    alert("Registrado com sucesso!");
  };

});
