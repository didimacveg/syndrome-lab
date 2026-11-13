// Render the 1080x1350 images and the three short videos from the site itself (web/card.html).
// Usage: node scripts/make_content.js   (starts its own static server for web/)
const { chromium } = require('playwright');
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'content');
const PORT = 8141;
const IMAGES = [['01-title', 'title'], ['02-syndrome', 'syndrome'], ['03-duel', 'duel'], ['04-headline', 'headline'],
  ['05-ratio', 'curves'], ['06-threshold', 'threshold'], ['07-latency', 'latency'], ['08-honest', 'honest']];

async function open(browser, query) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { throw e; });
  await page.goto(`http://localhost:${PORT}/card.html?c=${query}`);
  await page.waitForSelector('body[data-ready]', { timeout: 30000 });
  await page.waitForTimeout(300);
  return page;
}

function encode(frames, name) { // frames: [[pngPath, seconds]]
  const list = path.join(path.dirname(frames[0][0]), 'list.txt');
  fs.writeFileSync(list, frames.map(([f, s]) => `file '${f}'\nduration ${s}`).join('\n') + `\nfile '${frames[frames.length - 1][0]}'\n`);
  const out = path.join(OUT, 'videos', name + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'fps=30,format=yuv420p',
    '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', out]);
  console.log('video', path.relative(ROOT, out), (fs.statSync(out).size / 1e6).toFixed(2) + ' MB');
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'videos'), { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', path.join(ROOT, 'web')], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch();
  try {
    for (const [name, query] of IMAGES) {
      const page = await open(browser, query);
      await page.screenshot({ path: path.join(OUT, 'images', name + '.png') });
      await page.close();
      console.log('image', name);
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-'));
    const shoot = async (page, dir, i) => { const f = path.join(dir, String(i).padStart(4, '0') + '.png'); await page.screenshot({ path: f }); return f; };

    // 1. errors injected and corrected
    let dir = path.join(tmp, 'a'); fs.mkdirSync(dir);
    let page = await open(browser, 'v_inject'), frames = [];
    const steps = await page.evaluate(() => window.cardSteps);
    for (let i = 0; i < steps; i++) { await page.evaluate(n => window.cardStep(n), i); frames.push([await shoot(page, dir, i), [1.6, 0.7, 0.7, 1.2, 2.6, 3.0, 4.0][i] || 2]); }
    await page.close(); encode(frames, '01-inject-and-correct');

    // 2. threshold curves drawn point by point, then the crossings
    dir = path.join(tmp, 'b'); fs.mkdirSync(dir); frames = [];
    for (let n = 1; n <= 9; n++) {
      page = await open(browser, n <= 8 ? `threshold&n=${n}&x=0` : 'threshold');
      frames.push([await shoot(page, dir, n), n <= 8 ? 0.55 : 4.5]); await page.close();
    }
    encode(frames, '02-threshold');

    // 3. MWPM against the network over 3,000 random chips
    dir = path.join(tmp, 'c'); fs.mkdirSync(dir); frames = [];
    page = await open(browser, 'v_race');
    const n = await page.evaluate(() => window.cardSteps);
    frames.push([await shoot(page, dir, 0), 0.25]);
    for (let i = 1; i < n; i++) { await page.evaluate(() => window.cardStep()); frames.push([await shoot(page, dir, i), i === n - 1 ? 4 : 0.2]); }
    await page.close(); encode(frames, '03-mwpm-vs-network');
    fs.rmSync(tmp, { recursive: true, force: true });
  } finally { await browser.close(); server.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
