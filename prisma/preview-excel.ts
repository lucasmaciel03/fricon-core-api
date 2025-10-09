// prisma/preview-excel.ts
import * as XLSX from 'xlsx';
import * as path from 'path';

async function previewExcelData() {
  try {
    console.log('📁 A ler ficheiro Excel...');

    // Caminho para o ficheiro Excel
    const excelPath = path.join(__dirname, 'data', 'core_data.xlsx');

    // Ler o ficheiro Excel
    const workbook = XLSX.readFile(excelPath);

    console.log('📊 Folhas encontradas:', workbook.SheetNames);

    // Mostrar estrutura de cada folha
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n📋 Folha: ${sheetName}`);
      console.log('='.repeat(50));

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log(`📊 Total de registos: ${data.length}`);

      if (data.length > 0) {
        console.log('🔍 Colunas disponíveis:');
        const firstRow = data[0] as any;
        Object.keys(firstRow).forEach((key, index) => {
          console.log(`  ${index + 1}. ${key}`);
        });

        console.log('\n📄 Primeiros 2 registos:');
        data.slice(0, 2).forEach((row, index) => {
          console.log(`\nRegisto ${index + 1}:`);
          console.log(JSON.stringify(row, null, 2));
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao ler ficheiro:', error);
  }
}

// Executar preview
previewExcelData().catch(console.error);
