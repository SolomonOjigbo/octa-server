// src/modules/tenantCatalog/tenantCatalog.subscriber.ts
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { notificationService } from "@modules/notification/services/notification.service";
import { roleService } from "@modules/role/services/role.service";
import { userRoleService } from "@modules/userRole/services/userRole.service";
import {logger} from "@logging/logger";

// Helper: fetch tenant catalog admins
async function getCatalogAdmins(name: string, context: any): Promise<string[]> {
   const {tenantId, storeId, warehouseId } = context;
  const role = await roleService.getRoleByName("tenant_admin", context);
  if (!role) return [];
  const assignments = await userRoleService.getRoleUsers(role.id);
  return assignments.map(a => a.user.email).filter(Boolean);
}

// Tenant Product events
eventBus.on(EVENTS.TENANT_PRODUCT_CREATED, async (payload) => {
//   const toList = await getCatalogAdmins(name, context);
    const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      payload.tenantId
    );
  for (const to of emails) {
    await notificationService.sendEmail({
      to,
      subject: `New Product Added`,
      template: "tenantProductCreated",
      variables: { id: payload.productId, name: payload.name },
    });
  }
  logger.info(`Notified admins of TENANT_PRODUCT_CREATED ${payload.tenantProductId}`);
});

eventBus.on(EVENTS.TENANT_PRODUCT_UPDATED, async (p) => {
//   const toList = await getCatalogAdmins(p.tenantId);
  const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      p.tenantId
    );
  for (const to of emails) {
    await notificationService.sendEmail({
      to,
      subject: `Product Updated`,
      template: "tenantProductUpdated",
      variables: { id: p.productId, changes: p.changes },
    });
  }
});

eventBus.on(EVENTS.TENANT_PRODUCT_DELETED, async (p) => {
//   const toList = await getCatalogAdmins(p.tenantId);
        // for (const to of toList) {
        // await notificationService.sendEmail({
        //     to,
        //     subject: `Product Removed`,
        //     template: "tenantProductDeleted",
        //     variables: { id: p.productId },
        // });
        // }
  const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      p.tenantId
    );
  for (const to of emails) {
    await notificationService.sendEmail({
      to,
      subject: `Product Removed`,
      template: "tenantProductDeleted",
      variables: { id: p.productId },
    });
  }
});

// Tenant Category events
eventBus.on(EVENTS.TENANT_CATEGORY_CREATED, async (c) => {
//   const toList = await getCatalogAdmins(c.tenantId);
//   for (const to of toList) {
//     await notificationService.sendEmail({
//       to,
//       subject: `Category Added`,
//       template: "tenantCategoryCreated",
//       variables: { id: c.categoryId, name: c.name },
//     });
//   }

  const emails = await userRoleService.getUserEmailsByRoleName(
      "tenant_admin",
      c.tenantId
    );
    for (const to of emails) {
        await notificationService.sendEmail({
            to,
            subject: `Category Added`,
            template: "tenantCategoryCreated",
            variables: { id: c.categoryId, name: c.name },
        });
    }
});

eventBus.on(EVENTS.TENANT_CATEGORY_UPDATED, async (c) => {
//   const toList = await getCatalogAdmins(c.tenantId);
//   for (const to of toList) {
//     await notificationService.sendEmail({
//       to,
//       subject: `Category Updated`,
//       template: "tenantCategoryUpdated",
//       variables: { id: c.categoryId, changes: c.changes },
//     });
//   }
    const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        c.tenantId
    );
    for (const to of emails) {
        await notificationService.sendEmail({
            to,
            subject: `Category Updated`,
            template: "tenantCategoryUpdated",
            variables: { id: c.categoryId, changes: c.changes }

        });
    }
});

eventBus.on(EVENTS.TENANT_CATEGORY_DELETED, async (c) => {
//   const toList = await getCatalogAdmins(c.tenantId);
const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        c.tenantId
    );
  for (const to of emails) {
    await notificationService.sendEmail({
      to,
      subject: `Category Removed`,
      template: "tenantCategoryDeleted",
      variables: { id: c.categoryId },
    });
  }
});

// Tenant Variant events
eventBus.on(EVENTS.TENANT_VARIANT_CREATED, async (v) => {
//   const toList = await getCatalogAdmins(v.tenantId);
const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        v.tenantId
    );
  for (const to of emails) {
    await notificationService.sendEmail({
      to,
      subject: `Variant Added`,
      template: "tenantVariantCreated",
      variables: { id: v.variantId },
    });
  }
});

eventBus.on(EVENTS.TENANT_VARIANT_UPDATED, async (v) => {
//   const toList = await getCatalogAdmins(v.tenantId);
        // for (const to of toList) {
        // await notificationService.sendEmail({
        //     to,
        //     subject: `Variant Updated`,
        //     template: "tenantVariantUpdated",
        //     variables: { id: v.variantId, changes: v.changes },
        // });
        // }
const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        v.tenantId
    );
  for (const to of emails) {
    await notificationService.sendEmail({
      to,
      subject: `Variant Updated`,
      template: "tenantVariantUpdated",
      variables: { id: v.variantId, changes: v.changes },
    });
  }
});

eventBus.on(EVENTS.TENANT_VARIANT_DELETED, async (v) => {
//   const toList = await getCatalogAdmins(v.tenantId);
//   for (const to of toList) {
//     await notificationService.sendEmail({
//       to,
//       subject: `Variant Removed`,
//       template: "tenantVariantDeleted",
//       variables: { id: v.variantId },
//     });
//   }

const emails = await userRoleService.getUserEmailsByRoleName(
        "tenant_admin",
        v.tenantId
    );
    for (const to of emails) {
        await notificationService.sendEmail({
            to,
            subject: `Tenant Variant Removed`,
            template: "tenantVariantDeleted",
            variables: { id: v.variantId, changes: v.changes }

        });
    }

});

logger.info("TenantCatalog subscriber initialized.");
