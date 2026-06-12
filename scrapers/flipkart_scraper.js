import { getBrowserContext, parsePrice, cleanText } from './utils.js';

export async function scrapeFlipkart(query) {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  const { browser, context } = await getBrowserContext();
  
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for the grid items or list items
    await page.waitForSelector('div[data-id]', { timeout: 10000 }).catch(() => {});
    
    const items = await page.$$('div[data-id]');
    const results = [];
    
    for (let i = 0; i < items.length && results.length < 3; i++) {
      const item = items[i];
      
      try {
        // Name - Flipkart uses KzDlHZ for grid/list titles, IRpwTa for fashion, wjcE2T for accessories
        let name = '';
        const nameEl1 = await item.$('.KzDlHZ');
        const nameEl2 = await item.$('.IRpwTa');
        const nameEl3 = await item.$('.wjcE2T');
        
        if (nameEl1) name = await nameEl1.textContent();
        else if (nameEl2) name = await nameEl2.textContent();
        else if (nameEl3) name = await nameEl3.textContent();
        else {
          // Fallback to finding the link tag text
          const linkEl = await item.$('a');
          if (linkEl) name = await linkEl.getAttribute('title') || await linkEl.textContent();
        }
        
        name = cleanText(name);
        if (!name) continue;
        
        // Product URL
        const urlEl = await item.$('a');
        let productUrl = urlEl ? await urlEl.getAttribute('href') : '';
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = 'https://www.flipkart.com' + productUrl;
        }
        if (!productUrl) continue;
        
        // Price - Flipkart uses Nx9z98, _30jeq3, hl05eU, Xxpc37
        let priceStr = '';
        const priceEl1 = await item.$('.Nx9z98');
        const priceEl2 = await item.$('._30jeq3');
        const priceEl3 = await item.$('.Xxpc37');
        
        if (priceEl1) priceStr = await priceEl1.textContent();
        else if (priceEl2) priceStr = await priceEl2.textContent();
        else if (priceEl3) priceStr = await priceEl3.textContent();
        
        const price = parsePrice(priceStr);
        if (!price) continue;
        
        // Original MRP - Flipkart uses y3e5Z0, _3I9_R1
        let mrpStr = '';
        const mrpEl1 = await item.$('.y3e5Z0');
        const mrpEl2 = await item.$('._3I9_R1');
        
        if (mrpEl1) mrpStr = await mrpEl1.textContent();
        else if (mrpEl2) mrpStr = await mrpEl2.textContent();
        
        let mrp = parsePrice(mrpStr);
        if (!mrp || mrp < price) {
          mrp = price;
        }
        
        // Discount - Flipkart uses UkUFwK, _3Ay6B5
        let discount = 0;
        const discountEl = await item.$('.UkUFwK, ._3Ay6B5');
        if (discountEl) {
          const discText = await discountEl.textContent();
          const match = discText.match(/(\d+)%/);
          if (match) {
            discount = parseInt(match[1]);
          }
        }
        if (!discount && mrp > price) {
          discount = Math.round(((mrp - price) / mrp) * 100);
        }
        
        // Image URL - Flipkart uses DByoEF, _396cs4, or img
        let imageUrl = '';
        const imgEl = await item.$('img');
        if (imgEl) {
          imageUrl = await imgEl.getAttribute('src') || '';
        }
        
        // Delivery Info
        let delivery = 'Free delivery';
        const deliveryEl = await item.$('.._2T3WWZ, ._3tcB-F');
        if (deliveryEl) {
          const text = await deliveryEl.textContent();
          if (text.toLowerCase().includes('free')) {
            delivery = 'Free delivery';
          } else {
            delivery = cleanText(text);
          }
        }
        
        results.push({
          platform: 'flipkart',
          name,
          price,
          mrp,
          discount,
          delivery,
          url: productUrl,
          imageUrl
        });
      } catch (e) {
        console.error('Failed to parse Flipkart item:', e.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Flipkart scraping error:', error.message);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}
export default scrapeFlipkart;
