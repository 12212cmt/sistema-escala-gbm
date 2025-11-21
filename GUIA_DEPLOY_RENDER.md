# Guia Completo: Deploy do Sistema de Escalas no Render

**Autor:** Manus AI
**Data:** 21 de novembro de 2025

Este guia irá te ajudar a colocar o sistema online gratuitamente usando o GitHub e o Render.com.

## Parte 1: Criar um Repositório no GitHub

1.  **Acesse o GitHub:** Vá para [github.com](https://github.com) e faça login.
2.  **Crie um Novo Repositório:**
    -   Clique em `New` ou vá para [github.com/new](https://github.com/new).
    -   **Nome do Repositório:** `sistema-escalas-gbm` (ou outro nome que preferir).
    -   **Visibilidade:** `Public` (Público).
    -   Clique em `Create repository`.
3.  **Envie os Arquivos:**
    -   Na página do seu novo repositório, clique em `Add file` > `Upload files`.
    -   Arraste **todos os arquivos e pastas** do projeto que eu te entreguei para a área de upload.
    -   Clique em `Commit changes`.

## Parte 2: Criar uma Conta no Render

1.  **Acesse o Render:** Vá para [render.com](https://render.com).
2.  **Crie uma Conta:** Clique em `Get Started` e crie uma conta usando seu perfil do GitHub. É a forma mais fácil e rápida.

## Parte 3: Fazer o Deploy do Sistema

1.  **Acesse o Dashboard:** Após criar a conta, você estará no seu dashboard.
2.  **Crie um Novo Serviço Web:**
    -   Clique em `New +` > `Web Service`.
    -   **Conecte seu GitHub:** Se for a primeira vez, o Render pedirá para conectar sua conta GitHub. Autorize o acesso.
    -   **Selecione o Repositório:** Na lista, encontre e selecione o repositório `sistema-escalas-gbm` que você criou.
3.  **Configure o Serviço:**
    -   **Name:** `sistema-escalas-gbm` (ou o nome que preferir).
    -   **Region:** Pode deixar a padrão.
    -   **Branch:** `main`.
    -   **Root Directory:** Deixe em branco.
    -   **Runtime:** `Node`.
    -   **Build Command:** `npm install`.
    -   **Start Command:** `npm start`.
    -   **Plano:** **IMPORTANTE!** Selecione o plano **`Free`** (Gratuito).
4.  **Clique em `Create Web Service`:**

## Parte 4: Aguarde e Acesse!

1.  **Aguarde o Deploy:** O Render irá instalar as dependências e iniciar seu servidor. Isso pode levar alguns minutos. Você pode acompanhar o progresso no log.
2.  **Acesse seu Sistema:** Quando o status mudar para `Live`, seu sistema estará online! O Render te dará um link público no topo da página, algo como:
    `https://sistema-escalas-gbm.onrender.com`

**Pronto!** Seu sistema de escalas está online, funcionando com acesso multiusuário e totalmente gratuito. Você pode compartilhar este link com quem precisar.

## Observações Importantes

-   **Modo de Hibernação:** O plano gratuito do Render "dorme" após 15 minutos de inatividade. O primeiro acesso depois de um tempo pode demorar uns 30 segundos para "acordar" o servidor. Depois disso, ele fica rápido.
-   **Atualizações Automáticas:** Qualquer alteração que você fizer no seu repositório do GitHub (no branch `main`) será automaticamente atualizada no Render. Você não precisa fazer o deploy novamente.
-   **Editar os Dados:** Para editar o arquivo `data.json`, você pode fazer isso diretamente no GitHub. O Render irá detectar a mudança e reiniciar o servidor com os novos dados.
