#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer-core');

const TARGET_URL = 'https://styxmarket.com/shop/my/';
const DEFAULT_EXCEL_PATH = 'D:\\gemini\\Telegram-shop-main\\Telegram-shop-main\\test script\\mega_full_report1.xlsx';
const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), 'styxmarket_files');
const DEFAULT_REMOTE_URL = 'http://127.0.0.1:9222';

function printUsage() {
  console.log(`Styxmarket upload automation\n\nUsage:\n  node scripts/styxmarketUploader.js [excelPath] [outputDir]\n\nOptions:\n  --excel <path>           Path to the Excel workbook with products.\n  --output <path>          Directory where generated txt files should be stored.\n  --chrome <url>           Remote debugging URL for an already running Chrome (e.g. http://127.0.0.1:9222).\n  --ws-endpoint <url>      Full WebSocket debugger URL. If provided, overrides --chrome.\n  --help                   Show this help message.\n\nEnvironment variables:\n  STYX_EXCEL_PATH          Alternative way to provide the Excel path.\n  STYX_OUTPUT_DIR          Alternative way to provide the output directory.\n  CHROME_REMOTE_URL        Remote debugging URL for Chrome.\n  CHROME_WS_ENDPOINT       Full WebSocket debugger URL.\n`);
}

function parseArgs(argv) {
  const options = {
    excelPath: process.env.STYX_EXCEL_PATH || DEFAULT_EXCEL_PATH,
    outputDir: process.env.STYX_OUTPUT_DIR || DEFAULT_OUTPUT_DIR,
    remoteUrl: process.env.CHROME_REMOTE_URL || null,
    wsEndpoint: process.env.CHROME_WS_ENDPOINT || null,
  };

  let positionalCount = 0;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      case '--excel':
        if (i + 1 >= argv.length) {
          throw new Error('Missing value for --excel');
        }
        options.excelPath = argv[++i];
        break;
      case '--output':
        if (i + 1 >= argv.length) {
          throw new Error('Missing value for --output');
        }
        options.outputDir = argv[++i];
        break;
      case '--chrome':
        if (i + 1 >= argv.length) {
          throw new Error('Missing value for --chrome');
        }
        options.remoteUrl = argv[++i];
        break;
      case '--ws-endpoint':
        if (i + 1 >= argv.length) {
          throw new Error('Missing value for --ws-endpoint');
        }
        options.wsEndpoint = argv[++i];
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`Unknown option: ${arg}`);
        } else if (positionalCount === 0) {
          options.excelPath = arg;
          positionalCount += 1;
        } else if (positionalCount === 1) {
          options.outputDir = arg;
          positionalCount += 1;
        } else {
          console.warn(`Ignoring unexpected argument: ${arg}`);
        }
        break;
    }
  }

  options.outputDir = path.resolve(options.outputDir);
  if (!options.remoteUrl && !options.wsEndpoint) {
    options.remoteUrl = DEFAULT_REMOTE_URL;
  }

  return options;
}

function normalizeRow(row) {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    if (!key) return;
    const normalizedKey = key.toString().trim().toLowerCase();
    normalized[normalizedKey] = value;
  });
  return normalized;
}

function readFirstProduct(excelPath) {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath, { cellDates: true });
  if (!workbook.SheetNames.length) {
    throw new Error('Excel workbook does not contain any sheets.');
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (!rows.length) {
    throw new Error('Excel sheet does not contain any data rows.');
  }

  const normalized = normalizeRow(rows[0]);
  const name = (normalized['file name'] ?? '').toString().trim();
  const description = (normalized['textarea'] ?? '').toString();
  const priceRaw = normalized.price ?? normalized['price'];
  const link = (normalized.link ?? normalized['link'] ?? '').toString().trim();

  if (!name) {
    throw new Error("'file name' column is empty for the first product.");
  }

  if (!link) {
    throw new Error("'link' column is empty for the first product.");
  }

  if (priceRaw === undefined || priceRaw === null || priceRaw === '') {
    throw new Error("'Price' column is empty for the first product.");
  }

  const price = typeof priceRaw === 'number' ? priceRaw.toString() : priceRaw.toString().trim();
  if (!price) {
    throw new Error("'Price' column is empty for the first product.");
  }

  return {
    index: normalized['№ п/п'] ?? normalized['№п/п'] ?? '',
    name,
    description,
    price,
    link,
  };
}

function sanitizeFileName(name) {
  return name
    .toString()
    .trim()
    .replace(/[\s]+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 120) || `product_${Date.now()}`;
}

function ensureUniqueFilePath(directory, baseName) {
  let attempt = 0;
  let candidate = path.join(directory, `${baseName}.txt`);
  while (fs.existsSync(candidate)) {
    attempt += 1;
    candidate = path.join(directory, `${baseName}_${attempt}.txt`);
  }
  return candidate;
}

function createProductFile(product, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const baseName = sanitizeFileName(product.name);
  const filePath = ensureUniqueFilePath(outputDir, baseName);
  fs.writeFileSync(filePath, `${product.link}\n`, 'utf8');
  return filePath;
}

