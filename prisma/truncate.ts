// prisma/truncate.ts
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Schemas geridos pela app
const SCHEMAS = ['public', 'core', 'auth', 'org', 'log'];

// Tabelas a preservar (lookup/seed)
const KEEP = [
  'core.tbl_user_status',
  'core.tbl_roles',
  // adiciona aqui se precisares: 'org.tbl_factories', etc.
];

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
  // Gera SQL TRUNCATE seguro com format('%I.%I') e exclui KEEP + _prisma_migrations
  const result = await prisma.$queryRaw<Array<{ sql: string }>>`
    SELECT 'TRUNCATE TABLE '
      || string_agg(format('%I.%I', schemaname, tablename), ', ')
      || ' RESTART IDENTITY CASCADE' AS sql
    FROM pg_tables
    WHERE schemaname = ANY(${SCHEMAS})
      AND tablename <> '_prisma_migrations'
      AND (schemaname || '.' || tablename) <> ALL(${KEEP});
  `;

  const sql = result[0]?.sql;
  if (!sql) {
    console.log('Nada para truncar (talvez só KEEP?).');
    return;
  }

  console.log('A executar:', sql);
  if (process.env.DRY_RUN === '1') {
    console.log('DRY_RUN=1 ativo: SQL não foi executado.');
    return;
  }
  await prisma.$executeRawUnsafe(sql);
  console.log('✅ Dados truncados (identidades reiniciadas).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
