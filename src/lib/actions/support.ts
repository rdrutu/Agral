"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./profile";

// Helper to access Prisma models which might be missing from the client due to Windows file locks
const p = prisma as any;

export async function getSupportStatus() {
  try {
    let config: any = null;
    try {
      config = await p.supportConfig?.findFirst();
    } catch { /* Ignore */ }

    if (!config) {
      const raw = await prisma.$queryRaw<any[]>`SELECT * FROM support_configs LIMIT 1`.catch(() => []);
      config = raw[0];
    }

    const startHour = config?.startHour ?? 8;
    const endHour = config?.endHour ?? 20;
    const isActive = config?.isActive ?? true;

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Verificăm dacă există cel puțin un moderator activ (lastSeen în ultimele 30 de secunde)
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    let activeModerator = false;
    
    try {
      const mod = await p.user.findFirst({
        where: {
          role: { in: ["moderator", "superadmin"] },
          isSupportActive: true,
          lastSeen: { gte: thirtySecondsAgo }
        }
      });
      activeModerator = !!mod;
    } catch (e) {
      // Fallback la SQL brut dacă schema Prisma nu e sincronizată
      const rawActive = await prisma.$queryRaw<any[]>`
        SELECT id FROM users 
        WHERE role IN ('moderator', 'superadmin') 
        AND is_support_active = true
        AND last_seen >= NOW() - INTERVAL '30 seconds' 
        LIMIT 1
      `.catch(() => []);
      activeModerator = rawActive.length > 0;
    }

    const isWeekend = day === 0 || day === 6;
    const isWithinHours = !isWeekend && hour >= startHour && hour < endHour;
    const isOnline = isActive && (isWithinHours || activeModerator);
    
    return {
      isOnline,
      startHour,
      endHour,
      welcomeMsg: config?.welcomeMsg ?? "Salut, suntem aici să te ajutăm!"
    };
  } catch (err) {
    // Dacă pică Prisma (de obicei din cauza schemei neactualizate pe Windows), 
    // verificăm măcar dacă suntem în orele de program (8-20) fără sâmbătă/duminică.
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    const isWithinHours = !isWeekend && hour >= 8 && hour < 20;

    return {
      isOnline: isWithinHours,
      startHour: 8,
      endHour: 20,
      welcomeMsg: "Salut, suntem aici să te ajutăm!"
    };
  }
}

export async function startChat() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautorizat");

  if (!p.chatConversation) {
    throw new Error("Sistemul de chat nu este încă inițializat complet (Prisma Client out of sync). Te rugăm să contactezi administratorul.");
  }

  const existing = await p.chatConversation.findFirst({
    where: {
      userId: user.id,
      status: { in: ["WAITING", "ACTIVE"] }
    }
  });

  if (existing) return existing;

  const conversation = await p.chatConversation.create({
    data: {
      userId: user.id,
      status: "WAITING"
    }
  });

  await p.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      type: "SYSTEM",
      content: "Se caută un moderator disponibil..."
    }
  });

  revalidatePath("/setari");
  return conversation;
}

export async function sendMessage(conversationId: string, content: string, type: "USER" | "MODERATOR") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautorizat");

  if (!p.chatMessage) throw new Error("Client Prisma neactualizat.");

  const msg = await p.chatMessage.create({
    data: {
      conversationId,
      senderId: user.id,
      content,
      type
    }
  });

  await p.chatConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() }
  });

  revalidatePath("/setari");
  revalidatePath("/moderator");
  return msg;
}

export async function joinChat(conversationId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "moderator" && user.role !== "superadmin")) {
    throw new Error("Doar moderatorii pot prelua chat-uri");
  }

  if (!p.chatConversation) throw new Error("Client Prisma neactualizat.");

  const conversation = await p.chatConversation.update({
    where: { id: conversationId },
    data: {
      moderatorId: user.id,
      status: "ACTIVE"
    }
  });

  await p.chatMessage.create({
    data: {
      conversationId,
      senderId: user.id,
      type: "MODERATOR",
      content: `Salut, sunt ${user.firstName ?? "Moderatorul"} și am venit să te ajut!`
    }
  });

  revalidatePath("/setari");
  revalidatePath("/moderator");
  return conversation;
}

export async function closeConversation(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautorizat");

  if (!p.chatConversation) throw new Error("Client Prisma neactualizat.");

  const conversation = await p.chatConversation.update({
    where: { id: conversationId },
    data: {
      status: "CLOSED",
      closedAt: new Date()
    }
  });

  await p.chatMessage.create({
    data: {
      conversationId,
      senderId: user.id,
      type: "SYSTEM",
      content: "Această conversație a fost închisă."
    }
  });

  revalidatePath("/setari");
  revalidatePath("/moderator");
  return conversation;
}

export async function getActiveConversations() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "moderator" && user.role !== "superadmin")) return [];

  if (!p.chatConversation) return [];

  const convos = await p.chatConversation.findMany({
    where: { status: { in: ["WAITING", "ACTIVE"] } },
    include: {
      user: {
        include: { 
          organization: {
            include: {
              payments: {
                orderBy: { date: 'desc' },
                take: 3
              }
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { lastMessageAt: "desc" }
  });

  return JSON.parse(JSON.stringify(convos));
}

export async function getConversationMessages(conversationId: string) {
  if (!p.chatMessage) return [];

  const messages = await p.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: true
    }
  });

  return JSON.parse(JSON.stringify(messages));
}

export async function getConversationHistory() {
  const user = await getCurrentUser();
  if (!user) return [];

  if (!p.chatConversation) return [];

  const where = (user.role === "moderator" || user.role === "superadmin")
    ? { status: "CLOSED" } 
    : { userId: user.id };

  const history = await p.chatConversation.findMany({
    where,
    include: {
      user: {
        include: { 
          organization: {
            include: {
              payments: {
                orderBy: { date: 'desc' },
                take: 3
              }
            }
          }
        }
      },
      moderator: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return JSON.parse(JSON.stringify(history));
}

/**
 * Update the lastSeen timestamp for the current user.
 * Used as a heartbeat for moderators to show they are "online".
 */
export async function updateLastSeen() {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await p.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() }
    });
  } catch (e) {
    await prisma.$executeRawUnsafe(
      `UPDATE users SET last_seen = NOW() WHERE id = $1::uuid`,
      user.id
    );
  }
}

/**
 * Togli the manual support status for a moderator/admin.
 */
export async function toggleSupportStatus(active: boolean) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "moderator" && user.role !== "superadmin")) {
    throw new Error("Neautorizat");
  }

  try {
    await p.user.update({
      where: { id: user.id },
      data: { isSupportActive: active }
    });
  } catch (e) {
    // Fallback la SQL brut dacă schema Prisma nu e sincronizată în clientul JS
    await prisma.$executeRawUnsafe(
      `UPDATE users SET is_support_active = $1 WHERE id = $2::uuid`,
      active,
      user.id
    );
  }
  
  revalidatePath("/moderator");
  return { success: true, active };
}

export async function getModeratorStatus() {
  const user = await getCurrentUser();
  if (!user) return { active: false };

  try {
    const dbUser = await p.user.findUnique({
      where: { id: user.id },
      select: { isSupportActive: true }
    });
    return { active: !!dbUser?.isSupportActive };
  } catch (e) {
    // Fallback la SQL brut
    const raw: any[] = await prisma.$queryRawUnsafe(
      `SELECT is_support_active FROM users WHERE id = $1::uuid LIMIT 1`,
      user.id
    );
    return { active: !!raw[0]?.is_support_active };
  }
}
