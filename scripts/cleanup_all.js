const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Starting full cleanup...");

  // Get all users from Prisma
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in Prisma.`);

  for (const user of users) {
    console.log(`Deleting user ${user.email} (${user.id})...`);
    
    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error(`Error deleting ${user.email} from Supabase:`, authError.message);
    } else {
      console.log(`Deleted ${user.email} from Supabase.`);
    }
  }

  // Delete all data from Prisma in order to avoid FK issues
  // Note: Most relations have onDelete: Cascade in schema.prisma, 
  // but let's be thorough.
  
  console.log("Cleaning up all Prisma tables...");
  
  // The order matters if Cascade is not perfect
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.leaseContract.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryLot.deleteMany();
  await prisma.operationResource.deleteMany();
  await prisma.operationParcel.deleteMany();
  await prisma.agriculturalOperation.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.cropPlan.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.parcelGroup.deleteMany();
  await prisma.weatherPOI.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.vehicleMaintenance.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.season.deleteMany();
  
  // Finally users and organizations
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.supportConfig.deleteMany();

  console.log("Cleanup complete! Database is now empty.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
