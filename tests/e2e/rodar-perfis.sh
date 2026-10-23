#!/bin/bash
# Roda os testes logados por perfil. As senhas são digitadas AQUI no seu terminal (não aparecem na tela nem vão para o chat).
# Uso:  bash tests/e2e/rodar-perfis.sh            → testa o build Astro local (http://localhost:4321)
#       SER_URL=https://crm.serenergiarenovavel.com.br bash tests/e2e/rodar-perfis.sh   → testa o site no ar
cd "$(dirname "$0")" || exit 1
RAIZ="$(cd ../.. && pwd)"
if [ -z "${SER_URL:-}" ]; then
  export SER_URL="http://localhost:4321"
  echo "→ Gerando e servindo o build do Astro em $SER_URL ..."
  (cd "$RAIZ" && npm run build >/dev/null 2>&1 </dev/null && (nohup npx astro preview --port 4321 >/tmp/astro-preview-perfis.log 2>&1 </dev/null &))
  for i in $(seq 1 30); do curl -s -o /dev/null "$SER_URL/" && break; sleep 1; done
fi
echo "Alvo dos testes: $SER_URL"
[ -d node_modules ] || npm install --no-audit --no-fund >/dev/null 2>&1 </dev/null
npx playwright install chromium >/dev/null 2>&1 </dev/null
pergunta() {   # $1=CHAVE  $2=descrição
  read -r -p "E-mail do $2 (Enter para pular): " em < /dev/tty
  [ -z "$em" ] && return
  read -r -s -p "Senha de $em: " se < /dev/tty; echo
  export "E2E_$1_EMAIL=$em" "E2E_$1_SENHA=$se"
}
pergunta ADMIN "ADMIN"
pergunta SUPERVISOR "SUPERVISOR"
pergunta VENDEDOR "VENDEDOR (conta de teste)"
pergunta INSTALADOR "INSTALADOR (conta de teste)"
pergunta HOMOLOGADOR "HOMOLOGADOR (conta de teste)"
[ -z "${E2E_ADMIN_EMAIL}${E2E_SUPERVISOR_EMAIL}${E2E_VENDEDOR_EMAIL}${E2E_INSTALADOR_EMAIL}${E2E_HOMOLOGADOR_EMAIL}" ] && { echo "Nenhum e-mail informado — nada a testar. Rode de novo e digite pelo menos um e-mail."; exit 1; }
npx playwright test perfis.spec.js --reporter=list </dev/null
