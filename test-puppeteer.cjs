const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000');
  
  // Login as user
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'talztech.co.za@gmail.com');
  await page.type('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForSelector('h3', { text: /Submit a Support Ticket/i, timeout: 5000 }).catch(() => {});
  
  // Go to create tab if not already
  const createTab = await page.$x("//span[contains(text(), 'Submit Ticket')]");
  if (createTab.length > 0) {
    await createTab[0].click();
  }
  
  // Fill the form
  await page.waitForSelector('input[placeholder="e.g. Printer offline on 3rd floor, password reset issue"]');
  await page.type('input[placeholder="e.g. Printer offline on 3rd floor, password reset issue"]', 'Test Subject');
  await page.type('textarea', 'Test Description');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait a bit for crash
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Test completed.');
  await browser.close();
})();
