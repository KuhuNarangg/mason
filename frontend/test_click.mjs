import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  
  // Try to click catalogue
  try {
    const el = await page.$('.m-nav-link');
    if (el) {
       const box = await el.boundingBox();
       const x = box.x + box.width / 2;
       const y = box.y + box.height / 2;
       
       const topEl = await page.evaluate((x, y) => {
         const element = document.elementFromPoint(x, y);
         return element ? { tagName: element.tagName, className: element.className, id: element.id } : null;
       }, x, y);
       console.log("Element at Catalogue link center:", topEl);
    }
  } catch(e) { console.error(e) }

  try {
    const el2 = await page.$('.m-hero__cta');
    if (el2) {
       const box = await el2.boundingBox();
       const x = box.x + box.width / 2;
       const y = box.y + box.height / 2;
       
       const topEl = await page.evaluate((x, y) => {
         const element = document.elementFromPoint(x, y);
         return element ? { tagName: element.tagName, className: element.className, id: element.id } : null;
       }, x, y);
       console.log("Element at Shop The Collection center:", topEl);
    }
  } catch(e) {}

  await browser.close();
})();
