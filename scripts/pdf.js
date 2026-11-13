// Print an HTML file to PDF with headless Chromium: node scripts/pdf.js in.html out.pdf
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [src, dst] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(src));
  await page.pdf({ path: dst, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font:8px Georgia,serif;color:#777;width:100%;text-align:center">Syndrome Lab technical report · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '18mm', bottom: '18mm', left: '17mm', right: '17mm' } });
  const pages = await page.evaluate(() => 0);
  await browser.close();
  console.log('wrote', dst);
})();
