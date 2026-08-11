// Capture the "Báo cáo công việc" (daily reports) feature screens:
// 1. The "Báo cáo" button on a project Backlog
// 2. The dialog opened by that button
// 3. The dedicated /daily-reports page
// Reuses the same headless login as capture-screens.mjs.
import { chromium } from 'playwright';
import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'https://kazuotask.allbase.in';
const USER = process.env.KAZUO_USER;
const PASS = process.env.KAZUO_PASS;
const SHOTS_DIR = path.join(process.cwd(), 'shots');

// Product Team dept holds the TLM stories (from MCP).
const DEPT_ID = 'b16fe243-93b0-4757-91c8-041ff490a88d';

if (!USER || !PASS) {
  console.error('Missing KAZUO_USER / KAZUO_PASS in .env');
  process.exit(1);
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.waitForSelector('input[type="password"]', { state: 'attached', timeout: 30000 });
  await page.getByPlaceholder(/admin/i).fill(USER);
  await page.getByPlaceholder(/mật khẩu/i).fill(PASS);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 30000 });
  await page.waitForTimeout(2000);
}

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('→ Logging in...');
  await login(page);
  const projectId = new URL(page.url()).pathname.split('/p/')[1];
  console.log('✓ Logged in. projectId:', projectId);

  // 1. Backlog with the "Báo cáo" button visible
  const backlogUrl = `${BASE_URL}/w/kazuo/p/${projectId}/backlog?dept=${DEPT_ID}`;
  await page.goto(backlogUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'daily-report-1-backlog-button.png'), fullPage: true });
  console.log('✓ 1. Backlog + nút Báo cáo');

  // 2. Click the "Báo cáo" button → capture whatever it opens (dialog or page)
  try {
    await page.getByRole('button', { name: 'Báo cáo', exact: true }).first().click({ timeout: 10000 });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(SHOTS_DIR, 'daily-report-2-dialog.png'), fullPage: true });
    console.log('✓ 2. Sau khi bấm nút Báo cáo ->', page.url());
  } catch (err) {
    console.warn('✗ 2. Không bấm được nút Báo cáo:', err.message);
  }

  // 3. The dedicated daily-reports page
  await page.goto(`${BASE_URL}/w/kazuo/daily-reports`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'daily-report-3-page.png'), fullPage: true });
  console.log('✓ 3. Trang /daily-reports');

  await browser.close();
  console.log('\nDone. 3 ảnh trong shots/ (daily-report-1/2/3).');
}

main().catch((err) => { console.error(err); process.exit(1); });
