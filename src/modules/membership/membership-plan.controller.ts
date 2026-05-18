import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { MembershipPlanService } from "./membership-plan.service";
import { CreateMembershipPlanDto } from "./dto/create-plan.dto";
import { UpdateMembershipPlanDto } from "./dto/update-plan.dto";

@Controller("membership/plans")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class MembershipPlanController {
  constructor(private readonly planService: MembershipPlanService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateMembershipPlanDto) {
    return this.planService.create(req.user.businessId, dto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query("includeInactive") includeInactive?: string,
  ) {
    return this.planService.findAll(req.user.businessId, includeInactive === "true");
  }

  @Get("report")
  getReport(@Request() req: any) {
    return this.planService.getReport(req.user.businessId);
  }

  @Get(":id")
  findById(@Request() req: any, @Param("id") id: string) {
    return this.planService.findById(req.user.businessId, id);
  }

  @Patch(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.planService.update(req.user.businessId, id, dto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.planService.remove(req.user.businessId, id);
  }
}
