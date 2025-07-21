import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

export async function renderTemplate(templateName: string, data: any): Promise<string> {
  const filePath = path.join(__dirname, `../templates/emails/${templateName}.hbs`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const compiledTemplate = handlebars.compile(fileContent);
  return compiledTemplate(data);
}
