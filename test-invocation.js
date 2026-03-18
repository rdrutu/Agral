
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
       console.error("No organization found");
       return;
    }
    
    const parcel = await prisma.parcel.findFirst({ where: { orgId: org.id } });
    if (!parcel) {
       console.error("No parcel found");
       return;
    }

    console.log("Testing create with orgId:", org.id);
    
    await prisma.$transaction(async (tx) => {
      const operation = await (tx).agriculturalOperation.create({
        data: {
          orgId: org.id,
          name: "Test Lucrare",
          type: "recoltat",
          date: new Date(),
          notes: "Test notes",
          totalAreaHa: 10.5,
          status: "completed",
          yieldPerHa: 5.5,
          totalYield: 57.75,
          parcels: {
            create: [
              {
                parcelId: parcel.id,
                operatedAreaHa: 10.5
              }
            ]
          },
          resources: {
            create: []
          }
        }
      });
      console.log("Success!", operation.id);
    });
  } catch (err) {
    console.error("DETAILED ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
