const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting puppeteer...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  console.log("Navigating to localhost...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation Error:', e.message));
  
  console.log("Waiting a bit...");
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyHandle = await page.$('body');
  const html = await page.evaluate(body => body.innerHTML, bodyHandle);
  console.log("BODY HTML PREVIEW:", html.substring(0, 300));
  
  await browser.close();
})();
