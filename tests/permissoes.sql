-- TESTES DE PERMISSÃO POR PERFIL (rodar no banco; tudo dentro de uma transação que é DESFEITA no final)
-- Troque __UID__ pelo id do usuário de teste e __TIPO__ por: admin | gestao (supervisor/financeiro) | vendedor | instalador | homologador | vistoria
-- Resultado: uma linha por verificação (teste, esperado, obtido, ok). Qualquer "ok = false" é uma regressão de segurança.
begin;
create temp table resultados(teste text, esperado text, obtido text, ok boolean);
grant all on resultados to authenticated;
-- referências (como administrador do banco, antes de assumir o perfil)
create temp table ref as select
  (select count(*) from contratos) contratos, (select count(*) from comissoes) comissoes,
  (select count(*) from relacionamento_agenda) agenda, (select count(*) from portal_tokens) portal,
  (select count(*) from perfis) perfis, (select homologacao_id from posvenda where homologacao_id is not null limit 1) hom_id;
grant all on ref to authenticated;
delete from posvenda where homologacao_id = (select hom_id from ref);   -- libera 1 homologação para testar o envio ao Pós-venda
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','__UID__','email','teste@teste','role','authenticated')::text, true);
do $$
declare tipo text := '__TIPO__'; gest boolean := ('__TIPO__' in ('admin','gestao')); n bigint; r record; linhas int; ok boolean; msg text;
begin
  select * into r from ref;
  -- 1) ninguém se promove: trocar o próprio perfil para admin tem que ser bloqueado (admin pode)
  begin
    update perfis set perfil='admin' where id = auth.uid();
    ok := (tipo='admin'); msg := 'permitido';
  exception when others then ok := (tipo<>'admin'); msg := 'bloqueado';
  end;
  insert into resultados values ('auto-promoção para admin', case when tipo='admin' then 'permitido (é admin)' else 'bloqueado' end, msg, ok);
  -- 2) dados pessoais de terceiros
  select count(*) into n from perfis_basico() where cpf is not null and id <> auth.uid();
  insert into resultados values ('perfis_basico não expõe CPF de terceiros', '0', n::text, n=0);
  select count(*) into n from perfis;
  insert into resultados values ('perfis visíveis', case when gest then '> 1 (todos)' else '1 (só o próprio)' end, n::text, case when gest then n>1 else n=1 end);
  -- 3) tabelas sensíveis
  select count(*) into n from contratos;
  insert into resultados values ('contratos visíveis', case when gest then 'todos' when tipo='instalador' then '0' else 'menos que o total' end, n||' de '||r.contratos,
    case when gest then n=r.contratos when tipo='instalador' then n=0 else n<r.contratos end);
  select count(*) into n from comissoes;
  insert into resultados values ('comissões visíveis', case when gest then 'todas' else 'menos que o total' end, n||' de '||r.comissoes,
    case when gest then n=r.comissoes else n<r.comissoes end);
  select count(*) into n from relacionamento_agenda;
  insert into resultados values ('régua de relacionamento', case when gest then 'todas' when tipo='vendedor' then 'só as dele' else '0' end, n||' de '||r.agenda,
    case when gest then n=r.agenda when tipo='vendedor' then n<r.agenda else n=0 end);
  select count(*) into n from portal_tokens;
  insert into resultados values ('links do portal do cliente', case when gest then 'todos' else 'menos que o total' end, n||' de '||r.portal,
    case when gest then n=r.portal else n<r.portal end);
  -- 4) vistoria: instalador e homologador LEEM, mas não alteram
  if tipo in ('instalador','homologador') then
    select count(*) into n from vistorias;
    insert into resultados values ('leitura do laudo da vistoria', '> 0', n::text, n>0);
    update vistorias set atualizado_em = atualizado_em where id in (select id from vistorias limit 3);
    get diagnostics linhas = row_count;
    insert into resultados values ('alteração da vistoria', '0 linhas (somente leitura)', linhas::text, linhas=0);
  end if;
  -- 5) histórico: não dá para forjar o autor
  begin
    insert into historico(tabela, registro_id, usuario_id, usuario_nome, acao, descricao) values ('_teste','0','00000000-0000-0000-0000-000000000000','forjado','teste','x');
    msg := 'permitido'; ok := false;
  exception when others then msg := 'bloqueado'; ok := true;
  end;
  insert into resultados values ('histórico com autor forjado', 'bloqueado', msg, ok);
  -- 6) enviar ao Pós-venda: gestão/vendedor/homologador podem; instalador e vistoriador não
  begin
    perform mover_para_posvenda(r.hom_id, current_date);
    msg := 'permitido'; ok := gest or tipo in ('vendedor','homologador');
  exception when others then msg := 'bloqueado'; ok := tipo in ('instalador','vistoria');
  end;
  insert into resultados values ('enviar ao Pós-venda', case when gest or tipo in ('vendedor','homologador') then 'permitido' else 'bloqueado' end, msg, ok);
end $$;
reset role;
select * from resultados order by ok, teste;
rollback;
