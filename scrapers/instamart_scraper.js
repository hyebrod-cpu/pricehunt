import { getBrowserContext, parsePrice, cleanText } from './utils.js';

export async function scrapeInstamart(query) {
  const url = `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(query)}`;
  const { browser, context } = await getBrowserContext();
  
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    
    // Wait for item cards
    await page.waitForSelector('[data-testid="item-card"], [class*="item-card"]', { timeout: 10000 }).catch(() => {});
    
    const items = await page.$$('[data-testid="item-card"], [class*="item-card"]');
    const results = [];
    
    for (let i = 0; i < items.length && results.length < 3; i++) {
      const item = items[i];
      
      try {
        // Name
        const nameEl = await item.$('[data-testid="item-name"], [class*="name"], [class*="title"], h5, h4');
        let name = nameEl ? await nameEl.textContent() : '';
        name = cleanText(name);
        if (!name) continue;
        
        // URL
        let productUrl = await item.getAttribute('href');
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = 'https://www.swiggy.com' + productUrl;
        }
        if (!productUrl) {
          const aTag = await item.$('a');
          productUrl = aTag ? await aTag.getAttribute('href') : '';
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = 'https://www.swiggy.com' + productUrl;
          }
        }
        if (!productUrl) productUrl = url;
        
        // Price
        const priceEl = await item.$('[data-testid="item-price"], [class*="price"], [class*="Price"]');
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
        const delivery = 'Delivery in 10-12 mins';
        
        results.push({
          platform: 'instamart',
          name,
          price,
          mrp,
          discount,
          delivery,
          url: productUrl,
          imageUrl
        });
      } catch (e) {
        console.error('Failed to parse Instamart item:', e.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Instamart scraping error:', error.message);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
export default scrapeInstamart;
