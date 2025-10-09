// prisma/truncate-all.ts
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Schemas geridos pela app
const SCHEMAS = ['public', 'core', 'auth', 'org', 'log'];

// Segurança: só permite em dev e com flag explícita
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Por segurança, não se pode limpar dados em production.');
  process.exit(1);
}
if (process.env.ALLOW_DATA_WIPE !== '1') {
  console.error('❌ Define ALLOW_DATA_WIPE=1 para confirmar a limpeza.');
  process.exit(1);
}

async function main() {
  // Gera SQL TRUNCATE para TODAS as tabelas exceto _prisma_migrations
  const result = await prisma.$queryRaw<Array<{ sql: string }>>`
    SELECT 'TRUNCATE TABLE '
      || string_agg(format('%I.%I', schemaname, tablename), ', ')
      || ' RESTART IDENTITY CASCADE' AS sql
    FROM pg_tables
    WHERE schemaname = ANY(${SCHEMAS})
      AND tablename <> '_prisma_migrations';
  `;

  const sql = result[0]?.sql;
  if (!sql) {
    console.log('❌ Nenhuma tabela encontrada para truncar.');
    return;
  }

  console.log('🔥 A limpar TODAS as tabelas:');
  console.log('SQL:', sql);

  if (process.env.DRY_RUN === '1') {
    console.log('DRY_RUN=1 ativo: SQL não foi executado.');
    return;
  }

  await prisma.$executeRawUnsafe(sql);
  console.log('✅ TODAS as tabelas foram limpas (identidades reiniciadas).');

  // Verificar se ainda há dados
  console.log('\n🔍 Verificando tabelas após limpeza...');
  const checkResult = await prisma.$queryRaw<
    Array<{ schema: string; table: string; count: number }>
  >`
    SELECT 
      schemaname as schema,
      tablename as table,
      (xpath('/row/cnt/text()', query_to_xml(format('select count(*) as cnt from %I.%I', schemaname, tablename), false, true, '')))[1]::text::int as count
    FROM pg_tables 
    WHERE schemaname = ANY(${SCHEMAS})
      AND tablename <> '_prisma_migrations'
    ORDER BY schemaname, tablename;
  `;

  let hasData = false;
  for (const row of checkResult) {
    if (row.count > 0) {
      console.log(`⚠️  ${row.schema}.${row.table}: ${row.count} registos`);
      hasData = true;
    }
  }

  if (!hasData) {
    console.log('✅ Todas as tabelas estão vazias!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
