import { chromium } from '@playwright/test';
import fs from 'fs';

async function discoverPage(url: string) {
  console.log(`🔍 Starting GUI Discovery on: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
  } catch (err: any) {
    console.error(`❌ Failed to navigate to ${url}:`, err.message);
    await browser.close();
    process.exit(1);
  }

  const title = await page.title();
  
  // Extract all interactive elements
  const elements = await page.evaluate(`(() => {
    const getSelector = (el) => {
      if (el.id) return '#' + el.id;
      if (el.getAttribute('data-testid')) return '[data-testid="' + el.getAttribute('data-testid') + '"]';
      if (el.className && typeof el.className === 'string') return '.' + el.className.split(' ').join('.');
      return el.tagName.toLowerCase();
    };

    const interactableNodes = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"]');
    
    return Array.from(interactableNodes).map((node) => ({
      tagName: node.tagName,
      text: node.innerText || node.value || node.placeholder || '',
      name: node.name || '',
      type: node.type || '',
      role: node.getAttribute('role') || '',
      testid: node.getAttribute('data-testid') || '',
      label: node.getAttribute('aria-label') || '',
      selector: getSelector(node)
    })).filter(n => n.text || n.name || n.label || n.testid);
  })()`);

  console.log(`\n📄 PAGE: ${url}`);
  console.log(`TITLE: ${title}\n`);

  for (const el of elements) {
    console.log(`${el.tagName} ${el.role ? `(role="${el.role}")` : ''}`);
    if (el.text) console.log(`text="${el.text.trim().substring(0, 50)}"`);
    if (el.name) console.log(`name="${el.name}"`);
    if (el.label) console.log(`label="${el.label}"`);
    if (el.testid) console.log(`testid="${el.testid}"`);
    if (el.type) console.log(`type="${el.type}"`);
    console.log(`selector="${el.selector}"\n`);
  }

  const output = {
    url,
    title,
    elements
  };

  fs.writeFileSync('gui-discovery.json', JSON.stringify(output, null, 2));
  console.log(`✅ Discovery complete. Saved to gui-discovery.json`);
  
  await browser.close();
}

const targetUrl = process.argv[2] || 'http://localhost:3002';
discoverPage(targetUrl);
