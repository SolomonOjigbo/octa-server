
// src/modules/notification/templates/index.ts
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import { templateConfig } from './templateConfig';

const TEMPLATES_DIR = path.resolve(__dirname, 'emails');

export const templates: Record<string, HandlebarsTemplateDelegate> = {};

export async function loadTemplates() {
  const templateNames = Object.keys(templateConfig);
  
  for (const name of templateNames) {
    const filePath = path.join(TEMPLATES_DIR, `${name}.hbs`);
    const source = await fs.readFile(filePath, 'utf-8');
    templates[name] = handlebars.compile(source);
  }
}

// Register custom helpers
handlebars.registerHelper('formatCurrency', (value) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(value);
});









// // src/modules/notification/templates/index.ts
// import fs from 'fs';
// import path from 'path';
// import Handlebars from 'handlebars';

// Handlebars.registerHelper('multiply', function (a, b) {
//   return (a * b).toFixed(2);
// });

// const loadTemplate = (name: string) => {
//   const file = path.join(__dirname, `${name}.hbs`);
//   const source = fs.readFileSync(file, 'utf8');
//   return Handlebars.compile(source);
// };

// export const templates: Record<string, Handlebars.TemplateDelegate> = {
//   purchaseOrderCreated: loadTemplate('purchaseOrderCreated'),
//   invoiceIssued:        loadTemplate('invoiceIssued'),
//   lowStockAlert:        loadTemplate('lowStockAlert'),
//   receiptIssued: loadTemplate('receiptIssued'),
//   // …more as you add…
// };
