# Como publicar o SER Hub em Astro (sem risco para a produção)

**Situação:** o sistema aprovado (commit b55306b) está no ar e NÃO foi alterado. O Astro está no ramo `migracao-astro`
(pasta `SER-Hub-astro`), enviado ao GitHub num Pull Request ainda sem merge. O código é equivalente ao aprovado (conferido arquivo a arquivo).

## 1. Testar localmente, logado de verdade (antes de publicar)
```bash
cd "~/Documents/WEB APP/APP SER/SER-Hub-astro" && npm install && npm run build && npm run preview
```
Abra o endereço que aparecer (http://localhost:4321) e entre com sua conta. Teste, no mínimo:
- Dashboard, Pipeline e a tela **Comissões** (filtro por mês, PDF, **+ Nova Comissão** com Taxa de Cartão);
- mover um card de teste para **Pós-venda** (pede a data da homologação);
- **busca (Ctrl+K)** por tomador do financiamento e por titular/homologador;
- abrir um **laudo de vistoria** e uma foto (links assinados);
- no celular ou com o Wi-Fi desligado: abrir uma instalação, tirar foto offline e reconectar.
Repita com um login de vendedor e um de instalador/homologador.

## 2. Preparar o GitHub (uma vez)
Settings → Pages → **Source: GitHub Actions** (mantenha o domínio crm.serenergiarenovavel.com.br e "Enforce HTTPS").
O arquivo `public/CNAME` já vai junto no build.

## 3. Publicar
1. Abra um Pull Request do ramo `migracao-astro` para a `main` e revise.
2. Junte (merge). **Nada é publicado automaticamente**: o fluxo está só manual.
3. GitHub → Actions → "Deploy (GitHub Pages)" → **Run workflow**.
4. Confira o site, o login, o portal do cliente (`/portal.html` — mesmo endereço dos links já enviados) e o app no celular
   (feche e abra uma vez para renovar o cache).

## 4. Se algo der errado (voltar atrás)
- Rápido: Actions → rode o deploy de novo a partir do commit anterior à migração (b55306b): `git revert` do merge e **Run workflow**.
- Alternativa: Settings → Pages → Source = "Deploy from a branch" → `main` / root, depois de reverter o merge
  (a raiz volta a ter o `index.html` aprovado).

## Observações
- O `.env` do repositório só tem a URL e a chave **pública** (anon) do Supabase — pode ficar versionado; a proteção é o RLS.
- O Service Worker agora só pré-carrega `/logo.png` e `/manifest.json`; os arquivos de `/_astro/` entram no cache no primeiro acesso online.
- Depois de aprovado, para publicar a cada mudança na `main`, descomente `push:` no `deploy.yml`.
