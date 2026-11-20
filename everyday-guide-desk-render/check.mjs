import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.join(import.meta.dirname, 'public');
const routes = ['index.html','name-change/index.html','wedding-officiants/index.html','privacy/index.html','service-information/index.html'];
let links = 0;
for (const route of routes) {
  const html = await fs.readFile(path.join(root,route),'utf8');
  if (!html.includes('<h1>') || !html.includes('name="viewport"')) throw new Error(`Missing page basics: ${route}`);
  for (const match of html.matchAll(/href="(tel:[^"]+)"/g)) {
    if (match[1] !== 'tel:+15755776846') throw new Error(`Unexpected phone in ${route}`);
    links++;
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const resource = match[1].endsWith('/') ? match[1] + 'index.html' : match[1];
    await fs.access(path.join(root, resource));
  }
  if (/<form\b|http-equiv="refresh"|window\.location\s*=/.test(html)) throw new Error(`Unexpected form or redirect in ${route}`);
  if (!html.includes('independent information service')) throw new Error(`Missing independent identity in ${route}`);
}
await fs.access(path.join(root,'assets/site.js'));
await fs.access(path.join(root,'assets/site.css'));
console.log(JSON.stringify({pages:routes.length,telephoneLinks:links,status:'passed'}));
