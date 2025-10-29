// prisma/import-excel.ts
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

    // Caminho para o ficheiro Excel
    const excelPath = path.join(__dirname, 'data', 'core_data.xlsx');

    // Ler o ficheiro Excel
    const workbook = XLSX.readFile(excelPath);

    console.log('📊 Folhas encontradas:', workbook.SheetNames);

    // Processar cada folha
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n🔄 A processar folha: ${sheetName}`);

      const worksheet = workbook.Sheets[sheetName];
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      console.log(
        `📋 Encontrados ${data.length} registos na folha ${sheetName}`,
      );

      // Mostrar primeiras linhas para debug
      if (data.length > 0) {
        console.log('🔍 Primeira linha (colunas disponíveis):');
        console.log(Object.keys(data[0]));
        console.log('📄 Primeiros 3 registos:');
        console.log(data.slice(0, 3));
      }

      // Aqui vamos adicionar a lógica de importação baseada no nome da folha
      await processSheet(sheetName, data);
    }

    console.log('✅ Importação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    throw error;
  }
}

async function processSheet(sheetName: string, data: ExcelRow[]) {
  const lowerSheetName = sheetName.toLowerCase();

  try {
    if (
      lowerSheetName.includes('user') ||
      lowerSheetName.includes('utilizador')
    ) {
      await importUsers(data);
    } else if (
      lowerSheetName.includes('factor') ||
      lowerSheetName.includes('fabrica')
    ) {
      await importFactories(data);
    } else if (
      lowerSheetName.includes('team') ||
      lowerSheetName.includes('equipa')
    ) {
      await importTeams(data);
    } else if (
      lowerSheetName.includes('department') ||
      lowerSheetName.includes('departamento')
    ) {
      await importDepartments(data);
    } else if (
      lowerSheetName.includes('warehouse') ||
      lowerSheetName.includes('armazem')
    ) {
      await importWarehouses(data);
    } else if (lowerSheetName.includes('setor')) {
      await importSetors(data);
    } else if (
      lowerSheetName.includes('role') ||
      lowerSheetName.includes('papel')
    ) {
      await importRoles(data);
    } else {
      console.log(`⚠️  Folha '${sheetName}' não reconhecida - a ignorar`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar folha '${sheetName}':`, error);
    throw error;
  }
}

