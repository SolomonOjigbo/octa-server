// src/modules/globalCatalog/globalCatalog.subscriber.ts

import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import { auditService } from "@modules/audit/services/audit.service";
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { notificationService } from "@modules/notification/services/notification.service";
import {logger} from "@logging/logger";
import { userRoleService } from "@modules/userRole/services/userRole.service";



// GLOBAL CATALOG CREATED
eventBus.on(EVENTS.GLOBAL_PRODUCT_CREATED, async (payload: {
  tenantId: string;
  catalogId: string;
  name: string;
  createdBy: string;
  recipients: string[];      // emails to notify
}) => {
  try {
    // 1. Audit
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.createdBy,
      module: "global_catalog",
      action: "create",
      entityId: payload.catalogId,
      details: { name: payload.name },
    });

    // 2. Cache invalidation
    await cacheService.del(CacheKeys.globalProductList(payload.tenantId));

    const emails = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    // 3. Notification emails
    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `New Global Catalog Created: ${payload.name}`,
        template: "globalCatalogCreated",
        variables: { name: payload.name, id: payload.catalogId },
      });
    }

    logger.info(`Handled GLOBAL_CATALOG_CREATED for ${payload.catalogId}`);
  } catch (err) {
    logger.error("Error in GLOBAL_CATALOG_CREATED subscriber", err);
  }
});

