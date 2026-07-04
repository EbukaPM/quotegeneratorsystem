const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getCompanyProfile, updateCompanyProfile } = require('../services/companyService');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  res.json(getCompanyProfile());
});

router.put('/', authenticate, authorize('admin', 'manager'), (req, res) => {
  const {
    name,
    regNumber,
    addressLines,
    email,
    phone,
    whoWeAre,
    mission,
    vision,
    productsIntro,
    productsNote,
    productsList,
    productPhotoDataUri,
  } = req.body;

  const updated = updateCompanyProfile({
    name,
    regNumber,
    addressLines,
    email,
    phone,
    whoWeAre,
    mission,
    vision,
    productsIntro,
    productsNote,
    productsList,
    productPhotoDataUri,
  });

  res.json(updated);
});

module.exports = router;
