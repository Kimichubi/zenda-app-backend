import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsService } from "./payments.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post("pix")
  createPix(@Body() dto: CreatePixPaymentDto) {
    return this.paymentsService.createPix(dto);
  }

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.paymentsService.listForUser(user.id);
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
