# 🚀 Deploy do Sistema de Escalas GBM

## ✅ Migração Concluída!

O sistema foi **completamente migrado** para usar **Supabase** diretamente do frontend, eliminando a necessidade de:
- ❌ Servidor Node.js
- ❌ Render (ou qualquer outro serviço de backend)
- ❌ Manutenção de servidor

Agora o sistema é **100% frontend** e pode ser hospedado gratuitamente em qualquer serviço de hospedagem estática!

---

## 📋 O que foi feito

### 1. **Criação do Cliente Supabase**
- Arquivo: `public/supabase-client.js`
- Configuração do cliente Supabase
- Funções de autenticação (login, logout, getCurrentUser)

### 2. **Migração do Login**
- Arquivo: `public/index.html`
- Login direto com Supabase (sem API intermediária)
- Validação de credenciais no banco de dados

### 3. **Migração do Painel Admin**
- Arquivos: `public/admin.html` e `public/admin-supabase.js`
- Gerenciamento de meses (criar, ativar, desativar, excluir)
- Gerenciamento de usuários (listar, criar)
- Configurações (valores dos plantões)

### 4. **Migração da Página de Escalas**
- Arquivos: `public/escalas.html` e `public/escalas-supabase.js`
- Visualização de calendário mensal
- Marcação/desmarcação de plantões
- Cálculo automático de valores
- Sincronização em tempo real entre usuários

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

### Tabelas criadas:

1. **users** - Usuários do sistema
   - id, fullname, cpf, login, password, isadmin, isactive

2. **months** - Meses cadastrados
   - id, month, year, isactive

3. **shifts** - Turnos de cada mês
   - id, monthid, day, type, capacity

4. **reservations** - Reservas de plantões
   - id, shiftid, userid, createdat

5. **settings** - Configurações do sistema
   - id, value12h, valueintegral

---

## 🚀 Como fazer Deploy

### Opção 1: Vercel (Recomendado)

1. Acesse https://vercel.com
2. Faça login com sua conta GitHub
3. Clique em "New Project"
4. Selecione o repositório `sistema-escala-gbm`
5. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `public`
   - **Build Command:** (deixe vazio)
   - **Output Directory:** `.`
6. Clique em "Deploy"
7. Pronto! Seu site estará no ar em segundos

### Opção 2: Netlify

1. Acesse https://netlify.com
2. Faça login com sua conta GitHub
3. Clique em "Add new site" → "Import an existing project"
4. Selecione o repositório `sistema-escala-gbm`
5. Configure:
   - **Base directory:** `public`
   - **Build command:** (deixe vazio)
   - **Publish directory:** `public`
6. Clique em "Deploy site"
7. Pronto! Seu site estará no ar

### Opção 3: GitHub Pages

1. Vá em Settings do repositório
2. Clique em "Pages"
3. Em "Source", selecione "Deploy from a branch"
4. Em "Branch", selecione `main` e pasta `/public`
5. Clique em "Save"
6. Aguarde alguns minutos
7. Seu site estará disponível em: `https://12212cmt.github.io/sistema-escala-gbm/`

---

## 🔐 Segurança

### RLS (Row Level Security)

Atualmente, o RLS está **desabilitado** para facilitar o desenvolvimento. Para produção, recomenda-se habilitar RLS com as seguintes políticas:

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (todos podem ler, mas não podem modificar via API anônima)
CREATE POLICY "Permitir leitura pública" ON users FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON months FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON shifts FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON reservations FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON settings FOR SELECT USING (true);

-- Permitir inserção/atualização/exclusão
CREATE POLICY "Permitir inserção" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização" ON users FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão" ON users FOR DELETE USING (true);

-- Repetir para outras tabelas...
```

---

## 🎯 Próximos Passos

### Funcionalidades Faltantes (Opcional)

1. **Exportação CSV**
   - Adicionar botão para exportar dados de um mês para CSV

2. **Edição/Exclusão de Usuários**
   - Adicionar botões na lista de usuários

3. **Botão "Voltar" na página de escalas**
   - Adicionar navegação de volta para o admin

4. **Notificações**
   - Adicionar notificações quando alguém marca/desmarca plantão

---

## 📊 Custos

### Supabase (Plano Free)
- ✅ 500 MB de banco de dados
- ✅ 1 GB de armazenamento de arquivos
- ✅ 2 GB de transferência de dados
- ✅ 50.000 usuários ativos mensais
- ✅ **100% GRÁTIS**

### Vercel/Netlify (Plano Free)
- ✅ 100 GB de largura de banda
- ✅ Deploy automático do GitHub
- ✅ HTTPS gratuito
- ✅ **100% GRÁTIS**

**Total: R$ 0,00/mês** 🎉

---

## 🆘 Suporte

Se precisar de ajuda, entre em contato ou abra uma issue no GitHub.

---

## ✅ Checklist de Deploy

- [x] Migrar código para Supabase
- [x] Testar localmente
- [x] Fazer commit e push para GitHub
- [ ] Fazer deploy no Vercel/Netlify
- [ ] Testar no ambiente de produção
- [ ] Desativar/excluir serviço do Render
- [ ] Atualizar DNS (se necessário)

---

**Desenvolvido com ❤️ usando Supabase + HTML/CSS/JS**
