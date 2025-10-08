import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Payload contém: { sub: userId, username, email, roles }
    // Buscar utilizador completo para garantir que ainda existe e está ativo
    const user = await this.usersService.findById(payload.sub);

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      roles: user.userRoles.map((ur) => ur.role.roleName),
    };
  }
}
