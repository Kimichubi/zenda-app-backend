import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { StaffService } from './staff.service';
import { PosService } from './pos.service';
import { CommissionService } from './commission.service';
import { LoyaltyService } from './loyalty.service';
import { ProductsService } from './products.service';
import { BusinessService } from './business.service';
import { EnterpriseController } from './enterprise.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    DatabaseModule, 
    UsersModule,
    forwardRef(() => AppointmentsModule),
  ],
  controllers: [AdminController, EnterpriseController],
  providers: [
    StaffService,
    PosService,
    CommissionService,
    LoyaltyService,
    ProductsService,
    BusinessService,
  ],
  exports: [StaffService, PosService, CommissionService, LoyaltyService, ProductsService, BusinessService],
})
export class AdminModule {}
