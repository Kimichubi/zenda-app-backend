import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StaffService } from './staff.service';
import { PosService } from './pos.service';
import { CommissionService } from './commission.service';
import { LoyaltyService } from './loyalty.service';
import { ProductsService } from './products.service';
import { BusinessService } from './business.service';
import { CreateStaffDto, UpdateCommissionDto } from './dto/staff.dto';
import { CheckoutDto, CreateProductDto } from './dto/pos.dto';
import { MarkCommissionsPaidDto, RedeemPointsDto, UpdateLoyaltyConfigDto } from './dto/enterprise.dto';

@Controller('enterprise')
@UseGuards(JwtAuthGuard)
export class EnterpriseController {
  constructor(
    private readonly staffService: StaffService,
    private readonly posService: PosService,
    private readonly commissionService: CommissionService,
    private readonly loyaltyService: LoyaltyService,
    private readonly productsService: ProductsService,
    private readonly businessService: BusinessService,
  ) {}

  // --- Business & Loyalty Config ---
  @Get('business')
  async getBusiness(@Request() req) {
    return this.businessService.getById(req.user.businessId);
  }

  @Patch('loyalty')
  async updateLoyalty(@Request() req, @Body() dto: UpdateLoyaltyConfigDto) {
    return this.businessService.updateLoyalty(req.user.businessId, dto);
  }

  // --- Staff Routes ---
  @Post('staff')
  async addStaff(@Request() req, @Body() dto: CreateStaffDto) {
    return this.staffService.addProfessional(req.user.businessId, dto);
  }

  @Get('staff')
  async listStaff(@Request() req) {
    return this.staffService.listStaff(req.user.businessId);
  }

  @Patch('staff/:id/commission')
  async updateStaffCommission(@Param('id') id: string, @Body() dto: UpdateCommissionDto) {
    return this.staffService.updateCommission(id, dto.percentage);
  }

  // --- Inventory & Products ---
  @Post('products')
  async createProduct(@Request() req, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.user.businessId, dto);
  }

  @Get('products')
  async listProducts(@Request() req) {
    return this.productsService.findAll(req.user.businessId);
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Request() req, @Body() dto: Partial<CreateProductDto>) {
    return this.productsService.update(id, req.user.businessId, dto);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string, @Request() req) {
    return this.productsService.delete(id, req.user.businessId);
  }

  // --- POS Routes ---
  @Post('checkout')
  async checkout(@Request() req, @Body() dto: CheckoutDto) {
    const sale = await this.posService.checkout(req.user.businessId, req.user.id, dto);
    await this.loyaltyService.processSalePoints(sale.id);
    return sale;
  }

  // --- Commission Routes ---
  @Get('commissions')
  async getCommissions(@Request() req) {
    return this.commissionService.getReport(req.user.id, new Date(0), new Date());
  }

  @Post('commissions/pay')
  async payCommissions(@Body() dto: MarkCommissionsPaidDto) {
    return this.commissionService.markAsPaid(dto.commissionIds);
  }

  // --- Loyalty Routes ---
  @Post('loyalty/redeem')
  async redeemPoints(@Body() dto: RedeemPointsDto) {
    return this.loyaltyService.redeemPoints(dto.clientId, dto.points);
  }
}
