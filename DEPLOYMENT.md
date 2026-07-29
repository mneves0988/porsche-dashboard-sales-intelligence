# Guia de Deploy - GitHub Pages e Vercel

Este documento descreve como fazer deploy deste projeto no **GitHub Pages** ou **Vercel**.

## Pré-requisitos

- Node.js 20+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Conta no GitHub e/ou Vercel

## Configurações Aplicadas

### 1. vite.config.ts
- Plugins de desenvolvimento (debug collector, storage proxy) são excluídos em produção
- Source maps desativados para builds de produção
- Build output configurado para `dist/public`

### 2. client/index.html
- Scripts de analytics condicionais (apenas carregados se as variáveis de ambiente estiverem definidas)

### 3. Arquivos de Configuração Criados
- `vercel.json`: Configuração para Vercel com rewrite para SPA
- `.github/workflows/deploy.yml`: Workflow para GitHub Pages
- `.github/workflows/vercel-deploy.yml`: Workflow opcional para Vercel via GitHub Actions

---

## Deploy no GitHub Pages

### Opção A: Usando GitHub Actions (Recomendado)

1. **Habilite GitHub Pages**:
   - Vá em `Settings > Pages`
   - Em "Source", selecione "GitHub Actions"

2. **Configure o repositório**:
   - Se o repositório for `username.github.io`, a URL base será `/`
   - Se for um repositório de projeto, você precisará configurar o `base` no vite.config.ts:
     ```ts
     base: '/nome-do-repositorio/',
     ```

3. **Faça push para main/master**:
   ```bash
   git add .
   git commit -m "Configurar deploy para GitHub Pages"
   git push origin main
   ```

4. O workflow será executado automaticamente e fará o deploy.

### Opção B: Deploy Manual

```bash
# Build de produção
pnpm build

# Instale gh-pages (uma vez)
pnpm add -D gh-pages

# Deploy
pnpm exec gh-pages -d dist/public
```

---

## Deploy na Vercel

### Opção A: Conectando o Repositório (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe seu repositório do GitHub
4. Configure:
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `pnpm install`
5. Clique em "Deploy"

A Vercel detectará automaticamente o `vercel.json` e aplicará as configurações de rewrite para SPA.

### Opção B: Usando Vercel CLI

```bash
# Instale a Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy para produção
vercel --prod
```

---

## Variáveis de Ambiente

Se você usa analytics ou outras variáveis de ambiente:

### GitHub Pages
1. Vá em `Settings > Secrets and variables > Actions`
2. Adicione as variáveis em "Variables" (públicas) ou "Secrets" (privadas)
3. No workflow, elas serão acessíveis via `${{ vars.NOME }}` ou `${{ secrets.NOME }}`

### Vercel
1. No dashboard do projeto, vá em "Settings > Environment Variables"
2. Adicione as variáveis necessárias
3. Redeploy para aplicar

---

## Considerações Importantes

### Backend/API

Este projeto possui um servidor backend (`server/index.ts`). Para deploy estático:

- **GitHub Pages/Vercel Static**: Apenas o frontend será servido. Qualquer chamada API precisa ser:
  - Substituída por endpoints externos
  - Ou implementada como serverless functions (Vercel)
  - Ou removida se for apenas para desenvolvimento

### Imagens e Assets

As imagens referenciadas como `/manus-storage/...` devem estar na pasta `client/public/manus-storage/` para serem incluídas no build.

### Rotas do Frontend

O arquivo `vercel.json` inclui rewrites para garantir que rotas do frontend (ex: `/dashboard`) funcionem corretamente em SPA. Para GitHub Pages, isso é tratado automaticamente pelo hash routing ou você pode precisar configurar um redirect 404.html.

---

## Troubleshooting

### Build falha no GitHub Actions
- Verifique se o `pnpm-lock.yaml` está atualizado
- Confirme a versão do Node.js (20+)
- Execute `pnpm build` localmente para testar

### Página em branco após deploy
- Abra o console do navegador para verificar erros
- Verifique se o `base` path está correto no vite.config.ts
- Confirme que as rotas estão configuradas corretamente

### Assets não carregam
- Verifique se os arquivos estão em `client/public/`
- Confira os caminhos no código (devem ser relativos à raiz)

---

## Links Úteis

- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Pages Documentation](https://pages.github.com/)
- [Vercel Documentation](https://vercel.com/docs)
