import { getBrowserContext, parsePrice, cleanText } from './utils.js';

export async function scrapeBlinkit(query) {
  const url = `https://blinkit.com/s/?q=${encodeURIComponent(query)}`;
  const { browser, context } = await getBrowserContext();
  
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    
    // Blinkit might show location prompt. We try to see if products load.
    // Try to wait for product cards
    await page.waitForSelector('a[href*="/prn/"], [data-testid="product-card"]', { timeout: 10000 }).catch(() => {});
    
    // Find items
    const items = await page.$$('a[href*="/prn/"], [data-testid="product-card"]');
    const results = [];
    
    for (let i = 0; i < items.length && results.length < 3; i++) {
      const item = items[i];
      
      try {
        // Blinkit product card
        // Name
        const nameEl = await item.$('[class*="ProductName"], [class*="name"], [class*="Title"]');
        let name = nameEl ? await nameEl.textContent() : '';
        if (!name) {
          // fallback to reading direct text from heading tags inside card
          const heading = await item.$('h3, h4, div');
          name = heading ? await heading.textContent() : '';
        }
        name = cleanText(name);
        if (!name) continue;
        
        // URL
        let productUrl = await item.getAttribute('href');
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = 'https://blinkit.com' + productUrl;
        }
        if (!productUrl) {
          // If the item itself isn't the 'a' tag, check if it's nested
          const aTag = await item.$('a');
          productUrl = aTag ? await aTag.getAttribute('href') : '';
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = 'https://blinkit.com' + productUrl;
          }
        }
        if (!productUrl) productUrl = url; // Fallback to search url
        
        // Price
        const priceEl = await item.$('[class*="Price"], [class*="price"]');
        const priceStr = priceEl ? await priceEl.textContent() : '';
        const price = parsePrice(priceStr);
        if (!price) continue;
        
        // MRP
        const mrpEl = await item.$('[class*="Mrp"], [class*="mrp"], [class*="strike"]');
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
        const delivery = 'Delivery in 10-15 mins';
        
        results.push({
          platform: 'blinkit',
          name,
          price,
          mrp,
          discount,
          delivery,
          url: productUrl,
          imageUrl
        });
      } catch (e) {
        console.error('Failed to parse Blinkit item:', e.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Blinkit scraping error:', error.message);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
export default scrapeBlinkit;
