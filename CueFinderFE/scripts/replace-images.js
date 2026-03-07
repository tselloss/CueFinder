/**
 * Replaces seeded listing images with official manufacturer product photos.
 *
 * Usage: node scripts/replace-images.js --username=seeduser --password=seed123
 *
 * Requirements:
 *   - Backend running at http://localhost:5000
 *   - fetch-product-images.js must have been run first
 */

const fs = require('fs');
const path = require('path');

const API = 'http://localhost:5000/api';
const IMG_DIR = path.join(__dirname, 'product-images');

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v]; })
);
const USERNAME = args.username || '';
const PASSWORD = args.password || '';
if (!USERNAME || !PASSWORD) {
  console.error('Usage: node scripts/replace-images.js --username=x --password=x');
  process.exit(1);
}

// ── Image map ─────────────────────────────────────────────────────────────────
function img(filename) {
  const p = path.join(IMG_DIR, filename);
  return fs.existsSync(p) ? p : null;
}

// cueId → local image path
const CUE_IMAGES = {
  120: img('predator_revo.jpg')   || img('predator_314.jpg'),  // Predator REVO
  121: img('predator_314.jpg'),                                 // Predator 314-3
  122: img('mezz_ec9w.jpg'),                                    // Mezz EC7-W
  123: img('mezz_ec9w.jpg'),                                    // Mezz PC35
  124: img('cuetec_cynergy.jpg'),                               // Cuetec Cynergy
  125: img('cuetec_cynergy.jpg'),                               // Cuetec R360
  126: img('mcdermott_g1902.jpg') || img('mcdermott_h755.jpg'),// McDermott G-Core
  127: img('mcdermott_h755.jpg'),                               // McDermott H755C
  128: img('mcdermott_h755.jpg'),                               // Jacoby Custom
  129: img('meucci_mo1.jpg'),                                   // Meucci MO-1
  130: img('predator_314.jpg'),                                 // OB Cues
  131: img('predator_bk3.jpg'),                                 // Predator BK3
  132: img('tiger_onyx_break.jpg'),                             // Tiger Onyx
};

// cueCaseId → local image path
const CASE_IMAGES = {
  580: img('predator_urbain_case.jpg'),
  581: img('predator_urbain_case.jpg'),
  582: img('predator_urbain_case.jpg'),
  583: img('predator_urbain_case.jpg'),
  584: img('predator_urbain_case.jpg'),
};

// ── API helpers ───────────────────────────────────────────────────────────────
let token = '';

async function apiDelete(endpoint) {
  const res = await fetch(`${API}${endpoint}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

async function apiGet(endpoint) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  return res.json();
}

async function uploadCueImage(cueId, imagePath) {
  if (!imagePath) return false;
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('cueId', String(cueId));
  formData.append('files', blob, `cue_${cueId}_official.jpg`);
  const res = await fetch(`${API}/images/upload-multiple`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    console.warn(`    ⚠  Upload failed ${res.status}: ${t.slice(0, 100)}`);
  }
  return res.ok;
}

async function uploadCaseImage(caseId, imagePath) {
  if (!imagePath) return false;
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('files', blob, `case_${caseId}_official.jpg`);
  const res = await fetch(`${API}/cuecases/${caseId}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.ok;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\nReplacing images with official product photos...\n');

  // Login
  const authRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const authData = await authRes.json();
  token = authData.token || authData.accessToken || authData.jwt;
  if (!token) { console.error('Login failed'); process.exit(1); }
  console.log('✓ Logged in\n');

  // ── Cues
  console.log('── Cues ──');
  for (const [cueIdStr, imgPath] of Object.entries(CUE_IMAGES)) {
    const cueId = Number(cueIdStr);
    if (!imgPath) { console.log(`  cue ${cueId}: no image available — skipping`); continue; }

    process.stdout.write(`  cue ${cueId} (${path.basename(imgPath)}) ... `);

    // Fetch existing images and delete them
    const cue = await apiGet(`/cues/${cueId}`);
    if (cue?.images?.length) {
      for (const img of cue.images) {
        await apiDelete(`/images/${img.id}`);
      }
    }

    // Upload official image
    const ok = await uploadCueImage(cueId, imgPath);
    console.log(ok ? '✓' : '✗');
  }

  // ── Cases
  console.log('\n── Cases ──');
  for (const [caseIdStr, imgPath] of Object.entries(CASE_IMAGES)) {
    const caseId = Number(caseIdStr);
    if (!imgPath) { console.log(`  case ${caseId}: no image available — skipping`); continue; }

    process.stdout.write(`  case ${caseId} (${path.basename(imgPath)}) ... `);

    // Fetch existing images and delete them
    const caseData = await apiGet(`/cuecases/${caseId}`);
    const existingImages = caseData?.images || caseData?.caseImages || [];
    for (const img of existingImages) {
      await apiDelete(`/cuecases/images/${img.id}`).catch(() => {});
    }

    const ok = await uploadCaseImage(caseId, imgPath);
    console.log(ok ? '✓' : '✗');
  }

  console.log('\n✓ Done! Official images uploaded.\n');
  console.log('Now run: node scripts/take-screenshots.js --username=seeduser --password=seed123\n');
})().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
