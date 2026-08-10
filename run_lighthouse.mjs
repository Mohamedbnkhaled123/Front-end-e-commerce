import fs from 'fs';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

(async () => {
  const url = 'https://e-commerce-app-theta-nine.vercel.app/';
  console.log(`Starting Lighthouse run for ${url}...`);
  
  const browser = await puppeteer.launch({ headless: true });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: new URL(browser.wsEndpoint()).port
  };

  const runnerResult = await lighthouse(url, options);

  // Extract LCP details
  const lcpAudit = runnerResult.lcpResult = runnerResult.lhr.audits['largest-contentful-paint'];
  const lcpElement = runnerResult.lhr.audits['largest-contentful-paint-element'];
  const mainThreadWork = runnerResult.lhr.audits['mainthread-work-breakdown'];
  
  console.log('--- LCP METRICS ---');
  console.log(`LCP Time: ${lcpAudit.displayValue}`);
  if (lcpElement && lcpElement.details && lcpElement.details.items && lcpElement.details.items.length > 0) {
    const item = lcpElement.details.items[0];
    console.log(`LCP Element Node: ${item.node.snippet}`);
  }

  // Find LCP subparts
  const metrics = runnerResult.lhr.audits['metrics']?.details?.items?.[0] || {};
  console.log(`\n--- PERFORMANCE METRICS ---`);
  console.log(`FCP: ${metrics.firstContentfulPaint}`);
  console.log(`LCP: ${metrics.largestContentfulPaint}`);
  console.log(`TBT: ${metrics.totalBlockingTime}`);
  console.log(`CLS: ${metrics.cumulativeLayoutShift}`);

  console.log('\n--- NETWORK REQUESTS ---');
  const network = runnerResult.lhr.audits['network-requests'].details.items;
  network.forEach(req => {
    if (req.url.includes('/api/v1/cms') || req.url.includes('/api/v1/product') || req.url.includes('main') || req.url.includes('hero') || req.url.includes('data:image')) {
      console.log(`${req.url} - Duration: ${Math.round(req.endTime - req.startTime)}ms, Start: ${req.startTime.toFixed(2)}ms`);
    }
  });

  await browser.close();
  fs.writeFileSync('lhreport.json', runnerResult.report);
  console.log('Report saved to lhreport.json');
})();
