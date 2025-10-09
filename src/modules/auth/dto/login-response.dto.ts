export class LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: {
    userId: number;
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    roles: string[];
  };
}
