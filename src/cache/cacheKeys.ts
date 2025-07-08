export const CacheKeys = {
  productList: (tenantId: string) => `products:list:${tenantId}`,
  productDetail: (tenantId: string, productId: string) => `products:detail:${tenantId}:${productId}`,
  productVariants: (tenantId: string, productId: string) => `products:variants:${tenantId}:${productId}`,
  categoryList: (tenantId: string) => `categories:list:${tenantId}`,
  categoryDetail: (tenantId: string, categoryId: string) => `categories:detail:${tenantId}:${categoryId}`,
  variantList: (productId: string) => `variants:list:${productId}`,
  variantDetail: (productId: string, variantId: string) => `variants:detail:${productId}:${variantId}`,
  
  stock: (
    tenantId: string,
    productId?: string,
    variantId?: string,
    storeId?: string,
    warehouseId?: string
    ) => `stock:${tenantId}:${productId}:${variantId}:${storeId}:${warehouseId}`,
    productCategories: (tenantId: string) => `products:categories:${tenantId}`,
  search: (searchQuery: string) => `search:${searchQuery}`,
};
