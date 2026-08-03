// Capture screenshots of every main screen in Kazuo, then emit a metadata file
// the HTML gallery reads. Login is done headlessly with credentials from .env.
import { chromium } from 'playwright';
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'https://kazuotask.allbase.in';
const USER = process.env.KAZUO_USER;
const PASS = process.env.KAZUO_PASS;
const SHOTS_DIR = path.join(process.cwd(), 'shots');

if (!USER || !PASS) {
  console.error('Missing KAZUO_USER / KAZUO_PASS. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// Turn a label into a safe file slug (keeps ASCII letters/digits only).
const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'screen';

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // SPA renders the form after load; give it time then wait for input to attach.
  await page.waitForTimeout(4000);
  try {
    await page.waitForSelector('input[type="password"]', { state: 'attached', timeout: 30000 });
  } catch (err) {
    await page.screenshot({ path: path.join(SHOTS_DIR, '_login-fail.png'), fullPage: true });
    const n = await page.$$eval('input', els => els.length);
    throw new Error(`Login form not found (${n} inputs). Saved _login-fail.png. ${err.message}`);
  }
  await page.getByPlaceholder(/admin/i).fill(USER);
  await page.getByPlaceholder(/mật khẩu/i).fill(PASS);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  // Wait until the URL leaves /login (auth succeeded) instead of networkidle.
  await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 30000 })
    .catch(() => { throw new Error('Login failed — still on /login. Check credentials in .env.'); });
  await page.waitForTimeout(2000); // let the app shell render
}

// Discover navigable screens from the sidebar/nav links after login.
async function discoverScreens(page) {
  const links = await page.$$eval('a[href^="/"]', (els) =>
    els.map((e) => ({
      href: e.getAttribute('href'),
      label: (e.getAttribute('title') || e.textContent || '').trim(),
    })));
  const seen = new Set();
  const screens = [];
  for (const { href, label } of links) {
    if (!href || href.includes('/login') || href === '#') continue;
    const clean = href.split('?')[0].replace(/\/$/, '') || '/';
    if (seen.has(clean)) continue;
    seen.add(clean);
    screens.push({ path: clean, label: label || clean });
  }
  return screens;
}

async function capture(page, screen) {
  await page.goto(BASE_URL + screen.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500); // let async widgets settle (SPA never hits networkidle)
  const file = `${slugify(screen.label)}.png`;
  await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: true });
  console.log(`✓ ${screen.label} -> ${file}`);
  return { ...screen, file };
}

// Departments in the workspace (from MCP). Sprints live under one of them.
const DEPTS = [
  { id: 'b16fe243-93b0-4757-91c8-041ff490a88d', name: 'Product Team' },
  { id: 'd0075722-c169-440f-a01f-e1b8d73849ef', name: 'Vận Hành' },
  { id: '63a8ea3e-b131-41fb-a4e1-b1c6f7c030da', name: 'Marketing' },
];

// Project tabs map to real URL routes; navigating directly is more reliable
// than clicking tabs (clicking sometimes fails to load story data).
const PROJECT_TABS = [
  { name: 'Roadmap', slug: 'roadmap' },
  { name: 'Summary', slug: 'summary' },
  { name: 'Epic', slug: 'epic' },
  { name: 'Backlog', slug: 'backlog' },
  { name: 'Board', slug: 'board' },
  { name: 'List', slug: 'list' },
  { name: 'Archived', slug: 'archived' },
  { name: 'Sprint History', slug: 'sprint-history' },
];

const tabUrl = (projectId, deptId, slug) =>
  `${BASE_URL}/w/kazuo/p/${projectId}/${slug}?dept=${deptId}`;

