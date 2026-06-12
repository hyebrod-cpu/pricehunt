import { getBrowserContext, parsePrice, cleanText } from './utils.js';

export async function scrapeMeesho(query) {
  const url = `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
  const { browser, context } = await getBrowserContext();
  
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for the grid columns or product links
    await page.waitForSelector('a[href*="/p/"]', { timeout: 10000 }).catch(() => {});
    
    // Select cards. Usually a tag with product link
    const items = await page.$$('a[href*="/p/"]');
    const results = [];
    
    for (let i = 0; i < items.length && results.length < 3; i++) {
      const item = items[i];
      
      try {
        // Name
        const nameEl = await item.$('p'); // Meesho titles are typically 'p' tags inside the card
        let name = nameEl ? await nameEl.textContent() : '';
        name = cleanText(name);
        if (!name) continue;
        
        // Product URL
        let productUrl = await item.getAttribute('href');
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = 'https://www.meesho.com' + productUrl;
        }
        if (!productUrl) continue;
        
        // Price - Meesho prices are usually inside h5 tags
        const priceEl = await item.$('h5');
        const priceStr = priceEl ? await priceEl.textContent() : '';
        const price = parsePrice(priceStr);
        if (!price) continue;
        
        // Original MRP - Meesho might not show MRP on search page, or it might show in a smaller text
        // Let's look for elements with class containing 'mrp' or 'OriginalPrice' or check text with line-through
        const mrpEl = await item.$('p[class*="original-price"], span[class*="original-price"], p[class*="OriginalPriceText"]');
        const mrpStr = mrpEl ? await mrpEl.textContent() : '';
        let mrp = parsePrice(mrpStr);
        
        if (!mrp || mrp < price) {
          // Meesho usually offers small discounts. If no MRP, let's look for discount text to backtrack MRP or default to price.
          const discountEl = await item.$('span[class*="discount"], p[class*="DiscountText"]');
          let discountPct = 0;
          if (discountEl) {
            const discText = await discountEl.textContent();
            const match = discText.match(/(\d+)%/);
            if (match) discountPct = parseInt(match[1]);
          }
          
          if (discountPct > 0) {
            mrp = Math.round(price / (1 - discountPct / 100));
          } else {
            mrp = price;
          }
        }
        
        const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
        
        // Image URL
        const imgEl = await item.$('img');
        const imageUrl = imgEl ? await imgEl.getAttribute('src') : '';
        
        // Delivery Info - Meesho usually has free delivery
        const deliveryEl = await item.$('span[class*="delivery"], p[class*="Delivery"]');
        let delivery = deliveryEl ? cleanText(await deliveryEl.textContent()) : 'Free Delivery';
        if (!delivery || delivery.toLowerCase().includes('mrp')) {
          delivery = 'Free Delivery';
        }
        
        results.push({
          platform: 'meesho',
          name,
          price,
          mrp,
          discount,
          delivery,
          url: productUrl,
          imageUrl
        });
      } catch (e) {
        console.error('Failed to parse Meesho item:', e.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Meesho scraping error:', error.message);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
export default scrapeMeesho;
