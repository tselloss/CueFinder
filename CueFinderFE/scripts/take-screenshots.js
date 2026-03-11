/**
 * CueFinder Instagram Screenshot Tool
 *
 * Usage:
 *   node scripts/take-screenshots.js
 *   node scripts/take-screenshots.js --username=myuser --password=mypass
 *
 * Requirements:
 *   - App running at http://localhost:3000
 *   - Backend running at http://localhost:5000
 *
 * Output: CueFinderFE/screenshots/
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';
const OUT_DIR  = path.join(__dirname, '..', 'screenshots');

// Parse --username=x --password=x from args
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v]; })
);
const USERNAME = args.username || '';
const PASSWORD = args.password || '';

// Viewport presets
const V = {
  portrait: { width: 1080, height: 1350 }, // Instagram feed 4:5
  square:   { width: 1080, height: 1080 }, // Instagram square
  story:    { width: 430,  height: 932  }, // iPhone 14 Pro — story/reel
  desktop:  { width: 1440, height: 900  }, // Desktop / LinkedIn
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function goto(page, url, waitForSelector, timeout = 10000) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });
  // Wait for React to settle
  await page.waitForTimeout(1500);
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout }).catch(() => {});
  }
  await page.waitForTimeout(800);
  const finalUrl = new URL(page.url()).pathname;
  return finalUrl;
}

async function shot(page, name, viewport) {
  await page.setViewportSize(V[viewport] || V.portrait);
  await page.waitForTimeout(400); // let layout reflow
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const size = `${(V[viewport] || V.portrait).width}×${(V[viewport] || V.portrait).height}`;
  console.log(`  ✓  ${name}.png  [${size}]`);
}

async function login(page) {
  console.log('\n── Logging in via API ──');

  // Call the backend directly — no browser form, no redirect race condition
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login API failed: ${res.status}`);
  const data = await res.json();
  const jwt = data.accessToken || data.token;
  if (!jwt) throw new Error('No token in login response');

  // Land on home first so localStorage is accessible for this origin
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // Inject token + minimal user into localStorage — same keys the app reads on startup
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, {
    token: jwt,
    user: {
      id: data.userId,
      username: data.username,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      hidePhone: data.hidePhone || false,
      role: data.role || 'user',
    },
  });

  // Reload so AuthContext picks up the injected token
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('  ✓  Logged in as', data.username);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`\nCueFinder Screenshot Tool`);
  console.log(`Output → ${OUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'en-US',
    colorScheme: 'light',
    // Start at desktop size
    viewport: V.desktop,
  });
  const page = await context.newPage();

  // ─────────────────────────────────────────────────────
  // 1. HOME — desktop wide shot
  // ─────────────────────────────────────────────────────
  console.log('\n── Home page ──');
  await goto(page, '/', 'img, .cue-card, [class*="card"]');
  await shot(page, '01_home_desktop', 'desktop');
  await shot(page, '02_home_portrait', 'portrait');
  await shot(page, '03_home_story', 'story');

  // ─────────────────────────────────────────────────────
  // 2. RAFFLE LIST
  // ─────────────────────────────────────────────────────
  console.log('\n── Raffles ──');
  const rafflesUrl = await goto(page, '/raffles', 'h1, img, [class*="raffle"]');
  console.log('  landed at:', rafflesUrl);
  await shot(page, '04_raffles_portrait', 'portrait');
  await shot(page, '05_raffles_story', 'story');

  // ─────────────────────────────────────────────────────
  // 3. LOGIN PAGE (only if NOT logged in yet)
  // ─────────────────────────────────────────────────────
  if (!USERNAME) {
    console.log('\n── Login page ──');
    // Open a fresh page with no user to guarantee login page renders
    const loginPage = await context.newPage();
    await loginPage.setViewportSize(V.portrait);
    await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(2000);
    const loginUrl = new URL(loginPage.url()).pathname;
    console.log('  landed at:', loginUrl);
    await loginPage.setViewportSize(V.portrait);
    await loginPage.waitForTimeout(400);
    const file = path.join(OUT_DIR, '06_login_portrait.png');
    await loginPage.screenshot({ path: file, fullPage: false });
    console.log(`  ✓  06_login_portrait.png  [1080×1350]`);
    await loginPage.setViewportSize(V.story);
    await loginPage.waitForTimeout(400);
    const file2 = path.join(OUT_DIR, '07_login_story.png');
    await loginPage.screenshot({ path: file2, fullPage: false });
    console.log(`  ✓  07_login_story.png  [430×932]`);
    await loginPage.close();
  }

  // ─────────────────────────────────────────────────────
  // 4. AUTHENTICATED PAGES (if credentials provided)
  // ─────────────────────────────────────────────────────
  if (USERNAME && PASSWORD) {
    await login(page);

    // Listing detail — navigate directly to seeded cues
    console.log('\n── Listing detail ──');
    await goto(page, '/cue/120', 'img, h1');   // Predator REVO
    await shot(page, '06_cue_detail_portrait', 'portrait');
    await shot(page, '07_cue_detail_story', 'story');

    await goto(page, '/cue/127', 'img, h1');   // McDermott H755C (large image)
    await shot(page, '08_cue_detail2_portrait', 'portrait');

    await goto(page, '/case/580', 'img, h1');  // Predator Urbain case
    await shot(page, '09_case_detail_portrait', 'portrait');

    // Raffle detail — use existing raffle id=4 (Predator)
    console.log('\n── Raffle detail ──');
    await goto(page, '/raffles/4', 'h1');
    await shot(page, '10_raffle_detail_portrait', 'portrait');
    await shot(page, '11_raffle_detail_story', 'story');

    // Seller profile — seeduser id=1168
    console.log('\n── Seller profile ──');
    await goto(page, '/sellers/1168', 'h1, img');
    await shot(page, '12_seller_profile_portrait', 'portrait');

    // Profile page
    console.log('\n── User profile ──');
    await goto(page, '/profile', 'h1, img');
    await shot(page, '11_profile_portrait', 'portrait');

    // Inbox
    console.log('\n── Inbox ──');
    await goto(page, '/inbox', 'h1, [class*="message"]');
    await shot(page, '12_inbox_portrait', 'portrait');
  } else {
    console.log('\n── Skipping auth pages ──');
    console.log('   Run with --username=x --password=x to capture them');
  }

  await browser.close();

  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png'));
  console.log(`\nDone! ${files.length} screenshot(s) saved to:\n  ${OUT_DIR}\n`);
})();
