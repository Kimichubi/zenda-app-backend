import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { StaffService } from './staff.service';
import { PosService } from './pos.service';
import { PosCheckoutService } from './pos-checkout.service';
import { CommissionService } from './commission.service';
import { LoyaltyService } from './loyalty.service';
import { ProductsService } from './products.service';
import { BusinessService } from './business.service';
import { CategoriesService } from './categories.service';
import { InventoryService } from './inventory.service';
import { ReviewService } from './review.service';
import { EnterpriseController } from './enterprise.controller';
import { ReviewController } from './review.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    forwardRef(() => AppointmentsModule),
  ],
  controllers: [AdminController, EnterpriseController, ReviewController],
  providers: [
    StaffService,
    PosService,
    PosCheckoutService,
    CommissionService,
    LoyaltyService,
    ProductsService,
    BusinessService,
    CategoriesService,
    InventoryService,
    ReviewService,
  ],
  exports: [StaffService, PosService, PosCheckoutService, CommissionService, LoyaltyService, ProductsService, BusinessService, CategoriesService, InventoryService, ReviewService],
})
export class AdminModule {}
