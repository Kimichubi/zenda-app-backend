import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, BadRequestException, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsService } from "./payments.service";
import { FindPaymentsDto } from "./dto/find-payments.dto";

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("payments")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post("pix")
  createPix(@Body() dto: CreatePixPaymentDto) {
    return this.paymentsService.createPix(dto);
  }

  @Get()
  list(@Request() req, @Query() query: FindPaymentsDto) {
    return this.paymentsService.listForBusiness(requireBusinessId(req), query);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.paymentsService.getById(id);
  }

  @Patch(":id/paid")
  markAsPaid(@Param("id") id: string) {
    return this.paymentsService.markAsPaid(id);
  }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.paymentsService.cancel(id);
  }
}
