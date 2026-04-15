import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EvaluationService } from './evaluation.service';

@Controller('evaluation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('sheep/:sheepId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  evaluateSheep(@Param('sheepId') sheepId: string) {
    return this.evaluationService.evaluateSheep(sheepId);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  summary() {
    return this.evaluationService.summary();
  }
}
