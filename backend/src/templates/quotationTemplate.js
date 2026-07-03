const company = require('../config/company');

const currency = process.env.CURRENCY_SYMBOL || '₦';

function formatMoney(value) {
  const number = Number(value || 0);
  return `${currency}${Math.round(number).toLocaleString()}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

const baseStyles = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    margin: 0;
    font-size: 12px;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    position: relative;
    padding: 14mm 14mm 0;
    page-break-after: always;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .page-header img.logo { width: 46px; height: 46px; }
  .page-header .address-block {
    text-align: right;
    font-size: 10.5px;
    line-height: 1.5;
    color: #1a1a1a;
  }
  .page-header .address-block .reg-number { font-weight: 700; }
  .page-footer {
    background: ${company.brandColor};
    color: #fff;
    display: flex;
    justify-content: space-between;
    padding: 8px 14mm;
    font-size: 10.5px;
    font-weight: 600;
    margin: auto -14mm 0;
  }
  .content { flex: 1; }
  .option-table td {
    border: 1px solid #000;
    padding: 6px 8px;
    font-size: 11px;
  }
  .option-table tr.zebra {
    background: ${company.brandColorLight};
  }
`;

function pageHeader() {
  return `
  <div class="page-header">
    <img class="logo" src="${company.logoDataUri}" alt="${escapeHtml(company.name)} logo" />
    <div class="address-block">
      ${company.addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
      <div class="reg-number">${escapeHtml(company.regNumber)}</div>
    </div>
  </div>`;
}

function pageFooter() {
  return `
  <div class="page-footer">
    <span>Email: ${escapeHtml(company.email)}</span>
    <span>Phone: ${escapeHtml(company.phone)}</span>
  </div>`;
}

function buildCoverPageHtml() {
  return `
  <div class="page cover-page" style="align-items: center; justify-content: center; text-align: center;">
    <img src="${company.logoDataUri}" alt="logo" style="width: 220px; height: 220px; margin-bottom: 48px;" />
    <h1 style="font-size: 24px; margin: 0;">${escapeHtml(company.name)}</h1>
    <p style="font-weight: 700; margin: 4px 0 24px;">${escapeHtml(company.regNumber)}</p>
    <div style="font-size: 13px; line-height: 1.8;">
      ${company.addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
    </div>
  </div>`;
}

function buildProfilePageHtml() {
  return `
  <div class="page">
    ${pageHeader()}
    <div class="content">
      <h2 style="text-align: center; color: ${company.brandColor}; font-size: 18px;">Who We Are</h2>
      <p style="text-align: center; max-width: 640px; margin: 0 auto 24px; font-size: 11.5px; line-height: 1.7;">
        ${escapeHtml(company.whoWeAre)}
      </p>

      <div style="display: flex; gap: 32px; margin-bottom: 24px;">
        <div style="flex: 1; text-align: center;">
          <h3 style="color: ${company.brandColor}; font-size: 13px;">Our Mission</h3>
          <p style="font-size: 11px; line-height: 1.6;">${escapeHtml(company.mission)}</p>
        </div>
        <div style="flex: 1; text-align: center;">
          <h3 style="color: ${company.brandColor}; font-size: 13px;">Our Vision</h3>
          <p style="font-size: 11px; line-height: 1.6;">${escapeHtml(company.vision)}</p>
        </div>
      </div>

      <h2 style="text-align: center; color: ${company.brandColor}; font-size: 18px;">Our Products And Services</h2>
      <div style="display: flex; gap: 24px; align-items: flex-start;">
        <div style="flex: 1;">
          <p style="font-size: 11px; line-height: 1.7;">${escapeHtml(company.productsIntro)}</p>
          <p style="font-size: 11px; line-height: 1.7;">${escapeHtml(company.productsNote)}</p>
          <p style="font-size: 11px; margin-top: 12px;">Company Products and Services also include:</p>
          <ul style="font-size: 11px; line-height: 1.7;">
            ${company.productsList.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
        ${
          company.productPhotoDataUri
            ? `<img src="${company.productPhotoDataUri}" alt="product" style="width: 160px; object-fit: contain;" />`
            : ''
        }
      </div>
    </div>
    ${pageFooter()}
  </div>`;
}

function buildOptionPageHtml(quotation, job) {
  const rows = quotation.items
    .map(
      (item, index) => `
        <tr class="${index % 2 === 1 ? 'zebra' : ''}">
          <td class="sn">${item.sn}.</td>
          <td class="item-name">${escapeHtml(item.name)}</td>
          <td class="qty">${escapeHtml(item.quantity_label || item.quantity || '')}</td>
        </tr>`
    )
    .join('');

  const powerLines = (quotation.power_description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const splitAt = Math.ceil(powerLines.length / 2);
  const colOne = powerLines.slice(0, splitAt);
  const colTwo = powerLines.slice(splitAt);

  const optionTitle = quotation.title || `OPTION ${quotation.option_number}: SOLAR SYSTEM SET UP`;

  return `
  <div class="page">
    ${pageHeader()}
    <div class="content">
      <div style="text-align: center; margin-bottom: 14px;">
        <span style="display: inline-block; background: ${company.brandColor}; color: #000; font-weight: 700; font-size: 13px; padding: 6px 22px;">
          ${escapeHtml(optionTitle.toUpperCase())}
        </span>
      </div>

      <table class="option-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 6px 8px; text-align: left; width: 50px;">S/N</th>
            <th style="border: 1px solid #000; padding: 6px 8px; text-align: left;">ITEM</th>
            <th style="border: 1px solid #000; padding: 6px 8px; text-align: left; width: 100px;">QUANTITY</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="background: ${company.brandColor}; color: #fff; text-align: center; font-weight: 800; font-size: 18px; padding: 12px; margin: 18px 0;">
        TOTAL: ${formatMoney(quotation.grand_total)}
      </div>

      ${
        powerLines.length
          ? `<div>
              <p style="font-size: 11.5px; margin-bottom: 8px;">This option will power:</p>
              <div style="display: flex; gap: 40px;">
                <ul style="flex: 1; font-size: 11px; font-weight: 700; line-height: 1.7; margin: 0; padding-left: 18px;">
                  ${colOne.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
                </ul>
                <ul style="flex: 1; font-size: 11px; font-weight: 700; line-height: 1.7; margin: 0; padding-left: 18px;">
                  ${colTwo.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
                </ul>
              </div>
            </div>`
          : ''
      }
    </div>
    ${pageFooter()}
  </div>`;
}

function wrapHtmlDocument(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${baseStyles}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function buildQuotationHtml(quotation, job) {
  return wrapHtmlDocument(buildOptionPageHtml(quotation, job));
}

function buildProposalHtml(job, quotations) {
  const pages = [buildCoverPageHtml(), buildProfilePageHtml(), ...quotations.map((q) => buildOptionPageHtml(q, job))];
  return wrapHtmlDocument(pages.join('\n'));
}

module.exports = { buildQuotationHtml, buildProposalHtml, formatMoney };
