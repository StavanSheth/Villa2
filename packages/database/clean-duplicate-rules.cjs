const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicateRules() {
  const rules = await prisma.pricingRule.findMany({
    orderBy: { type: 'asc' }
  });

  const seen = new Set();
  const toDelete = [];

  for (const rule of rules) {
    const key = `${rule.villaId}-${rule.type}-${rule.startDate}-${rule.endDate}-${rule.price}`;
    if (seen.has(key)) {
      toDelete.push(rule.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    await prisma.pricingRule.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log(`Deleted ${toDelete.length} duplicate pricing rules.`);
  } else {
    console.log('No duplicates found.');
  }
}

cleanDuplicateRules().finally(() => prisma.$disconnect());
