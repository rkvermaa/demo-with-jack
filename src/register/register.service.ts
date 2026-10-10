import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../auth/roles.enum';
import { RegisterDto } from './dto/register.dto';

export interface RegisterResult {
  accessToken: string;
}

/**
 * RegisterService — handles the POST /auth/register business logic.
 *
 * Steps:
 *  1. Check for an existing user with the same email → 409 ConflictException (AC4).
 *  2. Hash the plain-text password with bcrypt (cost factor 10) → never stored plain (AC3).
 *  3. Persist the new User entity with role defaulting to PLAYER (AC2).
 *  4. Sign a JWT with { sub: user.id, role: user.role } and return { accessToken } (AC1, AC2).
 */
@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResult> {
    // AC4 — reject duplicate email
    const existing = await this.userRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new ConflictException('email already in use');
    }

    // AC3 — hash password before persisting
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Persist new user; role defaults to PLAYER via entity column default
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      role: Role.PLAYER,
    });
    const saved = await this.userRepository.save(user);

    // AC1, AC2 — sign JWT with sub (user id) and role
    const accessToken = this.jwtService.sign({
      sub: saved.id,
      role: saved.role,
    });

    return { accessToken };
  }
}
