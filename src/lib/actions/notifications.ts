"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./profile";
import crypto from "node:crypto";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  // Folosim SQL brut pentru a ocoli blocajele de generare Prisma pe Windows
  try {
    const notifications = await prisma.$queryRaw<any[]>`
      SELECT 
        id, title, message, type, "isRead", link, "createdAt", "userId", "orgId", "targetRole"
      FROM "Notification"
      WHERE 
        "userId" = ${user.id}::uuid
        OR ("orgId" = ${user.orgId}::uuid AND "targetRole" IS NULL)
        OR ("orgId" = ${user.orgId}::uuid AND "targetRole" = ${user.role})
        OR ("targetRole" = ${user.role} AND "orgId" IS NULL)
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;
    return JSON.parse(JSON.stringify(notifications));
  } catch (err) {
    console.error("Eroare getNotifications (SQL):", err);
    return [];
  }
}

export async function markNotificationAsRead(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautorizat");

  try {
    await prisma.$executeRaw`
      UPDATE "Notification"
      SET "isRead" = true
      WHERE id = ${id}::uuid
    `;
    revalidatePath("/");
  } catch (err) {
    console.error("Eroare markNotificationAsRead (SQL):", err);
  }
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Neautorizat");

  try {
    await prisma.$executeRaw`
      UPDATE "Notification"
      SET "isRead" = true
      WHERE 
        ("userId" = ${user.id}::uuid
        OR ("orgId" = ${user.orgId}::uuid AND "targetRole" = ${user.role})
        OR ("orgId" = ${user.orgId}::uuid AND "targetRole" IS NULL)
        OR ("targetRole" = ${user.role} AND "orgId" IS NULL))
        AND "isRead" = false
    `;
    revalidatePath("/");
  } catch (err) {
    console.error("Eroare markAllNotificationsAsRead (SQL):", err);
  }
}

export async function createNotification(data: {
  userId?: string;
  orgId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Notification" (
        id, "userId", "orgId", "targetRole", title, message, type, link, "isRead", "createdAt", "updatedAt"
      ) VALUES (
        ${id}::uuid, 
        ${data.userId || null}::uuid, 
        ${data.orgId || null}::uuid, 
        ${data.targetRole || null}, 
        ${data.title}, 
        ${data.message}, 
        ${data.type || "info"}, 
        ${data.link || null}, 
        false, 
        NOW(), 
        NOW()
      )
    `;
    return { id };
  } catch (err) {
    console.error("Eroare createNotification (SQL):", err);
    return null;
  }
}
export async function getSystemAlerts() {
  const user = await getCurrentUser();
  if (!user || !user.orgId) return [];

  const orgId = user.orgId;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const alerts: any[] = [];

    // 1. Abonament Organizație
    const orgs = await prisma.$queryRaw<any[]>`
      SELECT id, name, "subscription_expires_at" as "expiryDate"
      FROM organizations
      WHERE id = ${orgId}::uuid AND "subscription_expires_at" <= ${thirtyDaysFromNow}
    `;
    orgs.forEach(o => {
      alerts.push({
        id: `org-sub-${o.id}`,
        title: "Abonament expiră",
        message: `Abonamentul pentru ${o.name} expiră pe ${new Date(o.expiryDate).toLocaleDateString('ro-RO')}`,
        type: "warning",
        expiryDate: o.expiryDate,
        link: "/setari"
      });
    });

    // 2. Vehicule (RCA, ITP, Casco, Rovinieta)
    const vehicles = await prisma.$queryRaw<any[]>`
      SELECT id, name, "rca_expiry", "itp_expiry", "casco_expiry", "rovinieta_expiry"
      FROM vehicles
      WHERE org_id = ${orgId}::uuid
      AND (
        "rca_expiry" <= ${thirtyDaysFromNow} OR 
        "itp_expiry" <= ${thirtyDaysFromNow} OR 
        "casco_expiry" <= ${thirtyDaysFromNow} OR 
        "rovinieta_expiry" <= ${thirtyDaysFromNow}
      )
    `;
    vehicles.forEach(v => {
      const checks = [
        { key: 'rca_expiry', label: 'RCA' },
        { key: 'itp_expiry', label: 'ITP' },
        { key: 'casco_expiry', label: 'Casco' },
        { key: 'rovinieta_expiry', label: 'Rovinieta' }
      ];
      checks.forEach(c => {
        if (v[c.key] && new Date(v[c.key]) <= thirtyDaysFromNow) {
          alerts.push({
            id: `veh-${c.label}-${v.id}`,
            title: `Expirare ${c.label}`,
            message: `${c.label} pentru ${v.name} expiră pe ${new Date(v[c.key]).toLocaleDateString('ro-RO')}`,
            type: "warning",
            expiryDate: v[c.key],
            link: "/utilaje"
          });
        }
      });
    });

    // 3. Contracte Arendă
    const contracts = await prisma.$queryRaw<any[]>`
      SELECT id, "landowner_name", "end_date" as "expiryDate"
      FROM lease_contracts
      WHERE org_id = ${orgId}::uuid AND "end_date" <= ${thirtyDaysFromNow}
    `;
    contracts.forEach(c => {
      alerts.push({
        id: `contract-${c.id}`,
        title: "Contract Arendă Expiră",
        message: `Contractul cu ${c.landowner_name} expiră pe ${new Date(c.expiryDate).toLocaleDateString('ro-RO')}`,
        type: "warning",
        expiryDate: c.expiryDate,
        link: "/contracte"
      });
    });

    // 4. Produse (Inventory Lots)
    const lots = await prisma.$queryRaw<any[]>`
      SELECT il.id, i.name, il."expiry_date" as "expiryDate"
      FROM inventory_lots il
      JOIN inventory_items i ON il.inventory_item_id = i.id
      WHERE i.org_id = ${orgId}::uuid AND il."expiry_date" <= ${thirtyDaysFromNow}
    `;
    lots.forEach(l => {
      alerts.push({
        id: `lot-expiry-${l.id}`,
        title: "Produs expiră",
        message: `Lotul de ${l.name} expiră pe ${new Date(l.expiryDate).toLocaleDateString('ro-RO')}`,
        type: "warning",
        expiryDate: l.expiryDate,
        link: "/stocuri"
      });
    });

    // Sortăm după data expirării (cele mai apropiate primele)
    return alerts.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  } catch (err) {
    console.error("Eroare getSystemAlerts:", err);
    return [];
  }
}
