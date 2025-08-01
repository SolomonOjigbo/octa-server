/*
  Warnings:

  - You are about to drop the `_InvoicePayments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PaymentToPurchaseOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PaymentToTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TenantProductToSupplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TransactionToTransactionItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InvoicePayments" DROP CONSTRAINT "_InvoicePayments_A_fkey";

-- DropForeignKey
ALTER TABLE "_InvoicePayments" DROP CONSTRAINT "_InvoicePayments_B_fkey";

-- DropForeignKey
ALTER TABLE "_PaymentToPurchaseOrder" DROP CONSTRAINT "_PaymentToPurchaseOrder_A_fkey";

-- DropForeignKey
ALTER TABLE "_PaymentToPurchaseOrder" DROP CONSTRAINT "_PaymentToPurchaseOrder_B_fkey";

-- DropForeignKey
ALTER TABLE "_PaymentToTransaction" DROP CONSTRAINT "_PaymentToTransaction_A_fkey";

-- DropForeignKey
ALTER TABLE "_PaymentToTransaction" DROP CONSTRAINT "_PaymentToTransaction_B_fkey";

-- DropForeignKey
ALTER TABLE "_TenantProductToSupplier" DROP CONSTRAINT "_TenantProductToSupplier_A_fkey";

-- DropForeignKey
ALTER TABLE "_TenantProductToSupplier" DROP CONSTRAINT "_TenantProductToSupplier_B_fkey";

-- DropForeignKey
ALTER TABLE "_TransactionToTransactionItem" DROP CONSTRAINT "_TransactionToTransactionItem_A_fkey";

-- DropForeignKey
ALTER TABLE "_TransactionToTransactionItem" DROP CONSTRAINT "_TransactionToTransactionItem_B_fkey";

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "paymentStatus" "PaymentStatus";

-- DropTable
DROP TABLE "_InvoicePayments";

-- DropTable
DROP TABLE "_PaymentToPurchaseOrder";

-- DropTable
DROP TABLE "_PaymentToTransaction";

-- DropTable
DROP TABLE "_TenantProductToSupplier";

-- DropTable
DROP TABLE "_TransactionToTransactionItem";