function buildVersionUrl(baseUrl) {
  try {
    const url = new URL(baseUrl);
    if (url.protocol.startsWith('ws')) {
      return baseUrl;
    }
    if (!url.pathname || url.pathname === '/' || url.pathname === '') {
      url.pathname = '/json/version';
    } else if (!url.pathname.endsWith('/json/version')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/json/version`;
    }
    return url.toString();
  } catch (error) {
    throw new Error(`Invalid Chrome remote debugging URL: ${baseUrl}`);
  }
}

function fetchJson(url) {
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.get(url, (response) => {
      if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
        reject(new Error(`Failed to fetch ${url}: status ${response.statusCode}`));
        response.resume();
        return;
      }
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse JSON from ${url}: ${err.message}`));
        }
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Failed to request ${url}: ${error.message}`));
    });
  });
}

async function resolveWsEndpoint(options) {
  if (options.wsEndpoint) {
    return options.wsEndpoint;
  }

  if (!options.remoteUrl) {
    throw new Error('Chrome remote debugging URL is not provided. Use --chrome or set CHROME_REMOTE_URL.');
  }

  const versionUrl = buildVersionUrl(options.remoteUrl);
  const versionData = await fetchJson(versionUrl);
  if (!versionData.webSocketDebuggerUrl) {
    throw new Error(`Chrome at ${options.remoteUrl} did not return a webSocketDebuggerUrl.`);
  }

  return versionData.webSocketDebuggerUrl;
}

async function setFieldValue(page, selector, value) {
  const elementHandle = await page.waitForSelector(selector, { visible: true });
  const textValue = value === undefined || value === null ? '' : value.toString();
  await elementHandle.evaluate((el, newValue) => {
    el.focus();
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.value = newValue;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, textValue);
}

async function selectRadio(page, selector) {
  const radio = await page.waitForSelector(selector, { visible: true });
  const isChecked = await radio.evaluate((el) => el.checked);
  if (!isChecked) {
    await radio.click({ delay: 50 });
  }
}

async function submitForm(page) {
  const selectors = [
    'button[type="submit"]',
    'button.submit',
    'button.btn-primary',
    'input[type="submit"]',
  ];

  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (handle) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null),
        handle.click(),
      ]);
      return;
    }
  }

  throw new Error('Failed to locate the submit button on the page.');
}

async function waitForUploadSuccess(page) {
  const successSelectors = [
    '.alert-success',
    '.alert.alert-success',
    '.notification-success',
    '.notice.success',
    '.toast-success',
    '.woocommerce-message',
    '.v-alert.success',
  ];
  const selector = successSelectors.join(', ');
  try {
    await page.waitForSelector(selector, { timeout: 30000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function uploadProduct(product, wsEndpoint) {
  console.log('[Styxmarket] Launching automation sequence...');
  const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(45000);
    page.setDefaultNavigationTimeout(45000);

    console.log(`[Styxmarket] Navigating to ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    console.log('[Styxmarket] Filling product form fields');
    await setFieldValue(page, 'input[name="name"]', product.name);
    await setFieldValue(page, 'input[name="price"]', product.price);
    await setFieldValue(page, 'textarea[name="description"]', product.description);

    console.log('[Styxmarket] Selecting category and availability');
    await selectRadio(page, 'input[type="radio"][value="11"]');
    await selectRadio(page, 'input[name="availability"][value="now"]');

    console.log(`[Styxmarket] Uploading asset file from ${product.assetPath}`);
    const fileInput = await page.waitForSelector('input[type="file"]', { visible: true });
    await fileInput.uploadFile(product.assetPath);

    console.log('[Styxmarket] Submitting the product form');
    await submitForm(page);

    const success = await waitForUploadSuccess(page);
    if (success) {
      console.log('[Styxmarket] Product upload succeeded (success message detected).');
    } else {
      console.warn('[Styxmarket] Could not confirm success message. Please verify the upload status manually.');
    }
  } finally {
    await page.close({ runBeforeUnload: false }).catch(() => {});
    await browser.disconnect();
  }
}

(async () => {
  try {
    const options = parseArgs(process.argv);
    console.log(`[Styxmarket] Using Excel file: ${options.excelPath}`);
    console.log(`[Styxmarket] Output directory: ${options.outputDir}`);

    const product = readFirstProduct(options.excelPath);
    console.log(`[Styxmarket] Preparing product: ${product.name}`);

    const assetPath = createProductFile(product, options.outputDir);
    product.assetPath = assetPath;
    console.log(`[Styxmarket] Asset file created at: ${assetPath}`);

    const wsEndpoint = await resolveWsEndpoint(options);
    console.log(`[Styxmarket] Connecting to Chrome via: ${wsEndpoint}`);

    await uploadProduct(product, wsEndpoint);
    console.log('[Styxmarket] Automation finished.');
  } catch (error) {
    console.error('[Styxmarket] Automation failed:', error);
    process.exitCode = 1;
  }
})();
