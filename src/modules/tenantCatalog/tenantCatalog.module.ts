import tenantProductRoutes from "./routes/tenantProduct.routes";
import tenantCategoryRoutes from "./routes/tenantCategory.routes";
import tenantVariantRoutes from "./routes/tenantVariant.routes";

export {
    tenantCategoryRoutes,
    tenantVariantRoutes,  // �� add this line to import tenantVariantRoutes module as well.
}

export default tenantProductRoutes;