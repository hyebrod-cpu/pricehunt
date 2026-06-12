import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configure Playwright Extra with Stealth Plugin
chromium.use(stealthPlugin());

// Realistic User Agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
];

export function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay() {
  const ms = Math.floor(Math.random() * 2000) + 1000; // 1s to 3s
  return delay(ms);
}

export function parsePrice(priceStr) {
  if (!priceStr) return 0;
  // Remove currency symbols, commas, and whitespace
  const cleaned = priceStr.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

export function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Basic title similarity score (Jaccard similarity of words)
 */
export function getSimilarity(title1, title2) {
  const words1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Groups and deduplicates results based on name similarity.
 * For similar items, we keep them but can tag them. Or we can filter out identical names on the same platform.
 */
export function deduplicateResults(results) {
  const unique = [];
  const seen = new Set();

  for (const item of results) {
    const key = `${item.platform}-${item.name.toLowerCase().substring(0, 30)}-${item.price}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  return unique;
}

/**
 * High-fidelity Mock Data Generator based on search query
 */
export function generateMockData(query) {
  const q = query.toLowerCase();
  
  // Categorize query
  let category = 'electronics'; // default
  if (q.includes('milk') || q.includes('bread') || q.includes('butter') || q.includes('chips') || q.includes('grocery') || q.includes('coke') || q.includes('maggi') || q.includes('chocolate') || q.includes('biscuit') || q.includes('onion') || q.includes('potato') || q.includes('tomato')) {
    category = 'groceries';
  } else if (q.includes('shirt') || q.includes('tshirt') || q.includes('jeans') || q.includes('shoes') || q.includes('dress') || q.includes('saree') || q.includes('kurta') || q.includes('jacket')) {
    category = 'fashion';
  } else if (q.includes('cream') || q.includes('shampoo') || q.includes('soap') || q.includes('lipstick') || q.includes('perfume') || q.includes('lotion')) {
    category = 'beauty';
  } else if (q.includes('sofa') || q.includes('chair') || q.includes('table') || q.includes('bed') || q.includes('curtain') || q.includes('sheet') || q.includes('towel') || q.includes('clock')) {
    category = 'home';
  }

  const results = [];
  const status = {
    amazon: 'success',
    flipkart: 'success',
    meesho: 'success',
    blinkit: 'success',
    zepto: 'success',
    instamart: 'success'
  };

  // Capitalize query words for product names
  const capQuery = query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (category === 'groceries') {
    // Groceries are mainly on Quick Commerce. E-commerce platforms might not have them, or fail, or return sparse results.
    status.amazon = 'no_results';
    status.flipkart = 'no_results';
    status.meesho = 'no_results';

    // Blinkit Mock Results
    results.push({
      platform: 'blinkit',
      name: `${capQuery} - Fresh & Premium Pack`,
      price: 65,
      mrp: 75,
      discount: 13,
      delivery: 'Delivery in 10 mins • ₹15 delivery fee',
      url: 'https://blinkit.com/s/?q=' + encodeURIComponent(query),
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=60'
    });
    results.push({
      platform: 'blinkit',
      name: `${capQuery} - Family Pack Bundle`,
      price: 180,
      mrp: 210,
      discount: 14,
      delivery: 'Delivery in 10 mins • Free delivery',
      url: 'https://blinkit.com/s/?q=' + encodeURIComponent(query),
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=60'
    });

    // Zepto Mock Results
    results.push({
      platform: 'zepto',
      name: `Organic ${capQuery} (Selected Quality)`,
      price: 58,
      mrp: 70,
      discount: 17,
      delivery: 'Delivery in 8 mins • ₹20 delivery fee',
      url: 'https://zepto.com/search?query=' + encodeURIComponent(query),
      imageUrl: 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=150&auto=format&fit=crop&q=60'
    });
    results.push({
      platform: 'zepto',
      name: `${capQuery} (Standard Pack)`,
      price: 62,
      mrp: 65,
      discount: 5,
      delivery: 'Delivery in 8 mins • Free delivery',
      url: 'https://zepto.com/search?query=' + encodeURIComponent(query),
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=60'
    });

    // Instamart Mock Results
    results.push({
      platform: 'instamart',
      name: `Fresh ${capQuery} (Daily Essentials)`,
      price: 55,
      mrp: 68,
      discount: 19,
      delivery: 'Delivery in 12 mins • ₹19 delivery fee',
      url: 'https://www.swiggy.com/instamart/search?query=' + encodeURIComponent(query),
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=60'
    });
    results.push({
      platform: 'instamart',
      name: `Premium ${capQuery} Bottle Pack`,
      price: 120,
      mrp: 150,
      discount: 20,
      delivery: 'Delivery in 12 mins • Free delivery',
      url: 'https://www.swiggy.com/instamart/search?query=' + encodeURIComponent(query),
      imageUrl: 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=150&auto=format&fit=crop&q=60'
    });
  } else if (category === 'electronics') {
    // Electronics are mainly on E-commerce. Quick Commerce might fail or only show accessories.
    status.blinkit = 'no_results';
    status.zepto = 'no_results';
    status.instamart = 'no_results';

    let basePrice = 1499;
    let mrp = 3999;
    let img = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=60';

    if (q.includes('iphone') || q.includes('apple')) {
      basePrice = 72999;
      mrp = 79900;
      img = 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=150&auto=format&fit=crop&q=60';
    } else if (q.includes('watch') || q.includes('smartwatch')) {
      basePrice = 2499;
      mrp = 5999;
      img = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=60';
    } else if (q.includes('laptop') || q.includes('macbook')) {
      basePrice = 54990;
      mrp = 74990;
      img = 'https://images.unsplash.com/photo-1496181130204-7552cc14b1b0?w=150&auto=format&fit=crop&q=60';
    } else if (q.includes('boat') || q.includes('airdopes') || q.includes('earphones') || q.includes('wireless')) {
      basePrice = 1299;
      mrp = 2990;
      img = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150&auto=format&fit=crop&q=60';
    }

    // Amazon Mock Results
    results.push({
      platform: 'amazon',
      name: `${capQuery} with Active Noise Cancellation (ANC)`,
      price: basePrice,
      mrp: mrp,
      discount: Math.round(((mrp - basePrice) / mrp) * 100),
      delivery: 'Free delivery by Tomorrow',
      url: 'https://www.amazon.in/s?k=' + encodeURIComponent(query),
      imageUrl: img
    });
    results.push({
      platform: 'amazon',
      name: `Gen-2 ${capQuery} (Extended Battery Life)`,
      price: Math.round(basePrice * 1.1),
      mrp: Math.round(mrp * 1.05),
      discount: Math.round(((mrp * 1.05 - basePrice * 1.1) / (mrp * 1.05)) * 100),
      delivery: 'Free delivery for Prime members',
      url: 'https://www.amazon.in/s?k=' + encodeURIComponent(query),
      imageUrl: img
    });

    // Flipkart Mock Results
    results.push({
      platform: 'flipkart',
      name: `${capQuery} (Latest Model)`,
      price: Math.round(basePrice * 0.96), // 4% cheaper!
      mrp: mrp,
      discount: Math.round(((mrp - basePrice * 0.96) / mrp) * 100),
      delivery: 'Free delivery',
      url: 'https://www.flipkart.com/search?q=' + encodeURIComponent(query),
      imageUrl: img
    });
    results.push({
      platform: 'flipkart',
      name: `${capQuery} Special Edition - Midnight Black`,
      price: Math.round(basePrice * 1.02),
      mrp: Math.round(mrp * 1.1),
      discount: Math.round(((mrp * 1.1 - basePrice * 1.02) / (mrp * 1.1)) * 100),
      delivery: 'Free delivery in 2 Days',
      url: 'https://www.flipkart.com/search?q=' + encodeURIComponent(query),
      imageUrl: img
    });

    // Meesho Mock Results
    results.push({
      platform: 'meesho',
      name: `Premium Quality ${capQuery}`,
      price: Math.round(basePrice * 0.88), // Super cheap but maybe generic
      mrp: Math.round(mrp * 0.7),
      discount: Math.round(((mrp * 0.7 - basePrice * 0.88) / (mrp * 0.7)) * 100),
      delivery: 'Free Delivery • Cash on Delivery available',
      url: 'https://www.meesho.com/search?q=' + encodeURIComponent(query),
      imageUrl: img
    });
  } else {
    // Fashion / Beauty / Home - Available on both e-commerce and some quick commerce
    let basePrice = 499;
    let mrp = 1299;
    let img = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=60';

    if (category === 'fashion') {
      img = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&auto=format&fit=crop&q=60';
    } else if (category === 'beauty') {
      img = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=150&auto=format&fit=crop&q=60';
      // Quick commerce has beauty
      status.blinkit = 'success';
      status.zepto = 'success';
      status.instamart = 'success';
    } else if (category === 'home') {
      img = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=150&auto=format&fit=crop&q=60';
    }

    // E-commerce results
    results.push({
      platform: 'amazon',
      name: `Trendy ${capQuery} for Men & Women`,
      price: basePrice,
      mrp: mrp,
      discount: Math.round(((mrp - basePrice) / mrp) * 100),
      delivery: 'Free delivery by Sunday',
      url: 'https://www.amazon.in/s?k=' + encodeURIComponent(query),
      imageUrl: img
    });

    results.push({
      platform: 'flipkart',
      name: `Designer Series ${capQuery}`,
      price: Math.round(basePrice * 0.9),
      mrp: mrp,
      discount: Math.round(((mrp - basePrice * 0.9) / mrp) * 100),
      delivery: 'Free delivery',
      url: 'https://www.flipkart.com/search?q=' + encodeURIComponent(query),
      imageUrl: img
    });

    results.push({
      platform: 'meesho',
      name: `Affordable ${capQuery} Combo Pack`,
      price: Math.round(basePrice * 0.75),
      mrp: Math.round(mrp * 0.8),
      discount: Math.round(((mrp * 0.8 - basePrice * 0.75) / (mrp * 0.8)) * 100),
      delivery: 'Free Delivery',
      url: 'https://www.meesho.com/search?q=' + encodeURIComponent(query),
      imageUrl: img
    });

    if (category === 'beauty') {
      results.push({
        platform: 'blinkit',
        name: `Daily Glow ${capQuery}`,
        price: basePrice * 1.1,
        mrp: mrp,
        discount: Math.round(((mrp - basePrice * 1.1) / mrp) * 100),
        delivery: 'Delivery in 10 mins',
        url: 'https://blinkit.com/s/?q=' + encodeURIComponent(query),
        imageUrl: img
      });
      results.push({
        platform: 'zepto',
        name: `Natural Care ${capQuery}`,
        price: basePrice * 1.05,
        mrp: mrp,
        discount: Math.round(((mrp - basePrice * 1.05) / mrp) * 100),
        delivery: 'Delivery in 8 mins',
        url: 'https://zepto.com/search?query=' + encodeURIComponent(query),
        imageUrl: img
      });
    }
  }

  // Tag all as mocked
  Object.keys(status).forEach(k => {
    if (status[k] === 'success') {
      status[k] = 'mocked';
    }
  });

  return {
    results: results.sort((a, b) => a.price - b.price),
    status,
    isMocked: true
  };
}

/**
 * Shared Launch Config for Playwright
 */
export async function getBrowserContext() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--use-fake-ui-for-media-stream',
      '--window-size=1280,720'
    ]
  });

  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1280, height: 720 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata'
  });

  // Extra stealth scripts
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  return { browser, context };
}
