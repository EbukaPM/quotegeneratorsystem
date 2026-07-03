const puppeteer = require('puppeteer');
const { buildQuotationHtml, buildProposalHtml } = require('../templates/quotationTemplate');

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
}

async function renderHtmlToPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    });
    return pdfBuffer;
  } finally {
    await page.close();
  }
}

function renderQuotationPdf(quotation, job) {
  return renderHtmlToPdf(buildQuotationHtml(quotation, job));
}

function renderProposalPdf(job, quotations) {
  return renderHtmlToPdf(buildProposalHtml(job, quotations));
}

async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

module.exports = { renderQuotationPdf, renderProposalPdf, closeBrowser };
