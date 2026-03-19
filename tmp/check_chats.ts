import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBuggyChats() {
  try {
    const conversations = await prisma.chatConversation.findMany({
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    console.log("=== ALL CONVERSATIONS ===");
    conversations.forEach(c => {
      console.log(`ID: ${c.id} | User: ${c.user?.firstName} ${c.user?.lastName} | Status: ${c.status} | Last Msg: ${c.messages[0]?.content || 'None'}`);
    });
    
  } catch (err) {
    console.error("Error checking chats:", err);
    
    // Raw SQL fallback
    const raw: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM chat_conversations`);
    console.log("=== RAW CONVERSATIONS ===");
    console.log(raw);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuggyChats();
