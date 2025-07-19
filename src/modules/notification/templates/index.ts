// src/modules/notification/templates/index.ts
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

Handlebars.registerHelper('multiply', function (a, b) {
  return (a * b).toFixed(2);
});

const loadTemplate = (name: string) => {
  const file = path.join(__dirname, `${name}.hbs`);
  const source = fs.readFileSync(file, 'utf8');
  return Handlebars.compile(source);
};

export const templates: Record<string, Handlebars.TemplateDelegate> = {
  purchaseOrderCreated: loadTemplate('purchaseOrderCreated'),
  invoiceIssued:        loadTemplate('invoiceIssued'),
  lowStockAlert:        loadTemplate('lowStockAlert'),
  receiptIssued: loadTemplate('receiptIssued'),
  // …more as you add…
};
