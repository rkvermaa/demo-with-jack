import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';

/**
 * RegisterModule — wires the POST /auth/register feature.
 *
 * Imports:
 *  - TypeOrmModule.forFeature([User])  → provides the UserRepository for injection.
 *  - AuthModule                        → re-exports JwtModule so JwtService is available.
 *
 * The module is imported by AppModule so its controller and service are
 * registered in the application DI container.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [RegisterController],
  providers: [RegisterService],
})
export class RegisterModule {}