// Find the department whose Backlog actually has stories (code like "TLM-123").
async function findDeptWithStories(page, projectId) {
  for (const dept of DEPTS) {
    await page.goto(tabUrl(projectId, dept.id, 'backlog'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    const hasStory = await page.getByText(/TLM-\d+/).count().catch(() => 0);
    if (hasStory) {
      console.log(`✓ Stories found in department: ${dept.name} (${hasStory} rows)`);
      return dept;
    }
  }
  console.warn('✗ No department with stories found; using landing department.');
  return null;
}

// Capture each project tab by navigating to its route under the chosen dept.
async function captureProjectTabs(page, projectId, dept) {
  const shots = [];
  const suffix = dept?.name ? ` (${dept.name})` : '';
  for (const tab of PROJECT_TABS) {
    try {
      await page.goto(tabUrl(projectId, dept.id, tab.slug), { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3500);
      const file = `project-${tab.slug}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: true });
      console.log(`✓ [Dự án] ${tab.name} -> ${file}`);
      shots.push({ path: `/${tab.slug}`, label: `Dự án · ${tab.name}${suffix}`, file });
    } catch (err) {
      console.warn(`✗ [Dự án] ${tab.name}: ${err.message}`);
    }
  }
  return shots;
}

// Open the first story from the Backlog and capture its detail panel.
async function captureStoryDetail(page, projectId, dept) {
  try {
    await page.goto(tabUrl(projectId, dept.id, 'backlog'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.getByText(/TLM-\d+/).first().click({ timeout: 10000 });
    await page.waitForTimeout(3500);
    const file = 'story-detail.png';
    await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: true });
    console.log(`✓ [Dự án] Chi tiết story -> ${file}`);
    return [{ path: '(story detail)', label: 'Dự án · Chi tiết Story', file }];
  } catch (err) {
    console.warn(`✗ Chi tiết story: ${err.message}`);
    return [];
  }
}

// Capture the personal "My Work" view (own tasks + teammates' load).
async function captureMyWork(page) {
  try {
    await page.goto(`${BASE_URL}/w/kazuo/my-work`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    const file = 'personal-my-work.png';
    await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: true });
    console.log(`✓ [Personal] My Work -> ${file}`);
    return [{ path: '/my-work', label: 'Personal · My Work', file }];
  } catch (err) {
    console.warn(`✗ My Work: ${err.message}`);
    return [];
  }
}

// Open the "Tạo Issue" dialog on the Backlog and capture the create form.
async function captureCreateDialog(page, projectId, dept) {
  try {
    await page.goto(tabUrl(projectId, dept.id, 'backlog'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: 'Tạo Issue' }).first().click({ timeout: 10000 });
    await page.waitForTimeout(2500);
    const file = 'dialog-create-issue.png';
    await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: true });
    console.log(`✓ [Thao tác] Hộp thoại Tạo Issue -> ${file}`);
    return [{ path: '(dialog) Tạo Issue', label: 'Thao tác · Tạo Issue', file }];
  } catch (err) {
    console.warn(`✗ Hộp thoại Tạo Issue: ${err.message}`);
    return [];
  }
}

async function main() {
  await mkdir(SHOTS_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('→ Logging in...');
  await login(page);
  console.log('✓ Logged in:', page.url());
  const projectId = new URL(page.url()).pathname.split('/p/')[1]; // e.g. 7afc9162-...

  const screens = await discoverScreens(page);
  console.log(`→ Found ${screens.length} workspace screens`);

  const captured = [];
  for (const screen of screens) {
    try {
      captured.push(await capture(page, screen));
    } catch (err) {
      console.warn(`✗ ${screen.label}: ${err.message}`);
    }
  }

  // Find the department that actually has stories, then capture there.
  console.log('→ Finding department with stories...');
  const dept = await findDeptWithStories(page, projectId) || DEPTS[0];

  console.log('→ Capturing project tabs...');
  captured.push(...await captureProjectTabs(page, projectId, dept));

  console.log('→ Capturing story detail...');
  captured.push(...await captureStoryDetail(page, projectId, dept));

  console.log('→ Capturing create-issue dialog...');
  captured.push(...await captureCreateDialog(page, projectId, dept));

  console.log('→ Capturing personal My Work...');
  captured.push(...await captureMyWork(page));

  await writeFile(
    path.join(process.cwd(), 'screens.json'),
    JSON.stringify({ baseUrl: BASE_URL, capturedAt: new Date().toISOString(), screens: captured }, null, 2)
  );
  console.log(`\nDone. ${captured.length} screenshots in shots/. Metadata: screens.json`);
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
