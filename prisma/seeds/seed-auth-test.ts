import { PrismaClient } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with test data...\n');

  // 1. Criar User Status
  console.log('Creating user statuses...');
  const activeStatus = await prisma.userStatus.upsert({
    where: { statusName: 'ACTIVE' },
    update: {},
    create: {
      statusName: 'ACTIVE',
      statusDescription: 'Utilizador ativo e pode fazer login',
    },
  });

  const pendingStatus = await prisma.userStatus.upsert({
    where: { statusName: 'PENDING' },
    update: {},
    create: {
      statusName: 'PENDING',
      statusDescription: 'Utilizador pendente - aguarda definição de password',
    },
  });

  console.log('✅ User statuses created\n');

  // 2. Criar Roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { roleName: 'ADMIN' },
    update: {},
    create: {
      roleName: 'ADMIN',
      description: 'Administrador do sistema',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { roleName: 'USER' },
    update: {},
    create: {
      roleName: 'USER',
      description: 'Utilizador padrão',
    },
  });

  console.log('✅ Roles created\n');

  // 3. Criar utilizador COM password (para testar login)
  console.log('Creating user WITH password...');
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const userWithPassword = await prisma.user.upsert({
    where: { username: 'joao.silva' },
    update: {},
    create: {
      username: 'joao.silva',
      firstname: 'João',
      lastname: 'Silva',
      email: 'joao.silva@fricon.com',
      passwordHash: hashedPassword,
      userStatusId: activeStatus.statusId,
      userIsLocked: false,
    },
  });

  // Associar role USER
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: userWithPassword.userId,
        roleId: userRole.roleId,
      },
    },
    update: {},
    create: {
      userId: userWithPassword.userId,
      roleId: userRole.roleId,
    },
  });

  console.log('✅ User created:');
  console.log(`   Username: joao.silva`);
  console.log(`   Email: joao.silva@fricon.com`);
  console.log(`   Password: senha123`);
  console.log(`   Status: ACTIVE\n`);

  // 4. Criar utilizador SEM password (para testar erro)
  console.log('Creating user WITHOUT password...');
  const userWithoutPassword = await prisma.user.upsert({
    where: { username: 'maria.santos' },
    update: {},
    create: {
      username: 'maria.santos',
      firstname: 'Maria',
      lastname: 'Santos',
      email: 'maria.santos@fricon.com',
      passwordHash: null, // SEM PASSWORD
      userStatusId: pendingStatus.statusId,
      userIsLocked: false,
    },
  });

  // Associar role USER
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: userWithoutPassword.userId,
        roleId: userRole.roleId,
      },
    },
    update: {},
    create: {
      userId: userWithoutPassword.userId,
      roleId: userRole.roleId,
    },
  });

  console.log('✅ User created:');
  console.log(`   Username: maria.santos`);
  console.log(`   Email: maria.santos@fricon.com`);
  console.log(`   Password: NOT SET`);
  console.log(`   Status: PENDING\n`);

  // 5. Criar utilizador admin COM password
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      firstname: 'Admin',
      lastname: 'System',
      email: 'admin@fricon.com',
      passwordHash: adminPassword,
      userStatusId: activeStatus.statusId,
      userIsLocked: false,
    },
  });

  // Associar role ADMIN
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.userId,
        roleId: adminRole.roleId,
      },
    },
    update: {},
    create: {
      userId: adminUser.userId,
      roleId: adminRole.roleId,
    },
  });

  console.log('✅ Admin user created:');
  console.log(`   Username: admin`);
  console.log(`   Email: admin@fricon.com`);
  console.log(`   Password: admin123`);
  console.log(`   Role: ADMIN\n`);

  console.log('🎉 Seeding completed successfully!\n');
  console.log('📋 Test users available:');
  console.log('   1. joao.silva / senha123 (with password)');
  console.log('   2. maria.santos (without password)');
  console.log('   3. admin / admin123 (admin role)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
