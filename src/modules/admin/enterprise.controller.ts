import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StaffService } from './staff.service';
import { PosService } from './pos.service';
import { CommissionService } from './commission.service';
import { LoyaltyService } from './loyalty.service';
import { ProductsService } from './products.service';
import { BusinessService } from './business.service';
import { CategoriesService } from './categories.service';
import { InventoryService } from './inventory.service';
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
    private readonly categoriesService: CategoriesService,
    private readonly inventoryService: InventoryService,
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

  @Delete('staff/:id')
  async removeStaff(@Param('id') id: string, @Request() req) {
    return this.staffService.removeStaff(id, req.user.businessId);
  }

  // --- Categories ---
  @Post('categories')
  async createCategory(@Request() req, @Body() data: { name: string }) {
    return this.categoriesService.create(req.user.businessId, data);
  }

  @Get('categories')
  async listCategories(@Request() req) {
    return this.categoriesService.findAll(req.user.businessId);
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Request() req, @Body() data: { name: string }) {
    return this.categoriesService.update(id, req.user.businessId, data);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string, @Request() req) {
    return this.categoriesService.delete(id, req.user.businessId);
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

  // --- Inventory ---
  @Get('inventory/movements')
  async getMovements(@Request() req, @Query('productId') productId?: string) {
    return this.inventoryService.getMovements(req.user.businessId, productId);
  }

  @Get('inventory/low-stock')
  async getLowStock(@Request() req) {
    return this.inventoryService.getLowStock(req.user.businessId);
  }

  @Post('inventory/restock')
  async restock(@Request() req, @Body() data: { productId: string; quantity: number; reason: string }) {
    return this.inventoryService.restock(data.productId, req.user.businessId, data.quantity, data.reason || 'RESTOCK');
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