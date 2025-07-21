// src/modules/invoice/invoice.subscriber.ts

import { NotificationService } from '@modules/notification/services/notification.service';
import { InventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { InvoiceService } from '@modules/invoice/services/invoice.service';
import { EventEmitter } from "events";
import { userRoleService } from '@modules/userRole/services/userRole.service';
import { CustomerService } from '@modules/crm/services/customer.service';
import { PaymentService } from '@modules/payments/services/payment.service';

export class InvoiceSubscriber {
  constructor(
    private eventBus: EventEmitter,
    private notificationService: NotificationService,
    private customerService: CustomerService,
    private paymentService: PaymentService,
    private inventoryFlowService: InventoryFlowService,
    private invoiceService: InvoiceService
  ) {}

  subscribe() {
    this.eventBus.on('invoice.issued', this.onInvoiceIssued);
    this.eventBus.on('invoice.paid', this.onInvoicePaid);
  }

  private onInvoiceIssued = async ({ invoice }) => {
    const customer = await this.customerService.getCustomerById(invoice.customerId);
    const roles = ['tenant_admin', 'store_manager', 'super_admin'];
    const emails = await userRoleService.getUserEmailsByRoleNames(roles, invoice.tenantId);
    for(const email of emails) {
    await this.notificationService.sendEmail({
        to: email,
      template: 'invoiceTemplate',
      subject: 'invoiceIssued',
      variables: {
        invoiceId: invoice.id,
        customerName: customer.name,
        amount: invoice.total,
        issuedAt: invoice.issuedAt,
      },
    });
    }
  };

  private onInvoicePaid = async ({ invoiceId, paymentId }) => {
    const invoice = await this.invoiceService.getInvoiceWithPaymentStatus(invoiceId);
    const roles = ['tenant_admin', 'store_manager', 'super_admin'];
    const emails = await userRoleService.getUserEmailsByRoleNames(roles, invoice.tenantId);
    for(const email of emails) {
    await this.notificationService.sendEmail({
        to: email,
      template: 'invoiceTemplate',
      subject: 'invoicePaid',
      variables: {
        invoiceId: invoice.id,
        amountPaid: invoice.amountPaid,
        status: invoice.status,
        paidAt: new Date().toISOString(),
      },
    });
  };
}
}
