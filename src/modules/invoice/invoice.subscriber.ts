// src/modules/invoice/invoice.subscriber.ts
import { NotificationService } from '@modules/notification/services/notification.service';
import { InventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { InvoiceService } from '@modules/invoice/services/invoice.service';
import { EventEmitter } from "events";
import { userRoleService } from '@modules/userRole/services/userRole.service';
import { CustomerService } from '@modules/crm/services/customer.service';
import { PaymentService } from '@modules/payments/services/payment.service';
import { EVENTS } from '@events/events';
import { PaymentStatus } from './types/invoice.dto';
import { logger } from '@logging/logger';

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

   private subscribe() {
    this.eventBus.on(EVENTS.INVOICE_CREATED, this.onInvoiceCreated);
    this.eventBus.on(EVENTS.INVOICE_ISSUED, this.onInvoiceIssued);
    this.eventBus.on(EVENTS.INVOICE_PAYMENT_APPLIED, this.onInvoicePayment);
    this.eventBus.on(EVENTS.INVOICE_OVERDUE, this.onInvoiceOverdue);
    this.eventBus.on(EVENTS.INVOICE_PDF_GENERATED, this.onPdfGenerated);
  }

  private onInvoiceCreated = async ({ id, tenantId }: { id: string; tenantId: string }) => {
  try {
    const invoice = await this.invoiceService.getById(tenantId, id);
    
    // Only notify for draft invoices
    if (invoice.status === 'DRAFT') {
      const roles = ['tenantAdmin', 'storeManager'];
      const emails = await userRoleService.getUserEmailsByRoleNames(roles, tenantId);
      
      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'invoiceDraftCreated',
          subject: 'Draft Invoice Created',
          variables: {
            invoiceId: invoice.id,
            invoiceNo: invoice.invoiceNo || 'DRAFT',
            customerName: invoice.customerId || 'No Customer',
            totalAmount: invoice.totalAmount,
            createdBy: invoice.createdBy || 'System',
            createdAt: new Date(invoice.createdAt).toLocaleDateString()
          },
        });
      }
    }
  } catch (error) {
    console.error('Error handling invoice created event:', error);
    logger.log(error);
  }
};

  private onInvoiceIssued = async (invoice) => {
    try {
      const customer = invoice.customerId 
        ? await this.customerService.getCustomerById(invoice.customerId)
        : null;

      const roles = ['tenantAdmin', 'storeManager', 'superAdmin'];
      const emails = await userRoleService.getUserEmailsByRoleNames(roles, invoice.tenantId);
      
      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'invoiceIssued',
          subject: 'New Invoice Issued',
          variables: {
            invoiceId: invoice.id,
            invoiceNo: invoice.invoiceNo,
            dueDate: invoice.dueDate.toLocaleDateString(),
            total: invoice.totalAmount,
            customerName: customer?.name || 'Customer',
            amount: invoice.totalAmount,
            issuedAt: new Date().toISOString(),
            items: invoice.items.map(item => ({
            description: item.description,
            amount: item.amount
          })),
          },
        });
      }
    } catch (error) {
      console.error('Error handling invoice issued event:', error);
    }
  };

private onInvoicePayment = async (payload: { 
  tenantId: string;
  invoiceId: string; 
  paymentId: string;
  amount: number;
  paymentStatus: PaymentStatus;
}) => {
  try {
    const { tenantId, invoiceId, paymentId, amount, paymentStatus } = payload;
    const invoice = await this.invoiceService.getById(tenantId, invoiceId);
    const customer = invoice.customerId 
      ? await this.customerService.getCustomerById(invoice.customerId)
      : null;

    // Notify internal stakeholders
    const roles = ['tenantAdmin', 'storeManager'];
    const emails = await userRoleService.getUserEmailsByRoleNames(roles, tenantId);
    const paidSum = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    for (const email of emails) {
      await this.notificationService.sendEmail({
        to: email,
        template: 'invoicePayment',
        subject: `Invoice Payment Received - ${invoice.invoiceNo}`,
        variables: {
          invoiceNo: invoice.invoiceNo,
          customerName: customer?.name || 'Customer',
          amountPaid: amount,
          totalAmount: invoice.totalAmount,
          paymentStatus,
          balanceDue: invoice.totalAmount - (paidSum || 0),
          paidAt: new Date().toLocaleString()
        },
      });
    }

    // Notify customer if exists
    if (customer?.email) {
      await this.notificationService.sendEmail({
        to: customer.email,
        template: 'customerInvoicePayment',
        subject: `Payment Received for Invoice ${invoice.invoiceNo}`,
        variables: {
          invoiceNo: invoice.invoiceNo,
          amountPaid: amount,
          balanceDue: invoice.totalAmount - (paidSum || 0),
          // paymentMethod: payload.paymentMethod || 'Unknown', //To implement payment method later
          paidAt: new Date().toLocaleString()
        },
      });
    }

  } catch (error) {
    console.error('Error handling invoice payment event:', error);
    logger.log(error);
  }
};

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

  private onPdfGenerated = async (payload: { 
  invoiceId: string;
  tenantId: string;
  pdfBuffer: Buffer;
  pdfPath: string;
}) => {
  try {
    const { invoiceId, tenantId, pdfBuffer, pdfPath } = payload;
    const invoice = await this.invoiceService.getById(tenantId, invoiceId);
    const customer = invoice.customerId 
      ? await this.customerService.getCustomerById(invoice.customerId)
      : null;

    // Store PDF in cloud storage (To implement fileStorageService)
    // const storageUrl = await fileStorageService.uploadFile(
    //   `invoices/${tenantId}/${invoiceId}.pdf`,
    //   pdfBuffer
    // );

    // Update invoice with PDF URL
    // await this.invoiceService.update(tenantId, 'system', invoiceId, {
    //   metadata: {
    //     ...(invoice.metadata || {}),
    //     pdfUrl: storageUrl,
    //     pdfPath
    //   }
    // });

    // Send email with PDF attachment to customer
    if (customer?.email) {
      await this.notificationService.sendEmailWithAttachment({
        to: customer.email,
        subject: `Your Invoice ${invoice.invoiceNo}`,
        template: 'customerInvoiceIssued',
        variables: {
          invoiceNo: invoice.invoiceNo,
          issueDate: new Date(invoice.issueDate).toLocaleDateString(),
          dueDate: new Date(invoice.dueDate).toLocaleDateString(),
          totalAmount: invoice.totalAmount,
          paymentLink: `${process.env.APP_URL}/pay-invoice/${invoice.id}`
        },
        attachments: [{
          filename: `invoice-${invoice.invoiceNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });
    }
  } catch (error) {
    console.error('Error handling PDF generated event:', error);
    logger.log(error);
  }
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