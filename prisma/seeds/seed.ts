/*
  Seed script for:
  - Users & Authentication models: UserStatus, User, Role, UserRole
  - Organization models: Factory, Team, Department, Warehouse, Setor
  - User ↔ Organization associations: UserFactory, UserTeam, UserDepartment, UserWarehouse, UserSetor

  Notes
  - Users start with passwordHash = null
  - Idempotent via upsert/find-or-create patterns
  - Assumes Prisma Client output path is ../generated/prisma (as set in schema.prisma)
*/

import { PrismaClient, Prisma } from "../../generated/prisma";

const prisma = new PrismaClient();

// -------------------------------
// helpers (idempotent creators)
// -------------------------------
async function upsertUserStatus(statusName: string, statusDescription: string) {
  return prisma.userStatus.upsert({
    where: { statusName },
    update: {},
    create: { statusName, statusDescription },
  });
}

async function upsertRole(roleName: string, description: string) {
  return prisma.role.upsert({
    where: { roleName },
    update: {},
    create: { roleName, description },
  });
}

async function upsertUser(
  username: string,
  createData: Omit<Prisma.UserUncheckedCreateInput, 'username'>,
  updateData?: Prisma.UserUncheckedUpdateInput
) {
  return prisma.user.upsert({
    where: { username },
    update: updateData ?? { username, ...createData },
    create: { username, ...createData },
  });
}

async function findOrCreateFactory(name: string, location: string) {
  const found = await prisma.factory.findFirst({ where: { name, location } });
  if (found) return found;
  return prisma.factory.create({ data: { name, location } });
}

async function findOrCreateTeam(factoryId: number, name: string) {
  const found = await prisma.team.findFirst({ where: { factoryId, name } });
  if (found) return found;
  return prisma.team.create({ data: { factoryId, name } });
}

async function findOrCreateDepartment(factoryId: number, name: string) {
  const found = await prisma.department.findFirst({ where: { factoryId, name } });
  if (found) return found;
  return prisma.department.create({ data: { factoryId, name } });
}

// Warehouse has a composite unique (factoryId, code) so we can upsert safely
async function upsertWarehouse(factoryId: number, code: string, name: string) {
  return prisma.warehouse.upsert({
    where: { factoryId_code: { factoryId, code } },
    update: { name },
    create: { factoryId, code, name },
  });
}

async function findOrCreateSetor(factoryId: number, name: string, acronym?: string | null) {
  const found = await prisma.setor.findFirst({ where: { factoryId, name } });
  if (found) return found;
  return prisma.setor.create({ data: { factoryId, name, acronym: acronym ?? null } });
}

async function upsertUserRole(userId: number, roleId: number) {
  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId },
  });
}

async function upsertUserFactory(userId: number, factoryId: number) {
  return prisma.userFactory.upsert({
    where: { userId_factoryId: { userId, factoryId } },
    update: {},
    create: { userId, factoryId },
  });
}

async function upsertUserTeam(userId: number, teamId: number) {
  return prisma.userTeam.upsert({
    where: { userId_teamId: { userId, teamId } },
    update: {},
    create: { userId, teamId },
  });
}

async function upsertUserDepartment(userId: number, depId: number) {
  return prisma.userDepartment.upsert({
    where: { userId_depId: { userId, depId } },
    update: {},
    create: { userId, depId },
  });
}

async function upsertUserWarehouse(userId: number, warehouseId: number) {
  return prisma.userWarehouse.upsert({
    where: { userId_warehouseId: { userId, warehouseId } },
    update: {},
    create: { userId, warehouseId },
  });
}

async function upsertUserSetor(userId: number, setorId: number) {
  return prisma.userSetor.upsert({
    where: { userId_setorId: { userId, setorId } },
    update: {},
    create: { userId, setorId },
  });
}

