import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (order matters due to FK constraints)
  console.log('🧹 Cleaning existing data...');
  await prisma.chatLog.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.clientPhoto.deleteMany();
  await prisma.review.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.clientCreditTransaction.deleteMany();
  await prisma.clientCredit.deleteMany();
  await prisma.splitTransaction.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.loyaltyConfig.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Data cleaned.');

  // ── Users ──
  const passwordHash = await hashPassword('password123');

  console.log('👤 Creating users...');

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@zenda.com',
      passwordHash,
      phone: '+5511999999999',
      role: 'ADMIN',
      plan: 'PRO',
      slug: 'admin-user',
    },
  });

  const businessOwner = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@barbearia.com',
      passwordHash,
      phone: '+5511988888888',
      role: 'USER',
      plan: 'PRO',
      businessName: 'Barbearia do João',
      slug: 'barbearia-do-joao',
      pixKeyType: 'CPF',
      pixKey: '12345678900',
      pixName: 'João Silva',
      pixCity: 'São Paulo',
    },
  });

  const professional1 = await prisma.user.create({
    data: {
      name: 'Maria Oliveira',
      email: 'maria@barbearia.com',
      passwordHash,
      phone: '+5511977777777',
      role: 'PROFESSIONAL',
      plan: 'FREE',
      baseCommission: 30,
      slug: 'maria-oliveira',
    },
  });

  const professional2 = await prisma.user.create({
    data: {
      name: 'Carlos Santos',
      email: 'carlos@barbearia.com',
      passwordHash,
      phone: '+5511966666666',
      role: 'PROFESSIONAL',
      plan: 'FREE',
      baseCommission: 25,
      slug: 'carlos-santos',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Ana Costa',
      email: 'ana@barbearia.com',
      passwordHash,
      phone: '+5511955555555',
      role: 'MANAGER',
      plan: 'FREE',
      slug: 'ana-costa',
    },
  });

  console.log(`✅ Created ${5} users.`);

  // ── Business ──
  console.log('🏢 Creating business...');

  const business = await prisma.business.create({
    data: {
      name: 'Barbearia do João',
      slug: 'barbearia-do-joao',
      ownerId: businessOwner.id,
      pixKey: '12345678900',
      staff: {
        connect: [
          { id: professional1.id },
          { id: professional2.id },
          { id: manager.id },
        ],
      },
    },
  });

  // Link professionals to business
  await prisma.user.updateMany({
    where: { id: { in: [professional1.id, professional2.id, manager.id] } },
    data: { businessId: business.id },
  });

  console.log('✅ Business created.');

  // ── SiteSettings ──
  console.log('⚙️ Creating site settings...');

  await prisma.siteSettings.create({
    data: {
      userId: businessOwner.id,
      themeColor: '#1a1a2e',
      heroTitle: 'Barbearia do João - Estilo e Tradição',
      heroSubtitle: 'O melhor corte da região há mais de 10 anos',
      aboutText: 'Somos especialistas em cortes masculinos e barba. Venha conhecer nosso espaço.',
      instagramUrl: 'https://instagram.com/barbeariadojoao',
      whatsappUrl: 'https://wa.me/5511988888888',
      city: 'São Paulo',
      state: 'SP',
      metaTitle: 'Barbearia do João - Agende Online',
      metaDescription: 'Agende seu corte na melhor barbearia de São Paulo.',
      galleryPhotos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ],
    },
  });

  console.log('✅ Site settings created.');

  // ── Services ──
  console.log('✂️ Creating services...');

  const serviceData = [
    { name: 'Corte de Cabelo', duration: 30, price: 45, userId: professional1.id },
    { name: 'Barba', duration: 20, price: 30, userId: professional1.id },
    { name: 'Corte + Barba', duration: 50, price: 65, userId: professional1.id },
    { name: 'Corte Degradê', duration: 40, price: 55, userId: professional2.id },
    { name: 'Barba Completa', duration: 30, price: 35, userId: professional2.id },
    { name: 'Pigmentação', duration: 45, price: 80, userId: professional2.id },
  ];

  const services = await Promise.all(
    serviceData.map((s) =>
      prisma.service.create({
        data: {
          name: s.name,
          duration: s.duration,
          price: s.price,
          userId: s.userId,
        },
      }),
    ),
  );

  console.log(`✅ Created ${services.length} services.`);

  // ── Schedules ──
  console.log('📅 Creating schedules...');

  const scheduleData = [
    { userId: professional1.id, weekday: 1, startTime: '09:00', endTime: '18:00' },
    { userId: professional1.id, weekday: 2, startTime: '09:00', endTime: '18:00' },
    { userId: professional1.id, weekday: 3, startTime: '09:00', endTime: '18:00' },
    { userId: professional1.id, weekday: 4, startTime: '09:00', endTime: '18:00' },
    { userId: professional1.id, weekday: 5, startTime: '09:00', endTime: '18:00' },
    { userId: professional2.id, weekday: 1, startTime: '10:00', endTime: '19:00' },
    { userId: professional2.id, weekday: 2, startTime: '10:00', endTime: '19:00' },
    { userId: professional2.id, weekday: 3, startTime: '10:00', endTime: '19:00' },
    { userId: professional2.id, weekday: 4, startTime: '10:00', endTime: '19:00' },
    { userId: professional2.id, weekday: 5, startTime: '10:00', endTime: '19:00' },
    { userId: professional2.id, weekday: 6, startTime: '09:00', endTime: '14:00' },
  ];

  await Promise.all(
    scheduleData.map((s) =>
      prisma.schedule.create({
        data: {
          userId: s.userId,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: 30,
        },
      }),
    ),
  );

  console.log(`✅ Created ${scheduleData.length} schedules.`);

  // ── Clients ──
  console.log('👥 Creating clients...');

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Pedro Almeida',
        phone: '+5511911111111',
        email: 'pedro@email.com',
        userId: businessOwner.id,
        notes: 'Cliente VIP',
        birthday: new Date('1990-05-15'),
        tags: ['VIP', 'Frequente'],
      },
    }),
    prisma.client.create({
      data: {
        name: 'Lucas Ferreira',
        phone: '+5511922222222',
        email: 'lucas@email.com',
        userId: businessOwner.id,
        birthday: new Date('1985-08-22'),
        tags: ['Novo'],
      },
    }),
    prisma.client.create({
      data: {
        name: 'Rafael Lima',
        phone: '+5511933333333',
        userId: businessOwner.id,
        notes: 'Prefere corte degradê',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Gabriel Souza',
        phone: '+5511944444444',
        email: 'gabriel@email.com',
        userId: businessOwner.id,
        pointsBalance: 150,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Thiago Rocha',
        phone: '+5511955550000',
        userId: businessOwner.id,
      },
    }),
  ]);

  console.log(`✅ Created ${clients.length} clients.`);

  // ── Appointments ──
  console.log('📋 Creating appointments...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

  const appointments = await Promise.all([
    // Completed appointment
    prisma.appointment.create({
      data: {
        clientId: clients[0].id,
        userId: professional1.id,
        serviceId: services[0].id,
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        startTime: '14:00',
        endTime: '14:30',
        price: 45,
        status: 'COMPLETED',
        notes: 'Corte regular',
      },
    }),
    // Today's appointment
    prisma.appointment.create({
      data: {
        clientId: clients[1].id,
        userId: professional1.id,
        serviceId: services[2].id,
        date: now,
        startTime: '16:00',
        endTime: '16:50',
        price: 65,
        status: 'CONFIRMED',
      },
    }),
    // Tomorrow's appointment
    prisma.appointment.create({
      data: {
        clientId: clients[2].id,
        userId: professional2.id,
        serviceId: services[3].id,
        date: tomorrow,
        startTime: '10:00',
        endTime: '10:40',
        price: 55,
        status: 'SCHEDULED',
      },
    }),
    // Next week appointment
    prisma.appointment.create({
      data: {
        clientId: clients[3].id,
        userId: professional2.id,
        serviceId: services[5].id,
        date: nextWeek,
        startTime: '15:00',
        endTime: '15:45',
        price: 80,
        status: 'SCHEDULED',
      },
    }),
    // Cancelled appointment
    prisma.appointment.create({
      data: {
        clientId: clients[4].id,
        userId: professional1.id,
        serviceId: services[1].id,
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        startTime: '11:00',
        endTime: '11:20',
        price: 30,
        status: 'CANCELLED',
        notes: 'Cliente cancelou',
      },
    }),
  ]);

  console.log(`✅ Created ${appointments.length} appointments.`);

  // ── Payments ──
  console.log('💳 Creating payments...');

  await prisma.payment.create({
    data: {
      appointmentId: appointments[1].id,
      amount: 65,
      status: 'PENDING',
      pixCode: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000',
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: appointments[0].id,
      amount: 45,
      status: 'PAID',
      pixCode: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000',
      paidAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    },
  });

  console.log('✅ Payments created.');

  // ── Commissions ──
  console.log('💰 Creating commissions...');

  await prisma.commission.create({
    data: {
      userId: professional1.id,
      appointmentId: appointments[0].id,
      amount: 13.5,
      percentage: 30,
      status: 'PAID',
      paidAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.commission.create({
    data: {
      userId: professional1.id,
      appointmentId: appointments[1].id,
      amount: 19.5,
      percentage: 30,
      status: 'PENDING',
    },
  });

  console.log('✅ Commissions created.');

  // ── Reviews ──
  console.log('⭐ Creating reviews...');

  await prisma.review.create({
    data: {
      clientId: clients[0].id,
      appointmentId: appointments[0].id,
      businessId: business.id,
      rating: 5,
      comment: 'Excelente atendimento! Recomendo.',
      serviceRating: 5,
      professionalRating: 5,
      isPublic: true,
    },
  });

  console.log('✅ Reviews created.');

  // ── LoyaltyConfig ──
  console.log('🎁 Creating loyalty config...');

  await prisma.loyaltyConfig.create({
    data: {
      businessId: business.id,
      pointsPerReal: 1,
      minRedeemPoints: 100,
      active: true,
    },
  });

  console.log('✅ Loyalty config created.');

  // ── ClientCredit ──
  console.log('💎 Creating client credit...');

  const clientCredit = await prisma.clientCredit.create({
    data: {
      clientId: clients[3].id,
      balance: 50,
      transactions: {
        create: {
          amount: 50,
          type: 'CREDIT',
          description: 'Crédito de fidelidade - 500 pontos resgatados',
        },
      },
    },
  });

  console.log('✅ Client credit created.');

  // ── Categories ──
  console.log('📦 Creating categories...');

  const categories = await Promise.all([
    prisma.category.create({
      data: { businessId: business.id, name: 'Produtos Capilares' },
    }),
    prisma.category.create({
      data: { businessId: business.id, name: 'Barba' },
    }),
    prisma.category.create({
      data: { businessId: business.id, name: 'Acessórios' },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories.`);

  // ── Products ──
  console.log('🧴 Creating products...');

  const products = await Promise.all([
    prisma.product.create({
      data: {
        businessId: business.id,
        name: 'Pomada Modeladora',
        sku: 'POM-001',
        price: 45,
        costPrice: 20,
        stock: 15,
        minStock: 5,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: 'Óleo para Barba',
        sku: 'OLEO-001',
        price: 35,
        costPrice: 15,
        stock: 20,
        minStock: 5,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: 'Shampoo Especial',
        sku: 'SHAM-001',
        price: 55,
        costPrice: 25,
        stock: 10,
        minStock: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products.`);

  // ── Inventory Movements ──
  console.log('📊 Creating inventory movements...');

  await prisma.inventoryMovement.create({
    data: {
      productId: products[0].id,
      quantity: 20,
      type: 'IN',
      reason: 'Compra inicial',
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: products[0].id,
      quantity: 5,
      type: 'OUT',
      reason: 'Venda',
    },
  });

  console.log('✅ Inventory movements created.');

  // ── Sales ──
  console.log('🛒 Creating sales...');

  const sale = await prisma.sale.create({
    data: {
      businessId: business.id,
      customerId: clients[0].id,
      sellerId: professional1.id,
      totalAmount: 80,
      tipAmount: 10,
      discountAmount: 0,
      paymentMethod: 'PIX',
      status: 'COMPLETED',
      loyaltyPoints: 80,
      items: {
        create: [
          { productId: products[0].id, quantity: 1, price: 45 },
          { productId: products[1].id, quantity: 1, price: 35 },
        ],
      },
    },
  });

  console.log('✅ Sales created.');

  // ── Sale Commission ──
  console.log('💰 Creating sale commission...');

  await prisma.commission.create({
    data: {
      userId: professional1.id,
      saleId: sale.id,
      amount: 24,
      percentage: 30,
      status: 'PENDING',
    },
  });

  console.log('✅ Sale commission created.');

  // ── Client Photos ──
  console.log('📸 Creating client photos...');

  await prisma.clientPhoto.create({
    data: {
      clientId: clients[0].id,
      appointmentId: appointments[0].id,
      type: 'HAIRCUT',
      url: 'https://example.com/haircut1.jpg',
      thumbnailUrl: 'https://example.com/haircut1-thumb.jpg',
      description: 'Corte degradê na máquina',
    },
  });

  console.log('✅ Client photos created.');

  // ── Chat Session ──
  console.log('💬 Creating chat session...');

  await prisma.chatSession.create({
    data: {
      phoneNumber: '+5511911111111',
      clientId: clients[0].id,
      businessId: business.id,
      state: 'IDLE',
      context: [],
      logs: {
        create: [
          {
            incoming: 'Olá, gostaria de agendar um corte',
            outgoing: 'Claro! Temos horários disponíveis amanhã às 10h e 14h. Qual prefere?',
            intent: 'BOOK_APPOINTMENT',
            confidence: 0.95,
            metadata: {},
          },
        ],
      },
    },
  });

  console.log('✅ Chat session created.');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('   Email: admin@zenda.com');
  console.log('   Email: joao@barbearia.com');
  console.log('   Email: maria@barbearia.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
