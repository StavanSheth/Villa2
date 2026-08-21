import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');
  const roleNames = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER', 'GUEST'];
  const roles = [];

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roles.push(role);
  }

  console.log('Seeding prototype users...');
  
  // Note: Password is 'Villa@1234'. In production, this would be handled by Firebase Auth,
  // but we store a mock firebaseUid for testing relationships.
  const usersToSeed = [
    { email: 'superadmin@mavon.online', role: 'SUPER_ADMIN', firstName: 'Super', lastName: 'Admin' },
    { email: 'admin@mavon.online', role: 'ADMIN', firstName: 'System', lastName: 'Admin' },
    { email: 'staff@mavon.online', role: 'STAFF', firstName: 'Support', lastName: 'Staff' },
    { email: 'customer1@mavon.online', role: 'CUSTOMER', firstName: 'John', lastName: 'Doe' },
    { email: 'customer2@mavon.online', role: 'CUSTOMER', firstName: 'Jane', lastName: 'Smith' },
    { email: 'guest@mavon.online', role: 'GUEST', firstName: 'Random', lastName: 'Guest' },
  ];

  for (const [index, u] of usersToSeed.entries()) {
    const role = roles.find((r) => r.name === u.role);
    if (!role) continue;

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        firebaseUid: `mock_firebase_uid_${index}`,
        emailVerified: true,
      },
    });

    // Assign role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      }
    });
  }

  // ----------------------------------------------------
  // Seed PMS Data
  // ----------------------------------------------------
  console.log('Seeding Villa & PMS data...');

  const villa = await prisma.villa.upsert({
    where: { id: 'villa-1' },
    update: {},
    create: {
      id: 'villa-1',
      name: "Chunawala's Seven C Villa",
      description: 'Luxury 4BHK with Private Pool and Seaview.',
      basePrice: 10000,
      capacity: 10,
      bedrooms: 4,
      bathrooms: 4,
      amenities: ['Pool', 'WiFi', 'AC', 'Kitchen', 'BBQ'],
      images: ['/villa1.jpg'],
      isActive: true,
    }
  });

  // Weekday and Weekend pricing rules
  await prisma.pricingRule.createMany({
    data: [
      { villaId: villa.id, type: 'WEEKDAY', price: 10000 },
      { villaId: villa.id, type: 'WEEKEND', price: 15000 }
    ],
    skipDuplicates: true,
  });

  // Services
  await prisma.serviceDef.createMany({
    data: [
      { id: 'svc-1', name: 'Daily Housekeeping', description: 'Fresh linens and cleaning', category: 'CLEANING', type: 'COMPLIMENTARY', chargeType: 'PER_BOOKING', price: 0, taxable: false, isActive: true },
      { id: 'svc-2', name: 'Private Chef', description: 'Custom meals cooked at villa', category: 'FOOD', type: 'PAID', chargeType: 'PER_DAY', price: 2500, taxable: true, isActive: true },
      { id: 'svc-3', name: 'BBQ Setup', description: 'Equipment and coal', category: 'ACTIVITY', type: 'PAID', chargeType: 'PER_BOOKING', price: 1500, taxable: true, isActive: true },
      { id: 'svc-4', name: 'Extra Guest Bed', description: 'Floor mattress', category: 'COMFORT', type: 'PAID', chargeType: 'PER_GUEST', price: 1000, taxable: true, isActive: true }
    ],
    skipDuplicates: true,
  });

  // Promo Code
  await prisma.promoCode.upsert({
    where: { code: 'MONSOON25' },
    update: {},
    create: {
      code: 'MONSOON25',
      description: 'Flat ₹2,500 off for the monsoon season!',
      type: 'FIXED',
      value: 2500,
      minBookingAmt: 10000,
      status: 'ACTIVE'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
