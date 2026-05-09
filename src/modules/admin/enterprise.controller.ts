import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StaffService } from './staff.service';
import { PosService } from './pos.service';
import { PosCheckoutService } from './pos-checkout.service';
import { CommissionService } from './commission.service';
import { LoyaltyService } from './loyalty.service';
import { ProductsService } from './products.service';
import { BusinessService } from './business.service';
import { CategoriesService } from './categories.service';
import { InventoryService } from './inventory.service';
import { CreateStaffDto, UpdateCommissionDto, UpdateStaffProfileDto } from './dto/staff.dto';
import { CheckoutDto, CreateProductDto } from './dto/pos.dto';
import { MarkCommissionsPaidDto, RedeemPointsDto, UpdateLoyaltyConfigDto } from './dto/enterprise.dto';

@Controller('enterprise')
@UseGuards(JwtAuthGuard)
export class EnterpriseController {
  constructor(
    private readonly staffService: StaffService,
    private readonly posService: PosService,
    private readonly posCheckoutService: PosCheckoutService,
    private readonly commissionService: CommissionService,
    private readonly loyaltyService: LoyaltyService,
    private readonly productsService: ProductsService,
    private readonly businessService: BusinessService,
    private readonly categoriesService: CategoriesService,
    private readonly inventoryService: InventoryService,
  ) {}

  private requireBusiness(req: any): string {
    if (!req.user?.businessId) {
      throw new BadRequestException('Nenhum negocio associado a este usuario');
    }
    return req.user.businessId;
  }

  // --- Business & Loyalty Config ---
  @Get('business')
  async getBusiness(@Request() req) {
    return this.businessService.getById(this.requireBusiness(req));
  }

  @Patch('loyalty')
  async updateLoyalty(@Request() req, @Body() dto: UpdateLoyaltyConfigDto) {
    return this.businessService.updateLoyalty(this.requireBusiness(req), dto);
  }

  // --- Staff Routes ---
  @Post('staff')
  async addStaff(@Request() req, @Body() dto: CreateStaffDto) {
    return this.staffService.addProfessional(this.requireBusiness(req), dto);
  }

  @Get('staff')
  async listStaff(@Request() req) {
    const businessId = req.user?.businessId;
    if (!businessId) return [];
    return this.staffService.listStaff(businessId);
  }

  @Patch('staff/:id/commission')
  async updateStaffCommission(@Param('id') id: string, @Body() dto: UpdateCommissionDto) {
    return this.staffService.updateCommission(id, dto.percentage);
  }

  @Patch('staff/:id/profile')
  async updateStaffProfile(@Param('id') id: string, @Request() req, @Body() dto: UpdateStaffProfileDto) {
    return this.staffService.updateProfile(id, this.requireBusiness(req), dto);
  }

  @Delete('staff/:id')
  async removeStaff(@Param('id') id: string, @Request() req) {
    return this.staffService.removeStaff(id, this.requireBusiness(req));
  }

  // --- Categories ---
  @Post('categories')
  async createCategory(@Request() req, @Body() data: { name: string }) {
    return this.categoriesService.create(this.requireBusiness(req), data);
  }

  @Get('categories')
  async listCategories(@Request() req) {
    const businessId = req.user?.businessId;
    if (!businessId) return [];
    return this.categoriesService.findAll(businessId);
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Request() req, @Body() data: { name: string }) {
    return this.categoriesService.update(id, this.requireBusiness(req), data);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string, @Request() req) {
    return this.categoriesService.delete(id, this.requireBusiness(req));
  }

  // --- Inventory & Products ---
  @Post('products')
  async createProduct(@Request() req, @Body() dto: CreateProductDto) {
    return this.productsService.create(this.requireBusiness(req), dto);
  }

  @Get('products')
  async listProducts(@Request() req) {
    const businessId = req.user?.businessId;
    if (!businessId) return [];
    return this.productsService.findAll(businessId);
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Request() req, @Body() dto: Partial<CreateProductDto>) {
    return this.productsService.update(id, this.requireBusiness(req), dto);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string, @Request() req) {
    return this.productsService.delete(id, this.requireBusiness(req));
  }

  // --- Inventory ---
  @Get('inventory/movements')
  async getMovements(@Request() req, @Query('productId') productId?: string) {
    return this.inventoryService.getMovements(this.requireBusiness(req), productId);
  }

  @Get('inventory/low-stock')
  async getLowStock(@Request() req) {
    return this.inventoryService.getLowStock(this.requireBusiness(req));
  }

  @Post('inventory/restock')
  async restock(@Request() req, @Body() data: { productId: string; quantity: number; reason: string }) {
    return this.inventoryService.restock(data.productId, this.requireBusiness(req), data.quantity, data.reason || 'RESTOCK');
  }

  // --- POS Routes ---
  @Post('checkout')
  async checkout(@Request() req, @Body() dto: CheckoutDto) {
    const sale = await this.posService.checkout(this.requireBusiness(req), req.user.id, dto);
    await this.loyaltyService.processSalePoints(sale.id);
    return sale;
  }

  @Post('checkout/appointment/:id')
  async checkoutAppointment(@Param('id') id: string, @Body() body: {
    tipAmount?: number;
    tipPercentage?: number;
    paymentMethod: string;
    useInternalCredit?: boolean;
    splitEnabled?: boolean;
  }) {
    return this.posCheckoutService.checkoutAppointment(id, body);
  }

  @Get('checkout/appointment/:id/tips')
  async getTipSuggestions(@Param('id') id: string) {
    return this.posCheckoutService.getTipSuggestions(id);
  }

  // --- Client Credit ---
  @Post('clients/:id/credit')
  async addClientCredit(@Param('id') id: string, @Body() body: { amount: number; description: string }) {
    return this.posCheckoutService.addClientCredit(id, body.amount, body.description);
  }

  @Get('clients/:id/credit')
  async getClientCredit(@Param('id') id: string) {
    return this.posCheckoutService.getClientCredit(id);
  }

  // --- Commission Routes ---
  @Get('commissions')
  async getCommissions(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    return this.commissionService.getReport(req.user.id, start, end);
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
