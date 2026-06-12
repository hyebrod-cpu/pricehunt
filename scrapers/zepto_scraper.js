import { getBrowserContext, parsePrice, cleanText } from './utils.js';

export async function scrapeZepto(query) {
  const url = `https://zepto.com/search?query=${encodeURIComponent(query)}`;
  const { browser, context } = await getBrowserContext();
  
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    
    // Wait for product cards or links
    await page.waitForSelector('[data-testid="product-card"], a[href*="/p/"]', { timeout: 10000 }).catch(() => {});
    
    const items = await page.$$('[data-testid="product-card"], a[href*="/p/"]');
    const results = [];
    
    for (let i = 0; i < items.length && results.length < 3; i++) {
      const item = items[i];
      
      try {
        // Name
        const nameEl = await item.$('[data-testid="product-card-name"], [class*="name"], h5, h4');
        let name = nameEl ? await nameEl.textContent() : '';
        name = cleanText(name);
        if (!name) continue;
        
        // URL
        let productUrl = await item.getAttribute('href');
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = 'https://zepto.com' + productUrl;
        }
        if (!productUrl) {
          const aTag = await item.$('a');
          productUrl = aTag ? await aTag.getAttribute('href') : '';
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = 'https://zepto.com' + productUrl;
          }
        }
        if (!productUrl) productUrl = url;
        
        // Price
        const priceEl = await item.$('[data-testid="product-card-price"], [class*="price"], [class*="Price"]');
        const priceStr = priceEl ? await priceEl.textContent() : '';
        const price = parsePrice(priceStr);
        if (!price) continue;
        
        // MRP
        const mrpEl = await item.$('[class*="strike"], [class*="mrp"], [class*="MRP"]');
        const mrpStr = mrpEl ? await mrpEl.textContent() : '';
        let mrp = parsePrice(mrpStr);
        if (!mrp || mrp < price) {
          mrp = price;
        }
        
        const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
        
        // Image
        const imgEl = await item.$('img');
        const imageUrl = imgEl ? await imgEl.getAttribute('src') : '';
        
        // Delivery
        const delivery = 'Delivery in 8-10 mins';
        
        results.push({
          platform: 'zepto',
          name,
          price,
          mrp,
          discount,
          delivery,
          url: productUrl,
          imageUrl
        });
      } catch (e) {
        console.error('Failed to parse Zepto item:', e.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Zepto scraping error:', error.message);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
export default scrapeZepto;
