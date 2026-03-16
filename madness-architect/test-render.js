import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: 'render.png' });
    } catch (err) {
        console.log('Error loading', err);
    }
    await browser.close();
})();