// -------------------------------
// main seeding
// -------------------------------
async function main() {
  console.log("🌱 Seeding (Users, Org, Associations)...");

  // 1) User statuses
  const [statusAtivo, statusInativo, statusPendente] = await Promise.all([
    upsertUserStatus("ATIVO", "Utilizador ativo"),
    upsertUserStatus("INATIVO", "Utilizador inativo"),
    upsertUserStatus("PENDENTE", "Aguardando ativação"),
  ]);

  // 2) Roles
  const [roleAdmin, roleGestor, roleOperador] = await Promise.all([
    upsertRole("Admin", "Administrador do sistema"),
    upsertRole("Gestor", "Gestão operacional"),
    upsertRole("Operador", "Operações no chão de fábrica"),
  ]);

  // 3) Users (passwordHash = null)
  const [admin, gestor, operador] = await Promise.all([
    upsertUser(
      "admin",
      {
        firstname: "Admin",
        lastname: "Root",
        email: null,
        passwordHash: null,
        userStatusId: statusAtivo.statusId,
        userIsLocked: false,
        userAvatar: null,
        createdBy: null,
        updatedBy: null,
        userLastLogin: null,
        deletedAt: null,
      },
      {
        firstname: "Admin",
        lastname: "Root",
        email: null,
        userStatusId: statusAtivo.statusId,
        userIsLocked: false,
        userAvatar: null,
      }
    ),
    upsertUser(
      "gestor.joana",
      {
        firstname: "Joana",
        lastname: "Gestora",
        email: "joana@example.com",
        passwordHash: null,
        userStatusId: statusAtivo.statusId,
        userIsLocked: false,
        userAvatar: null,
        createdBy: null,
        updatedBy: null,
        userLastLogin: null,
        deletedAt: null,
      },
      {
        firstname: "Joana",
        lastname: "Gestora",
        email: "joana@example.com",
        userStatusId: statusAtivo.statusId,
        userIsLocked: false,
        userAvatar: null,
      }
    ),
    upsertUser(
      "operador.luis",
      {
        firstname: "Luís",
        lastname: "Operador",
        email: null,
        passwordHash: null,
        userStatusId: statusPendente.statusId,
        userIsLocked: false,
        userAvatar: null,
        createdBy: null,
        updatedBy: null,
        userLastLogin: null,
        deletedAt: null,
      },
      {
        firstname: "Luís",
        lastname: "Operador",
        email: null,
        userStatusId: statusPendente.statusId,
        userIsLocked: false,
        userAvatar: null,
      }
    ),
  ]);

  // 4) User ↔ Role
  await Promise.all([
    upsertUserRole(admin.userId, roleAdmin.roleId),
    upsertUserRole(gestor.userId, roleGestor.roleId),
    upsertUserRole(operador.userId, roleOperador.roleId),
  ]);

  // 5) Factories
  const fabricaNorte = await findOrCreateFactory("Fábrica Norte", "Póvoa de Varzim");
  const fabricaSul = await findOrCreateFactory("Fábrica Sul", "Lisboa");

  // 6) Teams
  const [teamProducaoN, teamManutencaoN] = await Promise.all([
    findOrCreateTeam(fabricaNorte.factoryId, "Produção"),
    findOrCreateTeam(fabricaNorte.factoryId, "Manutenção"),
  ]);
  const [teamProducaoS] = await Promise.all([
    findOrCreateTeam(fabricaSul.factoryId, "Produção"),
  ]);

  // 7) Departments
  const [depComprasN, depDSIN, depComercialN] = await Promise.all([
    findOrCreateDepartment(fabricaNorte.factoryId, "Compras"),
    findOrCreateDepartment(fabricaNorte.factoryId, "DSI"),
    findOrCreateDepartment(fabricaNorte.factoryId, "Comercial"),
  ]);

  // 8) Warehouses (with composite unique upsert)
  const [whNA1, whNA2, whSA1] = await Promise.all([
    upsertWarehouse(fabricaNorte.factoryId, "N-A1", "Armazém A1 Norte"),
    upsertWarehouse(fabricaNorte.factoryId, "N-A2", "Armazém A2 Norte"),
    upsertWarehouse(fabricaSul.factoryId, "S-A1", "Armazém A1 Sul"),
  ]);

  // 9) Setors
  const [setorH1, setorJ1, setorG1, setorSMR, setorINT] = await Promise.all([
    findOrCreateSetor(fabricaNorte.factoryId, "Horizontais Montagem Final UPA", "H1"),
    findOrCreateSetor(fabricaNorte.factoryId, "Pré Montagem", "J1"),
    findOrCreateSetor(fabricaNorte.factoryId, "Testes", "G1"),
    findOrCreateSetor(fabricaNorte.factoryId, "SMR Embalagem", "F1"),
    findOrCreateSetor(fabricaSul.factoryId, "Interiores", "A1"),
  ]);

  // 10) User ↔ Factory
  await Promise.all([
    upsertUserFactory(admin.userId, fabricaNorte.factoryId),
    upsertUserFactory(gestor.userId, fabricaNorte.factoryId),
    upsertUserFactory(operador.userId, fabricaSul.factoryId),
  ]);

  // 11) User ↔ Team
  await Promise.all([
    upsertUserTeam(gestor.userId, teamProducaoN.teamId),
    upsertUserTeam(gestor.userId, teamManutencaoN.teamId),
    upsertUserTeam(operador.userId, teamProducaoS.teamId),
  ]);

  // 12) User ↔ Department
  await Promise.all([
    upsertUserDepartment(admin.userId, depDSIN.depId),
    upsertUserDepartment(gestor.userId, depComprasN.depId),
    upsertUserDepartment(gestor.userId, depComercialN.depId),
  ]);

  // 13) User ↔ Warehouse
  await Promise.all([
    upsertUserWarehouse(gestor.userId, whNA1.warehouseId),
    upsertUserWarehouse(operador.userId, whSA1.warehouseId),
  ]);

  // 14) User ↔ Setor
  await Promise.all([
    upsertUserSetor(operador.userId, setorH1.setorId),
    upsertUserSetor(operador.userId, setorJ1.setorId),
    upsertUserSetor(gestor.userId, setorG1.setorId),
    upsertUserSetor(gestor.userId, setorSMR.setorId),
    upsertUserSetor(admin.userId, setorINT.setorId),
  ]);

  console.log("✅ Seed concluído sem erros.");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
