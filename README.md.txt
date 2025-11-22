# Escala App

App de escala de turnos (diurno/noturno) usando Supabase.

## Estrutura

- `index.html` → Frontend
- `styles.css` → Estilos
- `supabaseClient.js` → Conexão Supabase
- `auth.js` → Login/logout
- `calendar.js` → Carrega e renderiza os dias e turnos
- `app.js` → Lógica principal do app

## Configuração

1. Criar projeto no Supabase e configurar RLS como feito.
2. Substituir URL e ANON KEY em `supabaseClient.js` pelas suas do Supabase.
3. Garantir que as tabelas `users`, `months`, `days` e `turns` estejam criadas.
4. Configurar Row Level Security (RLS) conforme exemplos.

## Rodando localmente

1. Clonar o repositório.
2. Abrir `index.html` no navegador.
3. Entrar com usuário cadastrado no Supabase.

## Observações

- Usuário marca/desmarca apenas sua própria vaga.
- Gestor pode criar/excluir/ativar meses e turnos (pendente painel gestor).
- Projeto preparado para ser convertido em PWA se necessário.
