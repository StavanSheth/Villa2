import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  path.join(__dirname, 'domains/bookings'),
  path.join(__dirname, 'domains/payments'),
  path.join(__dirname, 'domains/invoices')
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const original = content;
      // Replace import/export ... from "./something.js" or "../something.js"
      content = content.replace(/(from\s+['"]\.[^'"]+)\.js(['"])/g, '$1$2');
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    processDir(dir);
  }
}
