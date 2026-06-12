import { getBrowserContext, parsePrice, cleanText } from './utils.js';

export async function scrapeAmazon(query) {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
  const { browser, context } = await getBrowserContext();
  
  try {
    const page = await context.newPage();
    
    // Set headers and set cookies if needed
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for the result items
    await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 }).catch(() => {});
    
    const items = await page.$$('[data-component-type="s-search-result"]');
    const results = [];
    
    for (let i = 0; i < items.length && results.length < 3; i++) {
      const item = items[i];
      
      try {
        // Name
        const nameEl = await item.$('h2 a span');
        const name = nameEl ? cleanText(await nameEl.textContent()) : '';
        if (!name) continue;
        
        // Product URL
        const urlEl = await item.$('h2 a');
        let productUrl = urlEl ? await urlEl.getAttribute('href') : '';
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = 'https://www.amazon.in' + productUrl;
        }
        
        // Price
        const priceEl = await item.$('.a-price-whole');
        const priceStr = priceEl ? await priceEl.textContent() : '';
        const price = parsePrice(priceStr);
        if (!price) continue;
        
        // Original MRP
        const mrpEl = await item.$('.a-price.a-text-price span.a-offscreen');
        const mrpStr = mrpEl ? await mrpEl.textContent() : '';
        let mrp = parsePrice(mrpStr);
        if (!mrp || mrp < price) {
          mrp = price; // Fallback to price if MRP not found or invalid
        }
        
        // Discount
        const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
        
        // Image URL
        const imgEl = await item.$('img.s-image');
        const imageUrl = imgEl ? await imgEl.getAttribute('src') : '';
        
        // Delivery Info
        const deliveryEl = await item.$('.s-delivery-instructions-list');
        let delivery = deliveryEl ? cleanText(await deliveryEl.textContent()) : 'Free delivery';
        if (delivery.includes('Get it by')) {
          delivery = delivery.split(',')[0]; // Simplify
        }
        
        results.push({
          platform: 'amazon',
          name,
          price,
          mrp,
          discount,
          delivery,
          url: productUrl,
          imageUrl
        });
      } catch (e) {
        // Fail silently for individual items to extract remaining items
        console.error('Failed to parse Amazon item:', e.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Amazon scraping error:', error.message);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
export default scrapeAmazon;
