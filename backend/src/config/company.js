const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'templates', 'assets', 'safebox-logo.svg');
const productPhotoPath = path.join(__dirname, '..', 'templates', 'assets', 'product-photo.jpeg');

const logoDataUri = `data:image/svg+xml;base64,${fs.readFileSync(logoPath).toString('base64')}`;
const productPhotoDataUri = fs.existsSync(productPhotoPath)
  ? `data:image/jpeg;base64,${fs.readFileSync(productPhotoPath).toString('base64')}`
  : null;

module.exports = {
  name: process.env.COMPANY_NAME || 'SAFEBOX ENERGY',
  regNumber: process.env.COMPANY_REG_NUMBER || 'BN3253116',
  addressLines: (process.env.COMPANY_ADDRESS_LINES || 'Edo State Head Office,|Edo Innovation Hub|59, I.C.E. Road, Benin City.').split('|'),
  email: process.env.COMPANY_EMAIL || 'solutionsafebox@gmail.com',
  phone: process.env.COMPANY_PHONE || '08135651507',
  brandColor: process.env.COMPANY_BRAND_COLOR || '#8DC63F',
  brandColorLight: process.env.COMPANY_BRAND_COLOR_LIGHT || '#EAF3DC',
  logoDataUri,
  productPhotoDataUri,
  whoWeAre:
    process.env.COMPANY_WHO_WE_ARE ||
    'We are a team of energy experts who provide reliable, affordable and convenient solar energy solutions to cater to the power needs of homes, businesses and other organizations.',
  mission:
    process.env.COMPANY_MISSION ||
    'To provide clean and efficient power alongside the convenience that follows.',
  vision:
    process.env.COMPANY_VISION ||
    'To create clean energy products and systems which will be the answer to power needs.',
  productsIntro:
    process.env.COMPANY_PRODUCTS_INTRO ||
    'SAFEBOX Energy manufactures solar generators which are designed with different capacities to suit the specific needs of our different customers. SAFEBOX designs solar generators to meet the needs of each customer by auditing for the potential client’s power load and determining the most suitable generator for the customer’s needs, while taking their financial capacity into careful consideration.',
  productsNote:
    process.env.COMPANY_PRODUCTS_NOTE ||
    'Our services include energy provision and consultancy for homes and businesses. As a company based on renewable energy, our company limits the use of non-renewable energy which is not environmentally-friendly.',
  productsList: (process.env.COMPANY_PRODUCTS_LIST ||
    'System Installation|Energy Consultancy|System monitoring and maintenance|Inverter manufacturing|System Design and construction').split('|'),
};
