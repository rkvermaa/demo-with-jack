import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * RegisterDto — validated request body for POST /auth/register.
 *
 * Validation rules (enforced by the global ValidationPipe):
 *  - email:    must be a well-formed email address and non-empty → 400 on failure (AC5).
 *  - password: must be a non-empty string (MinLength(1) rejects empty string) → 400 on failure (AC6).
 *
 * No minimum password length beyond 1 is specified in the ticket.
 * If the team adds a complexity rule later, extend MinLength here and add an AC6 sub-case.
 */
export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email should not be empty' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password should not be empty' })
  @MinLength(1, { message: 'password should not be empty' })
  password!: string;
}
