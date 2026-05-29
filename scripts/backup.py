#!/usr/bin/env python3
"""
SER Energia Renovável — Script de Backup Automático
Executa via GitHub Actions diariamente às 3h (horário de Belém).
Salva JSON com todos os dados do Supabase na branch 'backups'.
"""

import urllib.request
import urllib.error
import json
import os
import sys
from datetime import datetime, timezone

SURL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SKEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

if not SURL or not SKEY:
    print('ERRO: variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias.', file=sys.stderr)
    sys.exit(1)

TABLES = [
    'leads', 'propostas', 'vistorias', 'contratos', 'logistica',
    'instalacoes', 'homologacoes', 'posvenda', 'remarketing', 'comissoes',
    'financeiro_receitas', 'financeiro_despesas', 'cadastros', 'perfis',
    'tentativas_contato', 'metas',
]

def fetch_table(table):
    url = f'{SURL}/rest/v1/{table}?select=*&order=criado_em.asc'
    req = urllib.request.Request(url, headers={
        'apikey': SKEY,
        'Authorization': f'Bearer {SKEY}',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())

now_utc = datetime.now(timezone.utc)
# Belém é UTC-3
now_belem = datetime.fromtimestamp(now_utc.timestamp() - 3 * 3600)

backup = {
    'gerado_em_utc': now_utc.isoformat(),
    'gerado_em_belem': now_belem.strftime('%Y-%m-%d %H:%M:%S'),
    'versao': '1.0',
    'origem': 'automatico',
    'tabelas': {},
}

errors = []
print(f'Iniciando backup — {now_belem.strftime("%Y-%m-%d %H:%M")} (Belém)')
print('-' * 50)

for table in TABLES:
    try:
        rows = fetch_table(table)
        backup['tabelas'][table] = rows
        print(f'  ✓ {table:<30} {len(rows):>4} registros')
    except Exception as e:
        backup['tabelas'][table] = []
        errors.append(f'{table}: {e}')
        print(f'  ✗ {table:<30} ERRO: {e}', file=sys.stderr)

backup['total_registros'] = sum(len(v) for v in backup['tabelas'].values())
backup['erros'] = errors

print('-' * 50)
print(f'Total: {backup["total_registros"]} registros | {len(errors)} erros')

os.makedirs('backups', exist_ok=True)
date_str = now_belem.strftime('%Y-%m-%d')
filepath = f'backups/ser-backup-{date_str}.json'

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(backup, f, ensure_ascii=False, indent=2, default=str)

print(f'\nSalvo em: {filepath}')

if errors:
    sys.exit(1)
