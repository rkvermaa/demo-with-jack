import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { RegisterService, RegisterResult } from './register.service';

/**
 * RegisterController — exposes POST /auth/register.
 *
 * @Public() ensures JwtAuthGuard skips JWT verification for this route (AC7).
 * The global ValidationPipe rejects invalid DTOs with HTTP 400 (AC5, AC6).
 * On success the service returns { accessToken } with HTTP 201 (AC1).
 */
@Controller()
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Public()
  @Post('auth/register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto): Promise<RegisterResult> {
    return this.registerService.register(dto);
  }
}
