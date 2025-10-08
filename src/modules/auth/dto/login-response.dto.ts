export class LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: {
    userId: number;
    username: string;
    email: string | null;
    firstname: string;
    lastname: string;
    roles: string[];
  };
}
