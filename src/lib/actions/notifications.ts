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
        id, title, message, type, 
        is_read as "isRead", 
        link, 
        created_at as "createdAt", 
        user_id as "userId", 
        org_id as "orgId", 
        target_role as "targetRole"
      FROM notifications
      WHERE 
        user_id = ${user.id}::uuid
        OR (org_id = ${user.orgId}::uuid AND target_role IS NULL)
        OR (org_id = ${user.orgId}::uuid AND target_role = ${user.role})
        OR (target_role = ${user.role} AND org_id IS NULL)
      ORDER BY created_at DESC
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
      UPDATE notifications
      SET is_read = true
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
      UPDATE notifications
      SET is_read = true
      WHERE 
        (user_id = ${user.id}::uuid
        OR (org_id = ${user.orgId}::uuid AND target_role = ${user.role})
        OR (org_id = ${user.orgId}::uuid AND target_role IS NULL)
        OR (target_role = ${user.role} AND org_id IS NULL))
        AND is_read = false
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
      INSERT INTO notifications (
        id, user_id, org_id, target_role, title, message, type, link, is_read, created_at
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

    // Executăm interogările complexe în paralel
    const [orgs, vehicles, contracts, lots] = await Promise.all([
      // 1. Abonament Organizație
      prisma.$queryRaw<any[]>`
        SELECT id, name, "subscription_expires_at" as "expiryDate"
        FROM organizations
        WHERE id = ${orgId}::uuid AND "subscription_expires_at" <= ${thirtyDaysFromNow}
      `,
      // 2. Vehicule (RCA, ITP, Casco, Rovinieta)
      prisma.$queryRaw<any[]>`
        SELECT id, name, "rca_expiry", "itp_expiry", "casco_expiry", "rovinieta_expiry"
        FROM vehicles
        WHERE org_id = ${orgId}::uuid
        AND (
          "rca_expiry" <= ${thirtyDaysFromNow} OR 
          "itp_expiry" <= ${thirtyDaysFromNow} OR 
          "casco_expiry" <= ${thirtyDaysFromNow} OR 
          "rovinieta_expiry" <= ${thirtyDaysFromNow}
        )
      `,
      // 3. Contracte Arendă
      prisma.$queryRaw<any[]>`
        SELECT id, "landowner_name", "end_date" as "expiryDate"
        FROM lease_contracts
        WHERE org_id = ${orgId}::uuid AND "end_date" <= ${thirtyDaysFromNow}
      `,
      // 4. Produse (Inventory Lots)
      prisma.$queryRaw<any[]>`
        SELECT il.id, i.name, il."expiry_date" as "expiryDate"
        FROM inventory_lots il
        JOIN inventory_items i ON il.inventory_item_id = i.id
        WHERE i.org_id = ${orgId}::uuid AND il."expiry_date" <= ${thirtyDaysFromNow}
      `
    ]);

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
