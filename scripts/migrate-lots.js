const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  const items = await prisma.inventoryItem.findMany({
    include: { lots: true }
  });

  console.log(`Checking ${items.length} inventory items...`);

  for (const item of items) {
    if (item.lots.length === 0 && Number(item.stockQuantity) > 0) {
      console.log(`Migrating item: ${item.name}`);
      await prisma.inventoryLot.create({
        data: {
          inventoryItemId: item.id,
          quantity: item.stockQuantity,
          initialQuantity: item.stockQuantity,
          pricePerUnit: item.pricePerUnit,
          source: 'initial_stock'
        }
      });
      console.log(`Created lot for ${item.name}`);
    }
  }
}

migrate()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
