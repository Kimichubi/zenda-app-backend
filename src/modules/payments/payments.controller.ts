import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("pix")
  createPix(@Body() dto: CreatePixPaymentDto) {
    return this.paymentsService.createPix(dto);
  }
}
