const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./index');

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@safeboxenergy.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SafeboxAdmin@2026';
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(uuid(), 'Super Admin', email, passwordHash, 'admin');
    console.log('----------------------------------------------------');
    console.log(' Seeded super admin account:');
    console.log(`   email:    ${email}`);
    console.log(`   password: ${password}`);
    console.log(' Change this password after first login.');
    console.log('----------------------------------------------------');
  }

  const itemCount = db.prepare('SELECT COUNT(*) AS c FROM items').get().c;
  if (itemCount === 0) {
    const catalog = [
      ['Solar Panel 450W Mono', 'Solar', 145000],
      ['Lithium Battery 5kWh', 'Storage', 850000],
      ['Hybrid Inverter 5kVA', 'Inverter', 620000],
      ['Charge Controller MPPT 60A', 'Controller', 95000],
      ['Mounting Structure (per panel)', 'Accessories', 18000],
      ['DC Cable (per meter)', 'Cabling', 1200],
      ['AC Cable (per meter)', 'Cabling', 1500],
      ['Installation & Commissioning', 'Labour', 100000],
    ];
    const insert = db.prepare(
      'INSERT INTO items (id, name, category, default_unit_cost) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction((rows) => {
      for (const [name, category, cost] of rows) {
        insert.run(uuid(), name, category, cost);
      }
    });
    insertMany(catalog);
    console.log('Seeded default item catalog.');
  }

  // eslint-disable-next-line global-require
  require('../services/companyService').getCompanyProfile();
}

seed();
