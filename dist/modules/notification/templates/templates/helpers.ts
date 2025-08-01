import handlebars from 'handlebars';

handlebars.registerHelper('formatCurrency', (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(value);
});

handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

handlebars.registerHelper('multiply', (a: number, b: number) => {
  return a * b;
});