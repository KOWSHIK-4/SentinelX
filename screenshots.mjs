import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = resolve(__dirname, 'screenshots');
const BASE_URL = 'https://sentinel-x-frontend-six.vercel.app';

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const pages = [
  { path: '/login',       file: 'login.png' },
  { path: '/dashboard',   file: 'dashboard.png' },
  { path: '/dashboard/incidents', file: 'incidents.png' },
  { path: '/dashboard/assets',    file: 'assets.png' },
  { path: '/dashboard/analytics', file: 'analytics.png' },
  { path: '/dashboard/notifications', file: 'notifications.png' },
  { path: '/dashboard/reports',   file: 'reports.png' },
  { path: '/dashboard/audit',     file: 'auditlogs.png' },
  { path: '/dashboard/team',      file: 'team.png' },
  { path: '/dashboard/settings',  file: 'settings.png' },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Capture login page
  console.log('Capturing login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('form', { timeout: 15000 });
  await sleep(1000);
  await page.screenshot({
    path: resolve(SCREENSHOTS_DIR, 'login.png'),
    fullPage: true,
  });
  console.log('  -> login.png saved');

  // 2. Log in
  console.log('Logging in...');
  await page.fill('#email', 'admin@sentinelx.io');
  await page.fill('#password', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await sleep(2000);

  // Ensure admin role is set so New Incident button appears
  await page.evaluate(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.roles = [{ name: 'Admin' }];
      localStorage.setItem('user', JSON.stringify(user));
    }
  });

  // 3. Capture each page
  for (const { path, file } of pages) {
    if (path === '/login') continue;
    console.log(`Capturing ${path}...`);
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);

    // Capture create-incident dialog on incidents page
    if (path === '/dashboard/incidents') {
      const newBtn = page.getByRole('button', { name: 'New Incident' });
      await newBtn.waitFor({ state: 'visible', timeout: 5000 });
      await newBtn.click();
      await sleep(1500);
      await page.screenshot({
        path: resolve(SCREENSHOTS_DIR, 'create-incident.png'),
        fullPage: true,
      });
      console.log('  -> create-incident.png saved');
      await page.keyboard.press('Escape');
      await sleep(500);
    }

    await page.screenshot({
      path: resolve(SCREENSHOTS_DIR, file),
      fullPage: true,
    });
    console.log(`  -> ${file} saved`);
  }

  await browser.close();
  console.log('\nAll screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
