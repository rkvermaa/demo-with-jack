import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { OperatorScopeGuard } from '../auth/operator-scope.guard';
import { PlayerScopeGuard } from '../auth/player-scope.guard';
import { JwtPayload } from '../auth/jwt.strategy';

/**
 * FixturesController — stub endpoints used for testing and documentation.
 *
 * These routes give integration tests concrete targets without depending on
 * unbuilt business-logic controllers. Replace or extend in later stories.
 */
@Controller()
export class FixturesController {
  // ── PUBLIC routes ────────────────────────────────────────────────────────

  /** AC6: Health-check — no token required. */
  @Public()
  @Get('health')
  healthCheck(): { status: string } {
    return { status: 'ok' };
  }

  /** AC6: Login stub — no token required. */
  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(): { message: string } {
    return { message: 'login stub' };
  }

  /** AC6: Registration stub — no token required. */
  @Public()
  @Post('auth/register')
  @HttpCode(201)
  register(): { message: string } {
    return { message: 'register stub' };
  }

  // ── PLAYER routes ────────────────────────────────────────────────────────

  /**
   * AC2 / AC11: Player wallet (no :playerId param) — requires PLAYER role.
   * Used for AC2 (unauthenticated → 401) and AC3 (PLAYER role check).
   */
  @Roles(Role.PLAYER)
  @Get('player/wallet')
  getWallet(): { balance: number } {
    return { balance: 0 };
  }

  /**
   * AC5b / AC11: Player wallet scoped to a specific player.
   * PlayerScopeGuard enforces that PLAYER_X cannot read PLAYER_Y's wallet.
   * ADMIN is listed explicitly so the decorator accurately reflects all
   * permitted roles (RolesGuard also short-circuits for ADMIN, but the
   * annotation must not mislead future readers into thinking only PLAYERs
   * may call this route).
   */
  @Roles(Role.PLAYER, Role.ADMIN)
  @UseGuards(PlayerScopeGuard)
  @Get('player/wallet/:playerId')
  getWalletById(
    @Param('playerId') _playerId: string,
    @Req() req: Request,
  ): { balance: number; playerId: string } {
    const user = req.user as JwtPayload;
    return { balance: 0, playerId: user.sub };
  }

  // ── OPERATOR_ADMIN routes ────────────────────────────────────────────────

  /**
   * AC3 / AC4 / AC10: Operator dashboard — requires OPERATOR_ADMIN role.
   * OperatorScopeGuard enforces that OPERATOR_ADMIN_A cannot access operator B.
   * Accepts ?operatorId=<id> query param for scoping tests.
   */
  @Roles(Role.OPERATOR_ADMIN)
  @UseGuards(OperatorScopeGuard)
  @Get('operator/dashboard')
  getDashboard(
    @Req() req: Request,
    @Query('operatorId') _operatorId?: string,
  ): { operatorId: string | undefined } {
    const user = req.user as JwtPayload;
    return { operatorId: user.operatorId };
  }

  // ── ADMIN routes ─────────────────────────────────────────────────────────

  /** AC4 / AC5: Admin users list — requires ADMIN role. */
  @Roles(Role.ADMIN)
  @Get('admin/users')
  getUsers(): { users: unknown[] } {
    return { users: [] };
  }
}
