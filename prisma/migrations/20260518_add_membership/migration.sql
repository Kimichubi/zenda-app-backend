-- CreateEnum
CREATE TYPE "BillingFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMESTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'TRIALING', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "billingFrequency" "BillingFrequency" NOT NULL DEFAULT 'MONTHLY',
    "usageLimitsPerPeriod" INTEGER,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT true,
    "extraBenefits" TEXT,
    "validDays" INTEGER,
    "validStartHour" TEXT,
    "validEndHour" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minCommitmentMonths" INTEGER NOT NULL DEFAULT 1,
    "cancellationRules" TEXT,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "maxActiveSubscriptions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceMembershipPlan" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "usageLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceMembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSubscription" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "pauseUntil" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "lastBillingAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "usageLimit" INTEGER,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT true,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentGateway" TEXT,
    "gatewayPaymentId" TEXT,
    "pixCode" TEXT,
    "boletoUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "invoiceUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipUsage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "serviceId" TEXT,
    "appointmentId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "MembershipUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipPlan_businessId_idx" ON "MembershipPlan"("businessId");

-- CreateIndex
CREATE INDEX "MembershipPlan_businessId_isActive_idx" ON "MembershipPlan"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMembershipPlan_planId_serviceId_key" ON "ServiceMembershipPlan"("planId", "serviceId");

-- CreateIndex
CREATE INDEX "ClientSubscription_businessId_idx" ON "ClientSubscription"("businessId");

-- CreateIndex
CREATE INDEX "ClientSubscription_clientId_idx" ON "ClientSubscription"("clientId");

-- CreateIndex
CREATE INDEX "ClientSubscription_planId_idx" ON "ClientSubscription"("planId");

-- CreateIndex
CREATE INDEX "ClientSubscription_status_idx" ON "ClientSubscription"("status");

-- CreateIndex
CREATE INDEX "ClientSubscription_nextBillingAt_idx" ON "ClientSubscription"("nextBillingAt");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_dueDate_idx" ON "SubscriptionPayment"("dueDate");

-- CreateIndex
CREATE INDEX "MembershipUsage_subscriptionId_idx" ON "MembershipUsage"("subscriptionId");

-- CreateIndex
CREATE INDEX "MembershipUsage_usedAt_idx" ON "MembershipUsage"("usedAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_businessId_idx" ON "AuditLog"("businessId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "MembershipPlan" ADD CONSTRAINT "MembershipPlan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMembershipPlan" ADD CONSTRAINT "ServiceMembershipPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMembershipPlan" ADD CONSTRAINT "ServiceMembershipPlan_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSubscription" ADD CONSTRAINT "ClientSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSubscription" ADD CONSTRAINT "ClientSubscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSubscription" ADD CONSTRAINT "ClientSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ClientSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipUsage" ADD CONSTRAINT "MembershipUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ClientSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipUsage" ADD CONSTRAINT "MembershipUsage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

