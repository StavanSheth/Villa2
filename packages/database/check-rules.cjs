const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPricingRules() {
  const rules = await prisma.pricingRule.findMany({
    orderBy: { type: 'asc' }
  });
  console.log(`Total rules: ${rules.length}`);
  console.log(JSON.stringify(rules, null, 2));
}

checkPricingRules().finally(() => prisma.$disconnect());