async function importUsers(data: ExcelRow[]) {
  console.log('👥 A importar utilizadores...');

  for (const row of data) {
    try {
      // Mapear colunas do Excel para campos da base de dados
      const userData = {
        username: row.username || row.Username || row.USERNAME,
        firstname:
          row.firstname ||
          row.Firstname ||
          row.FIRSTNAME ||
          row.nome ||
          row.Nome,
        lastname:
          row.lastname ||
          row.Lastname ||
          row.LASTNAME ||
          row.apelido ||
          row.Apelido,
        email: row.email || row.Email || row.EMAIL,
        passwordHash: row.password ? await hashPassword(row.password) : null,
        userStatusId: 1, // Assumir status ativo
      };

      // Validar dados obrigatórios
      if (!userData.username || !userData.firstname || !userData.lastname) {
        console.log('⚠️  A saltar utilizador com dados incompletos:', userData);
        continue;
      }

      const user = await prisma.user.create({
        data: userData,
      });

      console.log(
        `✅ Utilizador criado: ${user.username} (ID: ${user.userId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar utilizador:', row, error);
    }
  }
}

async function importFactories(data: ExcelRow[]) {
  console.log('🏭 A importar fábricas...');

  for (const row of data) {
    try {
      const factoryData = {
        name: row.factoryName || row.nome || row.Name || row.factory_name,
        location:
          row.factoryAddress ||
          row.morada ||
          row.Address ||
          row.factory_address ||
          row.location ||
          'N/A',
      };

      if (!factoryData.name) {
        console.log('⚠️  A saltar fábrica sem nome:', row);
        continue;
      }

      const factory = await prisma.factory.create({
        data: factoryData,
      });

      console.log(
        `✅ Fábrica criada: ${factory.name} (ID: ${factory.factoryId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar fábrica:', row, error);
    }
  }
}

async function importTeams(data: ExcelRow[]) {
  console.log('👥 A importar equipas...');

  for (const row of data) {
    try {
      const teamData = {
        name: row.teamName || row.nome || row.Name || row.team_name,
        factoryId: row.factoryId || row.factory_id || 1, // Default para primeira fábrica
      };

      if (!teamData.name) {
        console.log('⚠️  A saltar equipa sem nome:', row);
        continue;
      }

      const team = await prisma.team.create({
        data: teamData,
      });

      console.log(`✅ Equipa criada: ${team.name} (ID: ${team.teamId})`);
    } catch (error) {
      console.error('❌ Erro ao criar equipa:', row, error);
    }
  }
}

async function importDepartments(data: ExcelRow[]) {
  console.log('🏢 A importar departamentos...');

  for (const row of data) {
    try {
      const deptData = {
        name: row.departmentName || row.nome || row.Name || row.department_name,
        factoryId: row.factoryId || row.factory_id || 1,
      };

      if (!deptData.name) {
        console.log('⚠️  A saltar departamento sem nome:', row);
        continue;
      }

      const dept = await prisma.department.create({
        data: deptData,
      });

      console.log(
        `✅ Departamento criado: ${dept.name} (ID: ${dept.depId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar departamento:', row, error);
    }
  }
}

async function importWarehouses(data: ExcelRow[]) {
  console.log('📦 A importar armazéns...');

  for (const row of data) {
    try {
      const warehouseData = {
        name: row.warehouseName || row.nome || row.Name || row.warehouse_name,
        code: row.warehouseCode || row.codigo || row.Code || row.warehouse_code,
        factoryId: row.factoryId || row.factory_id || 1,
      };

      if (!warehouseData.name) {
        console.log('⚠️  A saltar armazém sem nome:', row);
        continue;
      }

      const warehouse = await prisma.warehouse.create({
        data: warehouseData,
      });

      console.log(
        `✅ Armazém criado: ${warehouse.name} (ID: ${warehouse.warehouseId})`,
      );
    } catch (error) {
      console.error('❌ Erro ao criar armazém:', row, error);
    }
  }
}

async function importSetors(data: ExcelRow[]) {
  console.log('🏭 A importar setores...');

  for (const row of data) {
    try {
      const setorData = {
        name: row.setorName || row.nome || row.Name || row.setor_name,
        factoryId: row.factoryId || row.factory_id || 1,
      };

      if (!setorData.name) {
        console.log('⚠️  A saltar setor sem nome:', row);
        continue;
      }

      const setor = await prisma.setor.create({
        data: setorData,
      });

      console.log(`✅ Setor criado: ${setor.name} (ID: ${setor.setorId})`);
    } catch (error) {
      console.error('❌ Erro ao criar setor:', row, error);
    }
  }
}

async function importRoles(data: ExcelRow[]) {
  console.log('🔐 A importar papéis...');

  for (const row of data) {
    try {
      const roleData = {
        roleName: row.roleName || row.nome || row.Name || row.role_name,
        description: row.roleDescription || row.descricao || row.Description || '',
      };

      if (!roleData.roleName) {
        console.log('⚠️  A saltar papel sem nome:', row);
        continue;
      }

      // Verificar se já existe
      const existing = await prisma.role.findUnique({
        where: { roleName: roleData.roleName },
      });

      if (existing) {
        console.log(`⚠️  Papel '${roleData.roleName}' já existe - a saltar`);
        continue;
      }

      const role = await prisma.role.create({
        data: roleData,
      });

      console.log(`✅ Papel criado: ${role.roleName} (ID: ${role.roleId})`);
    } catch (error) {
      console.error('❌ Erro ao criar papel:', row, error);
    }
  }
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcrypt');
  return await bcrypt.hash(password, 10);
}

// Executar importação
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
