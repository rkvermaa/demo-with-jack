import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from './roles.enum';

/**
 * JWT payload shape agreed with GCG-4.
 * - sub:        user ID (string)
 * - role:       single Role enum value (string)
 * - operatorId: operator account ID (string | undefined — absent for PLAYER/ADMIN)
 */
export interface JwtPayload {
  sub: string;
  role: Role;
  operatorId?: string;
  iat?: number;
  exp?: number;
}

/**
 * JwtStrategy — validates the Bearer token from the Authorization header.
 * The validate() method returns the decoded payload as-is; NestJS attaches it
 * to request.user. No database call is made here.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? 'changeme',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Return payload as-is; it becomes request.user downstream.
    return payload;
  }
}
