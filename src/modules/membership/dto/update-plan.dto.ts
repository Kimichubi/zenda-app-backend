import { PartialType } from "@nestjs/mapped-types";
import { CreateMembershipPlanDto } from "./create-plan.dto";

export class UpdateMembershipPlanDto extends PartialType(CreateMembershipPlanDto) {}
