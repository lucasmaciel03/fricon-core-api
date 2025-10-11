import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Username',
    example: 'jrajao.consultor',
  })
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'joao.rajao@fricon.pt',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: 'First name',
    example: 'João',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'Last name',
    example: 'Rajão',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'Phone number',
    example: '+351912345678',
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: 'Whether the user is locked',
    example: false,
  })
  userIsLocked: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    description: 'When password was last changed',
    example: '2024-01-10T14:20:00Z',
    nullable: true,
  })
  passwordChangedAt: Date | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Account last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User roles',
    type: [String],
    example: ['User', 'Manager'],
  })
  roles: string[];

  @ApiProperty({
    description: 'User status information',
    nullable: true,
  })
  userStatus: {
    userStatusId: number;
    statusName: string;
    statusDescription: string | null;
    isActive: boolean;
  } | null;
}

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'User profile data',
    type: UserProfileDto,
  })
  user: UserProfileDto;

  @ApiProperty({
    description: 'Success message',
    example: 'User profile retrieved successfully',
  })
  message: string;
}
