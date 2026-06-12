import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeAmazon } from './scrapers/amazon_scraper.js';
import { scrapeFlipkart } from './scrapers/flipkart_scraper.js';
import { scrapeMeesho } from './scrapers/meesho_scraper.js';
import { scrapeBlinkit } from './scrapers/blinkit_scraper.js';
import { scrapeZepto } from './scrapers/zepto_scraper.js';
import { scrapeInstamart } from './scrapers/instamart_scraper.js';
import { generateMockData, deduplicateResults } from './scrapers/utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const SCRAPER_TIMEOUT = 15000; // 15 seconds timeout

// Helper to run scrapers with timeout
const runScraperWithTimeout = (scrapeFn, platform, query) => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`[Timeout] ${platform} scraper exceeded ${SCRAPER_TIMEOUT}ms`);
      resolve({ platform, status: 'failed', results: [] });
    }, SCRAPER_TIMEOUT);

    scrapeFn(query)
      .then((results) => {
        clearTimeout(timer);
        resolve({
          platform,
          status: results.length > 0 ? 'success' : 'no_results',
          results
        });
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error(`[Error] ${platform} scraper failed:`, err.message);
        resolve({ platform, status: 'failed', results: [] });
      });
  });
};

app.get('/api/compare', async (req, res) => {
  const query = req.query.q;
  const forceMock = req.query.mock === 'true' || process.env.USE_MOCK === 'true';

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const cleanQuery = query.trim();

  // If mock mode is active, return generated mock data
  if (forceMock) {
    console.log(`[Mock Mode] Returning mock data for query: "${cleanQuery}"`);
    const mockResponse = generateMockData(cleanQuery);
    return res.json(mockResponse);
  }

  console.log(`[Live Mode] Running parallel scrapers for query: "${cleanQuery}"`);

  // Execute all 6 scrapers in parallel
  const scrapePromises = [
    runScraperWithTimeout(scrapeAmazon, 'amazon', cleanQuery),
    runScraperWithTimeout(scrapeFlipkart, 'flipkart', cleanQuery),
    runScraperWithTimeout(scrapeMeesho, 'meesho', cleanQuery),
    runScraperWithTimeout(scrapeBlinkit, 'blinkit', cleanQuery),
    runScraperWithTimeout(scrapeZepto, 'zepto', cleanQuery),
    runScraperWithTimeout(scrapeInstamart, 'instamart', cleanQuery)
  ];

  try {
    const scraperOutputs = await Promise.all(scrapePromises);

    const mergedResults = [];
    const statusMap = {};

    scraperOutputs.forEach((output) => {
      statusMap[output.platform] = output.status;
      if (output.results && output.results.length > 0) {
        mergedResults.push(...output.results);
      }
    });

    // Deduplicate and sort results by price ascending
    const dedupedResults = deduplicateResults(mergedResults);
    const sortedResults = dedupedResults.sort((a, b) => a.price - b.price);

    res.json({
      results: sortedResults,
      status: statusMap,
      isMocked: false
    });
  } catch (err) {
    console.error('[Fatal Error] Comparing failed:', err.message);
    res.status(500).json({
      error: 'An internal server error occurred while processing prices',
      details: err.message
    });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve the frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`PriceHunt backend server running on port ${PORT}`);
});
export default app;
