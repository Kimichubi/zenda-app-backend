import { Controller, Get, Param } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

@Controller("public/payments")
export class PaymentsPublicController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get(":id")
  async getPaymentDetails(@Param("id") id: string) {
    return this.paymentsService.getPublicPaymentDetails(id);
  }
}
