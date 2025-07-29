// src/modules/invoice/invoice.subscriber.ts
import { NotificationService } from '@modules/notification/services/notification.service';
import { InventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { InvoiceService } from '@modules/invoice/services/invoice.service';
import { EventEmitter } from "events";
import { userRoleService } from '@modules/userRole/services/userRole.service';
import { CustomerService } from '@modules/crm/services/customer.service';
import { PaymentService } from '@modules/payments/services/payment.service';
import { EVENTS } from '@events/events';
import { InvoiceStatus } from './types/invoice.dto';

export class InvoiceSubscriber {
  constructor(
    private eventBus: EventEmitter,
    private notificationService: NotificationService,
    private customerService: CustomerService,
    private paymentService: PaymentService,
    private inventoryFlowService: InventoryFlowService,
    private invoiceService: InvoiceService
  ) {
    this.subscribe();
  }

  subscribe() {
    this.eventBus.on(EVENTS.INVOICE_CREATED, this.onInvoiceCreated);
    this.eventBus.on(EVENTS.INVOICE_ISSUED, this.onInvoiceIssued);
    // this.eventBus.on(EVENTS.INVOICE_PAYMENT_APPLIED, this.onInvoicePayment);
    this.eventBus.on(EVENTS.INVOICE_OVERDUE, this.onInvoiceOverdue);
    this.eventBus.on(EVENTS.INVOICE_PDF_GENERATED, this.onPdfGenerated);
  }

  private onInvoiceCreated = async ({ id }: { id: string }) => {
    console.log(`Invoice created: ${id}`);
    // Additional logic for draft invoices
  };

  private onInvoiceIssued = async (invoice: { id: string; tenantId: string; customerId?: string; totalAmount: number }) => {
    try {
      const customer = invoice.customerId 
        ? await this.customerService.getCustomerById(invoice.customerId)
        : null;

      const roles = ['TENANT_ADMIN', 'STORE_MANAGER', 'SUPER_ADMIN'];
      const emails = await userRoleService.getUserEmailsByRoleNames(roles, invoice.tenantId);
      
      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'invoiceIssued',
          subject: 'New Invoice Issued',
        //   variables: {
        //   invoiceNo: invoice.invoiceNo,
        //   customerName: customer?.name || 'Customer',
        //   dueDate: invoice.dueDate.toLocaleDateString(),
        //   items: invoice.items.map(item => ({
        //     description: item.description,
        //     amount: item.amount
        //   })),
        //   total: invoice.totalAmount
        // },
          variables: {
            invoiceId: invoice.id,
            customerName: customer?.name || 'Customer',
            amount: invoice.totalAmount,
            issuedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Error handling invoice issued event:', error);
    }
  };

  // private onInvoicePayment = async ({ 
  //   tenantId
  //   invoiceId, 
  //   paymentId,
  //   amount 
  // }: { 
  //   invoiceId: string; 
  //   paymentId: string;
  //   amount: number 
  // }) => {
  //   try {
  //     const invoice = await this.invoiceService.getById(tenantId, invoiceId);
  //     const roles = ['TENANT_ADMIN', 'FINANCE_MANAGER'];
  //     const emails = await userRoleService.getUserEmailsByRoleNames(roles, invoice.tenantId);

  //     for (const email of emails) {
  //       await this.notificationService.sendEmail({
  //         to: email,
  //         template: 'invoicePayment',
  //         subject: 'Invoice Payment Received',
  //         variables: {
  //           invoiceId: invoice.id,
  //           invoiceNo: invoice.invoiceNo,
  //           amountPaid: amount,
  //           totalAmount: invoice.totalAmount,
  //           paymentStatus: invoice.paymentStatus,
  //           paidAt: new Date().toISOString(),
  //         },
  //       });
  //     }

  //     // Update inventory if fully paid
  //     if (invoice.paymentStatus === 'PAID' && invoice.referenceType === 'PURCHASE_ORDER') {
  //       await this.inventoryFlowService.processInvoicePayment(invoiceId);
  //     }
  //   } catch (error) {
  //     console.error('Error handling invoice payment event:', error);
  //   }
  // };

  private onInvoiceOverdue = async (invoice: { id: string; tenantId: string; customerId?: string }) => {
    try {
      const customer = invoice.customerId 
        ? await this.customerService.getCustomerById(invoice.customerId)
        : null;

      const roles = ['ACCOUNTS_RECEIVABLE', 'TENANT_ADMIN'];
      const emails = await userRoleService.getUserEmailsByRoleNames(roles, invoice.tenantId);

      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'invoiceOverdue',
          subject: 'Invoice Overdue',
          variables: {
            invoiceId: invoice.id,
            customerName: customer?.name || 'Customer',
          },
        });
      }

      // Notify customer if exists
      if (customer?.email) {
        await this.notificationService.sendEmail({
          to: customer.email,
          template: 'customerInvoiceOverdue',
          subject: 'Your Invoice is Overdue',
          variables: {
            invoiceId: invoice.id,
          },
        });
      }
    } catch (error) {
      console.error('Error handling overdue invoice event:', error);
    }
  };

  private onPdfGenerated = async ({ invoiceId }: { invoiceId: string }) => {
    console.log(`PDF generated for invoice: ${invoiceId}`);
    // Additional PDF handling logic
  };
}

// Factory function for easier initialization
export const createInvoiceSubscriber = (
  eventBus: EventEmitter,
  services: {
    notificationService: NotificationService;
    customerService: CustomerService;
    paymentService: PaymentService;
    inventoryFlowService: InventoryFlowService;
    invoiceService: InvoiceService;
    userRoleService: typeof userRoleService;
  }
) => {
  return new InvoiceSubscriber(
    eventBus,
    services.notificationService,
    services.customerService,
    services.paymentService,
    services.inventoryFlowService,
    services.invoiceService
  );
};