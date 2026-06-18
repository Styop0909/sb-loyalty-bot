const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const OUR_PARTY = {
  country_code: 'AM',
  party_id: 'TUK',
  role: 'EMSP',
  business_details: {
    name: 'TuTak',
    website: 'https://t.me/TuTak_Official_Bot'
  }
};

let tokenC = null;
router.get('/', (req, res) => {
  res.json({
    status_code: 1000,
    status_message: 'OCPI Server is running',
    timestamp: new Date().toISOString(),
    versions: `https://${req.get('host')}/ocpi/versions`
  });
});
router.get('/versions', (req, res) => {
  res.json({
    status_code: 1000,
    status_message: 'Success',
    timestamp: new Date().toISOString(),
    data: [
      {
        version: '2.2.1',
        url: `https://${req.get('host')}/ocpi/2.2.1/details`
      }
    ]
  });
});

router.get('/2.2.1/details', (req, res) => {
  res.json({
    status_code: 1000,
    status_message: 'Success',
    timestamp: new Date().toISOString(),
    data: {
      version: '2.2.1',
      endpoints: [
        { identifier: 'credentials', role: 'RECEIVER', url: `https://${req.get('host')}/ocpi/2.2.1/credentials` },
        { identifier: 'locations', role: 'SENDER', url: `https://${req.get('host')}/ocpi/2.2.1/locations` },
        { identifier: 'tariffs', role: 'SENDER', url: `https://${req.get('host')}/ocpi/2.2.1/tariffs` }
      ]
    }
  });
});

router.post('/2.2.1/credentials', async (req, res) => {
  const { token, url, roles } = req.body;

  const expectedToken = process.env.OCPI_TOKEN_A;
  if (token !== expectedToken) {
    return res.status(401).json({
      status_code: 2001,
      status_message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  tokenC = crypto.randomBytes(48).toString('base64');

  res.json({
    status_code: 1000,
    status_message: 'Success',
    timestamp: new Date().toISOString(),
    data: {
      token: tokenC,
      url: `https://${req.get('host')}/ocpi/versions`,
      roles: [{
        role: 'EMSP',
        party_id: OUR_PARTY.party_id,
        country_code: OUR_PARTY.country_code,
        business_details: OUR_PARTY.business_details
      }]
    }
  });
});

router.get('/2.2.1/locations', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Token ${tokenC}`) {
    return res.status(401).json({ status_code: 2001, status_message: 'Unauthorized' });
  }

  res.json({
    status_code: 1000,
    status_message: 'Success',
    timestamp: new Date().toISOString(),
    data: []
  });
});

router.get('/2.2.1/tariffs', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Token ${tokenC}`) {
    return res.status(401).json({ status_code: 2001, status_message: 'Unauthorized' });
  }

  res.json({
    status_code: 1000,
    status_message: 'Success',
    timestamp: new Date().toISOString(),
    data: []
  });
});

module.exports = router;
