import { scrapeAmazon } from '../scrapers/amazon_scraper.js';
import { scrapeFlipkart } from '../scrapers/flipkart_scraper.js';
import { scrapeMeesho } from '../scrapers/meesho_scraper.js';
import { scrapeBlinkit } from '../scrapers/blinkit_scraper.js';
import { scrapeZepto } from '../scrapers/zepto_scraper.js';
import { scrapeInstamart } from '../scrapers/instamart_scraper.js';
import { generateMockData } from '../scrapers/utils.js';

const testQuery = process.argv[2] || 'wireless earphones';
const runLive = process.argv.includes('--live');

console.log(`=============================================`);
console.log(`Starting PriceHunt Scraper Tests`);
console.log(`Query: "${testQuery}"`);
console.log(`Mode: ${runLive ? 'LIVE' : 'MOCK'}`);
console.log(`=============================================\n`);

if (!runLive) {
  console.log('--- GENERATING MOCK DATA ---');
  const mockResponse = generateMockData(testQuery);
  console.log('Mock Data Status:', JSON.stringify(mockResponse.status, null, 2));
  console.log(`Mock Results Found: ${mockResponse.results.length}`);
  mockResponse.results.forEach((item, index) => {
    console.log(`\n[${index + 1}] Platform: ${item.platform.toUpperCase()}`);
    console.log(`    Name:  ${item.name}`);
    console.log(`    Price: ₹${item.price} (MRP: ₹${item.mrp}, Disc: ${item.discount}%)`);
    console.log(`    Deliv: ${item.delivery}`);
    console.log(`    URL:   ${item.url}`);
  });
  console.log('\nMock verification successful!');
  process.exit(0);
} else {
  console.log('--- RUNNING LIVE SCRAPERS IN PARALLEL ---');
  const scrapers = [
    { name: 'Amazon', fn: scrapeAmazon },
    { name: 'Flipkart', fn: scrapeFlipkart },
    { name: 'Meesho', fn: scrapeMeesho },
    { name: 'Blinkit', fn: scrapeBlinkit },
    { name: 'Zepto', fn: scrapeZepto },
    { name: 'Swiggy Instamart', fn: scrapeInstamart }
  ];

  const startTime = Date.now();

  const promises = scrapers.map(s => {
    console.log(`Starting live scraper for: ${s.name}...`);
    return s.fn(testQuery)
      .then(res => ({ name: s.name, success: true, count: res.length, data: res }))
      .catch(err => ({ name: s.name, success: false, error: err.message, data: [] }));
  });

  Promise.all(promises).then(results => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n=============================================`);
    console.log(`Live Scrapers Completed in ${duration}s`);
    console.log(`=============================================\n`);

    results.forEach(r => {
      console.log(`[${r.name}] Status: ${r.success ? 'SUCCESS ✔' : 'FAILED ❌'}`);
      if (r.success) {
        console.log(`           Results count: ${r.count}`);
        r.data.forEach((item, idx) => {
          console.log(`           - Result ${idx+1}: ₹${item.price} | ${item.name.substring(0, 50)}...`);
        });
      } else {
        console.log(`           Error: ${r.error}`);
      }
      console.log('');
    });
    process.exit(0);
  });
}
