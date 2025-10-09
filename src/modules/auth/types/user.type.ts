export interface UserWithRelations {
  userId: number;
  username: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  userIsLocked: boolean;
  lockReason: string | null;
  lockedAt: Date | null;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userStatusId: number | null;
  userStatus: {
    userStatusId: number;
    statusName: string;
    statusDescription: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  userRoles: Array<{
    userRoleId: number;
    userId: number;
    roleId: number;
    assignedAt: Date;
    assignedBy: number | null;
    role: {
      roleId: number;
      roleName: string;
      roleDescription: string | null;
      permissions: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
}
