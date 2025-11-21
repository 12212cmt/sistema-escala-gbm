# Sistema de Escalas de Plantões - GBM

Sistema web para gerenciamento de escalas de plantões com interface intuitiva e backend em Node.js.

## 🚀 Deploy no Render

Siga o guia completo em `GUIA_DEPLOY_RENDER.md`

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

### Login Padrão
- **Usuário:** gestor
- **Senha:** admin

## 📁 Estrutura do Projeto

```
sistema-escalas-gbm/
├── server.js           # Servidor Node.js com API REST
├── data.json           # Banco de dados JSON (editável)
├── package.json        # Dependências do projeto
├── public/             # Arquivos estáticos
│   ├── index.html      # Interface do sistema
│   └── api.js          # Cliente da API
└── README.md           # Este arquivo
```

## 🔧 Configuração

### Editar Dados Manualmente

Você pode editar o arquivo `data.json` diretamente para:
- Adicionar usuários
- Modificar configurações
- Fazer backup dos dados

**Importante:** Reinicie o servidor após editar o arquivo.

## 📊 Funcionalidades

### Para Gestores
- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de usuários
- ✅ Criação e gestão de meses
- ✅ Ajuste de capacidade de turnos
- ✅ Exportação para CSV
- ✅ Configuração de valores

### Para Usuários
- ✅ Visualização de escalas
- ✅ Marcação de plantões
- ✅ Perfil pessoal com resumo
- ✅ Cálculo automático de valores

## 🛠️ Tecnologias

- **Backend:** Node.js + Express
- **Banco de Dados:** JSON file-based
- **Frontend:** HTML5 + CSS3 + JavaScript (Vanilla)
- **Deploy:** Render.com

## 📝 Licença

MIT
