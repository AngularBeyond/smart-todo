import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface UserPayload {
  userId: string;
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') ?? 'default-access-secret',
    });
  }

  validate(payload: { sub: string; email: string }): UserPayload {
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException('Invalid token payload.');
    }
    return {
      userId: payload.sub,
      sub: payload.sub,
      email: payload.email,
    };
  }
}
