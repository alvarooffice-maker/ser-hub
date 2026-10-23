# Testes do SER Hub

| Arquivo | O que testa | Como rodar |
|---|---|---|
| `smoke.cjs` | sintaxe do código e presença das funções críticas | `node tests/smoke.cjs` |
| `comissao.test.cjs` | contas de comissão (líquido, taxa de cartão, "a pagar") | `node --test tests/comissao.test.cjs` |
| `permissoes.sql` | o que cada perfil vê/faz no banco (11 verificações) — roda numa transação que é desfeita | colar no SQL do Supabase trocando `__UID__` e `__TIPO__` (admin, gestao, vendedor, instalador, homologador, vistoria) |
| `e2e/` | fluxos no navegador (Playwright) — precisa de conta de teste | `cd tests/e2e && npm test` |

Regra: qualquer `ok = false` em `permissoes.sql` é regressão de segurança — corrigir antes de publicar.