// GLOBAL CATALOG UPDATED
eventBus.on(EVENTS.GLOBAL_PRODUCT_UPDATED, async (payload: {
  tenantId: string;
  catalogId: string;
  updatedBy: string;
  changes: any;
  recipients: string[];
}) => {
  try {
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.updatedBy,
      module: "global_catalog",
      action: "update",
      entityId: payload.catalogId,
      details: payload.changes,
    });

    await cacheService.del(CacheKeys.globalProductList(payload.tenantId));
    await cacheService.del(CacheKeys.globalProductDetail(payload.tenantId, payload.catalogId));


    const emails = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    // 3. Notification emails
   

    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Global Catalog Updated: ${payload.catalogId}`,
        template: "globalCatalogUpdated",
        variables: { id: payload.catalogId, changes: payload.changes },
      });
    }

    logger.info(`Handled GLOBAL_CATALOG_UPDATED for ${payload.catalogId}`);
  } catch (err) {
    logger.error("Error in GLOBAL_CATALOG_UPDATED subscriber", err);
  }
});

// GLOBAL CATALOG DELETED
eventBus.on(EVENTS.GLOBAL_PRODUCT_DELETED, async (payload: {
  tenantId: string;
  catalogId: string;
  deletedBy: string;
  name: string;
  recipients: string[];
}) => {
  try {
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.deletedBy,
      module: "global_catalog",
      action: "delete",
      entityId: payload.catalogId,
    });

    await cacheService.del(CacheKeys.globalProductList(payload.tenantId));
    await cacheService.del(CacheKeys.globalProductDetail(payload.tenantId, payload.catalogId));


    const emails = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );


    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `Global Catalog Deleted: ${payload.name}`,
        template: "globalCatalogDeleted",
        variables: { name: payload.name, id: payload.catalogId },
      });
    }

    logger.info(`Handled GLOBAL_CATALOG_DELETED for ${payload.catalogId}`);
  } catch (err) {
    logger.error("Error in GLOBAL_CATALOG_DELETED subscriber", err);
  }
});



/** ──────────────── GLOBAL CATEGORY ──────────────── **/

eventBus.on(EVENTS.GLOBAL_CATEGORY_CREATED, async (payload: {
  tenantId: string;
  categoryId: string;
  name: string;
  actorId: string;
}) => {
  try {
    // 1. Notification emails
    const emails = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    for (const to of emails) {
      await notificationService.sendEmail({
        to,
        subject: `New Global Category: ${payload.name}`,
        template: "globalCategoryCreated",
        variables: { id: payload.categoryId, name: payload.name },
      });
    }

    // 2. Audit that notification was sent
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.actorId,
      module: "global_category",
      action: "notify:create",
      entityId: payload.categoryId,
      details: { emails },
    });

    // 3. Cache invalidation
    await cacheService.del(CacheKeys.globalCategoryList());

    logger.info(`GLOBAL_CATEGORY_CREATED handled: notified ${emails.length} admins`);
  } catch (err: any) {
    logger.error("Error handling GLOBAL_CATEGORY_CREATED", err);
  }
});

eventBus.on(EVENTS.GLOBAL_CATEGORY_UPDATED, async (payload: {
  tenantId: string;
  categoryId: string;
  changes: any;
  actorId: string;
}) => {
  try {
  const recipients = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    for (const to of recipients) {
      await notificationService.sendEmail({
        to,
        subject: `Global Category Updated: ${payload.categoryId}`,
        template: "globalCategoryUpdated",
        variables: { id: payload.categoryId, changes: payload.changes },
      });
    }
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.actorId,
      module: "global_category",
      action: "notify:update",
      entityId: payload.categoryId,
      details: { changes: payload.changes, recipients },
    });
    await Promise.all([
      cacheService.del(CacheKeys.globalCategoryList()),
      cacheService.del(CacheKeys.globalCategoryDetail(payload.categoryId))
    ]);
    logger.info(`GLOBAL_CATEGORY_UPDATED handled for ${payload.categoryId}`);
  } catch (err: any) {
    logger.error("Error handling GLOBAL_CATEGORY_UPDATED", err);
  }
});

eventBus.on(EVENTS.GLOBAL_CATEGORY_DELETED, async (payload: {
  tenantId: string;
  categoryId: string;
  actorId: string;
}) => {
  try {
    const recipients = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    for (const to of recipients) {
      await notificationService.sendEmail({
        to,
        subject: `Global Category Deleted`,
        template: "globalCategoryDeleted",
        variables: { id: payload.categoryId },
      });
    }
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.actorId,
      module: "global_category",
      action: "notify:delete",
      entityId: payload.categoryId,
      details: { recipients },
    });
    await Promise.all([
      cacheService.del(CacheKeys.globalCategoryList()),
      cacheService.del(CacheKeys.globalCategoryDetail(payload.categoryId))
    ]);
    logger.info(`GLOBAL_CATEGORY_DELETED handled for ${payload.categoryId}`);
  } catch (err: any) {
    logger.error("Error handling GLOBAL_CATEGORY_DELETED", err);
  }
});

/** ──────────────── GLOBAL VARIANT ──────────────── **/

eventBus.on(EVENTS.GLOBAL_VARIANT_CREATED, async (payload: {
  tenantId: string;
  globalProductId: string;
  globalVariantId: string;
  actorId: string;
}) => {
  try {
    const recipients = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    for (const to of recipients) {
      await notificationService.sendEmail({
        to,
        subject: `New Variant Added to Product ${payload.globalProductId}`,
        template: "globalVariantCreated",
        variables: { variantId: payload.globalVariantId, productId: payload.globalProductId },
      });
    }
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.actorId,
      module: "global_variant",
      action: "notify:create",
      entityId: payload.globalVariantId,
      details: { productId: payload.globalProductId, recipients },
    });
    await cacheService.del(CacheKeys.globalVariantList(payload.globalProductId));
    logger.info(`GLOBAL_VARIANT_CREATED for ${payload.globalVariantId}`);
  } catch (err: any) {
    logger.error("Error handling GLOBAL_VARIANT_CREATED", err);
  }
});

eventBus.on(EVENTS.GLOBAL_VARIANT_UPDATED, async (payload: {
  tenantId: string;
  globalProductId: string;
  globalVariantId: string;
  changes: any;
  actorId: string;
}) => {
  try {
    const recipients = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    for (const to of recipients) {
      await notificationService.sendEmail({
        to,
        subject: `Variant Updated: ${payload.globalVariantId}`,
        template: "globalVariantUpdated",
        variables: { id: payload.globalVariantId, changes: payload.changes },
      });
    }
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.actorId,
      module: "global_variant",
      action: "notify:update",
      entityId: payload.globalVariantId,
      details: { changes: payload.changes, recipients },
    });
    await Promise.all([
      cacheService.del(CacheKeys.globalVariantList(payload.globalProductId)),
      cacheService.del(CacheKeys.globalVariantDetail(payload.globalVariantId, payload.tenantId))
    ]);
    logger.info(`GLOBAL_VARIANT_UPDATED for ${payload.globalVariantId}`);
  } catch (err: any) {
    logger.error("Error handling GLOBAL_VARIANT_UPDATED", err);
  }
});

eventBus.on(EVENTS.GLOBAL_VARIANT_DELETED, async (payload: {
  tenantId: string;
  globalProductId: string;
  globalVariantId: string;
  actorId: string;
}) => {
  try {
    const recipients = await userRoleService.getUserEmailsByRoleName(
      "super_admin",
      payload.tenantId
    );

    for (const to of recipients) {
      await notificationService.sendEmail({
        to,
        subject: `Variant Removed: ${payload.globalVariantId}`,
        template: "globalVariantDeleted",
        variables: { id: payload.globalVariantId },
      });
    }
    await auditService.log({
      tenantId: payload.tenantId,
      userId: payload.actorId,
      module: "global_variant",
      action: "notify:delete",
      entityId: payload.globalVariantId,
      details: { recipients },
    });
    await Promise.all([
      cacheService.del(CacheKeys.globalVariantList(payload.globalProductId)),
      cacheService.del(CacheKeys.globalVariantDetail(payload.globalVariantId, payload.tenantId))
    ]);
    logger.info(`GLOBAL_VARIANT_DELETED for ${payload.globalVariantId}`);
  } catch (err: any) {
    logger.error("Error handling GLOBAL_VARIANT_DELETED", err);
  }
});

logger.info("✅ GlobalCatalog subscriber initialized with Category & Variant handlers.");
