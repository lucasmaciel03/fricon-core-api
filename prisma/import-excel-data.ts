// prisma/import-excel-data.ts
import * as XLSX from 'xlsx';
import { PrismaClient } from '../generated/prisma';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExcelRow {
  [key: string]: any;
}

async function importExcelData() {
  try {
    console.log('📁 A ler ficheiro Excel...');

    const excelPath = path.join(__dirname, 'data', 'core_data.xlsx');
    const workbook = XLSX.readFile(excelPath);

    console.log('📊 Folhas encontradas:', workbook.SheetNames);

    // Importar em ordem de dependências
    await importFactories(workbook);
    await importRoles(workbook);
    await importUserStatus(workbook);
    await importUsers(workbook);
    await importDepartments(workbook);
    await importSetors(workbook);
    await importWarehouses(workbook);

    console.log('✅ Importação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    throw error;
  }
}

async function importFactories(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets['tbl_factories'];
  if (!worksheet) {
    console.log('⚠️  Folha tbl_factories não encontrada');
    return;
  }

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`🏭 A importar ${data.length} fábricas...`);

  for (const row of data) {
    try {
      const factory = await prisma.factory.create({
        data: {
          name: String(row.name || '').trim(),
          location: String(row.location || '').trim(),
        },
      });

      console.log(
        `✅ Fábrica criada: ${factory.name} (ID: ${factory.factoryId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar fábrica:', row, error);
    }
  }
}

async function importRoles(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets['tbl_roles'];
  if (!worksheet) {
    console.log('⚠️  Folha tbl_roles não encontrada');
    return;
  }

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`🔐 A importar ${data.length} papéis...`);

  for (const row of data) {
    try {
      // Verificar se já existe
      const existing = await prisma.role.findUnique({
        where: { roleName: String(row.role_name || '').trim() },
      });

      if (existing) {
        console.log(`⚠️  Papel '${row.role_name}' já existe - a saltar`);
        continue;
      }

      const role = await prisma.role.create({
        data: {
          roleName: String(row.role_name || '').trim(),
          description: String(row.description || '').trim(),
        },
      });

      console.log(`✅ Papel criado: ${role.roleName} (ID: ${role.roleId})`);
    } catch (error) {
      console.error('❌ Erro ao criar papel:', row, error);
    }
  }
}

async function importUserStatus(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets['tbl_user_status'];
  if (!worksheet) {
    console.log('⚠️  Folha tbl_user_status não encontrada');
    return;
  }

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`👤 A importar ${data.length} status de utilizador...`);

  for (const row of data) {
    try {
      // Verificar se já existe
      const existing = await prisma.userStatus.findUnique({
        where: { statusName: String(row.status_name || '').trim() },
      });

      if (existing) {
        console.log(`⚠️  Status '${row.status_name}' já existe - a saltar`);
        continue;
      }

      const status = await prisma.userStatus.create({
        data: {
          statusName: String(row.status_name || '').trim(),
          statusDescription: String(row.description || '').trim(),
        },
      });

      console.log(
        `✅ Status criado: ${status.statusName} (ID: ${status.statusId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar status:', row, error);
    }
  }
}

async function importUsers(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets['tbl_users'];
  if (!worksheet) {
    console.log('⚠️  Folha tbl_users não encontrada');
    return;
  }

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`👥 A importar ${data.length} utilizadores...`);

  for (const row of data) {
    try {
      // Extrair nome e apelido do firstname se necessário
      const fullName = String(row.firstname || '').trim();
      const nameParts = fullName.split(' ');
      const firstname = nameParts[0] || 'Nome';
      const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const user = await prisma.user.create({
        data: {
          username: String(row.username || '').trim(),
          firstname,
          lastname,
          email: String(row.email || '').trim() || null,
          userStatusId: Number(row.user_status_id) || 1,
          userIsLocked: Boolean(Number(row.user_is_locked) || 0),
          passwordHash: null, // Password deve ser null - será definida no primeiro acesso
        },
      });

      console.log(
        `✅ Utilizador criado: ${user.username} (ID: ${user.userId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar utilizador:', row, error);
    }
  }
}

async function importDepartments(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets['tbl_departments'];
  if (!worksheet) {
    console.log('⚠️  Folha tbl_departments não encontrada');
    return;
  }

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`🏢 A importar ${data.length} departamentos...`);

  for (const row of data) {
    try {
      const dept = await prisma.department.create({
        data: {
          name: String(row.name || '').trim(),
          factoryId: Number(row.factory_id) || 1,
        },
      });

      console.log(`✅ Departamento criado: ${dept.name} (ID: ${dept.depId})`);
    } catch (error) {
      console.error('❌ Erro ao criar departamento:', row, error);
    }
  }
}

async function importSetors(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets['tbl_setors'];
  if (!worksheet) {
    console.log('⚠️  Folha tbl_setors não encontrada');
    return;
  }

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`🏭 A importar ${data.length} setores...`);

  for (const row of data) {
    try {
      const setor = await prisma.setor.create({
        data: {
          name: String(row.name || '').trim(),
          acronym: String(row.acronym || '').trim() || null,
          factoryId: Number(row.factory_id) || 1,
        },
      });

      console.log(`✅ Setor criado: ${setor.name} (ID: ${setor.setorId})`);
    } catch (error) {
      console.error('❌ Erro ao criar setor:', row, error);
    }
  }
}

async function importWarehouses(workbook: XLSX.WorkBook) {
  const worksheet = workbook.Sheets['core_data'];
  if (!worksheet) {
    console.log('⚠️  Folha core_data não encontrada');
    return;
  }

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`📦 A importar ${data.length} armazéns...`);

  for (const row of data) {
    try {
      const warehouse = await prisma.warehouse.create({
        data: {
          name: String(row.name || '').trim(),
          code: String(row.code || '').trim(),
          factoryId: Number(row.factory_id) || 1,
        },
      });

      console.log(
        `✅ Armazém criado: ${warehouse.name} (ID: ${warehouse.warehouseId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar armazém:', row, error);
    }
  }
}

async function main() {
  try {
    await importExcelData();
  } catch (error) {
    console.error('❌ Falha na importação:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
