/**
 * Fetches official product images from billiard manufacturer websites
 * using a real browser (Playwright) to bypass JS rendering.
 *
 * Usage: node scripts/fetch-product-images.js
 * Output: scripts/product-images/ (one .jpg per product)
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUT_DIR = path.join(__dirname, 'product-images');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Products to fetch ─────────────────────────────────────────────────────────
// Each entry: { filename, url, imageSelector (optional) }
const PRODUCTS = [
  // Predator
  {
    filename: 'predator_revo.jpg',
    url: 'https://www.predatorcues.com/usa/predator-revo-12-9-mm-shaft-for-3-8x10-joint-white-vault-plate.html',
    selector: '.product-image-wrapper img, .gallery-image img, [data-testid="product-image"] img, .product__photo img',
  },
  {
    filename: 'predator_314.jpg',
    url: 'https://www.predatorcues.com/usa/pool-shafts/spliced-maple-shafts/predator-314-3-shaft.html',
    selector: '.product-image-wrapper img, .gallery-image img, .product__photo img',
  },
  {
    filename: 'predator_bk3.jpg',
    url: 'https://www.predatorcues.com/usa/pool-cues/break-cues/bk3-pool-break-cue.html',
    selector: '.product-image-wrapper img, .gallery-image img, .product__photo img',
  },
  {
    filename: 'predator_urbain_case.jpg',
    url: 'https://www.predatorcues.com/usa/predator-urbain-dark-grey-hard-pool-cue-case-2-butts-x-4-shafts.html',
    selector: '.product-image-wrapper img, .gallery-image img, .product__photo img',
  },

  // Mezz
  {
    filename: 'mezz_ec9w.jpg',
    url: 'https://mezzusa.com/products/ec9-w-billiard-cue',
    selector: '.product__media img, .product-media-container img, .product__photo img',
  },
  {
    filename: 'mezz_pc35.jpg',
    url: 'https://mezzusa.com/products/pc35',
    selector: '.product__media img, .product-media-container img, .product__photo img',
  },

  // Cuetec
  {
    filename: 'cuetec_cynergy.jpg',
    url: 'https://www.cuetec.com/cues/cynergy-series/',
    selector: 'img[src*="cynergy"], .product img, .wp-post-image, article img',
  },
  {
    filename: 'cuetec_r360.jpg',
    url: 'https://www.cuetec.com/cues/r360-series/',
    selector: 'img[src*="r360"], .product img, .wp-post-image, article img',
  },

  // McDermott
  {
    filename: 'mcdermott_g1902.jpg',
    url: 'https://www.mcdermottcue.com/g-series/',
    selector: 'img[alt*="G1902"], img[alt*="G19"], .cue-image img, .product-image img, img[src*="G1902"]',
  },
  {
    filename: 'mcdermott_h755.jpg',
    url: 'https://www.mcdermottcue.com/h-series/',
    selector: 'img[alt*="H755"], .cue-image img, .product-image img, img[src*="H755"]',
  },

  // Jacoby
  {
    filename: 'jacoby_carbon.jpg',
    url: 'https://www.jacobycue.com/pool-cues/',
    selector: '.product img, img[src*="carbon"], img[src*="Carbon"], .product-image img',
  },

  // Meucci
  {
    filename: 'meucci_mo1.jpg',
    url: 'https://www.meuccicues.com/',
    selector: '.product img, img[src*="MO"], .cue img',
  },

  // OB Cues
  {
    filename: 'ob_cues_ob1.jpg',
    url: 'https://www.obcues.com/ob-shafts/',
    selector: 'img[alt*="OB-1"], img[src*="ob1"], img[src*="OB1"], .product img',
  },

  // Tiger
  {
    filename: 'tiger_onyx_break.jpg',
    url: 'https://tigerproducts.com/collections/break-cues',
    selector: '.product__media img, img[alt*="onyx"], img[alt*="Onyx"], img[src*="onyx"]',
  },

  // Aramith
  {
    filename: 'aramith_procup.jpg',
    url: 'https://www.aramith.com/en/pool-balls/pro-cup/',
    selector: 'img[src*="pro-cup"], img[src*="procup"], .product img, .product-image img',
  },

  // Kamui
  {
    filename: 'kamui_black_tips.jpg',
    url: 'https://www.kamuitips.com/products/kamui-black-tip',
    selector: '.product__media img, img[src*="black"], .product-image img',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.destroy();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.destroy();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\nFetching official product images...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
  });

  const results = [];

  for (const product of PRODUCTS) {
    const outPath = path.join(OUT_DIR, product.filename);
    if (fs.existsSync(outPath)) {
      console.log(`  ✓  ${product.filename}  (already exists)`);
      results.push({ filename: product.filename, found: true });
      continue;
    }

    process.stdout.write(`  ${product.filename} ... `);
    const page = await context.newPage();

    try {
      await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2500);

      // Try the given selector first, then fall back to largest img
      let imgUrl = null;

      if (product.selector) {
        const handle = await page.$(product.selector);
        if (handle) {
          imgUrl = await handle.getAttribute('src') || await handle.getAttribute('data-src') || await handle.getAttribute('data-lazy-src');
          if (imgUrl && imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
          if (imgUrl && imgUrl.startsWith('/')) imgUrl = new URL(product.url).origin + imgUrl;
        }
      }

      // Fallback: find the biggest image on the page (likely the product hero)
      if (!imgUrl) {
        imgUrl = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          const candidates = imgs
            .filter(img => {
              const src = img.src || img.dataset.src || '';
              // Skip icons, logos, tiny images, SVGs
              return src && !src.includes('logo') && !src.includes('icon') &&
                     !src.includes('.svg') && img.naturalWidth > 200;
            })
            .map(img => ({
              src: img.src || img.dataset.src,
              area: (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0),
            }))
            .filter(i => i.area > 0)
            .sort((a, b) => b.area - a.area);
          return candidates[0]?.src || null;
        });
      }

      if (!imgUrl || imgUrl.startsWith('data:')) {
        // Last resort: grab any rendered img src
        imgUrl = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('main img, article img, .product img, section img'));
          for (const img of imgs) {
            const src = img.currentSrc || img.src;
            if (src && !src.includes('logo') && !src.startsWith('data:')) return src;
          }
          return null;
        });
      }

      if (imgUrl) {
        await downloadFile(imgUrl, outPath);
        const size = Math.round(fs.statSync(outPath).size / 1024);
        console.log(`✓  (${size}KB)`);
        results.push({ filename: product.filename, found: true, src: imgUrl });
      } else {
        console.log('✗  no image found');
        results.push({ filename: product.filename, found: false });
      }
    } catch (err) {
      console.log(`✗  ${err.message.slice(0, 80)}`);
      results.push({ filename: product.filename, found: false, error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const found = results.filter(r => r.found).length;
  console.log(`\nDone: ${found}/${PRODUCTS.length} images saved to scripts/product-images/\n`);

  // Write results manifest for the seed script to use
  const manifest = {};
  for (const r of results) {
    if (r.found) manifest[r.filename] = path.join(OUT_DIR, r.filename);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
})();
