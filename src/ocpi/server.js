import express from 'express';
import crypto from 'crypto';

const router = express.Router();

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
    versions: `https://${req.get('host')}/versions`
  });
});

router.get('/versions', (req, res) => {
  const host = req.get('host');
  console.log('🔍 Host from request:', host);
  console.log('🔍 Full URL:', `https://${host}/details`);
  res.json({
    status_code: 1000,
    status_message: 'Success',
    timestamp: new Date().toISOString(),
    data: [
      {
        version: '2.2.1',
        url: `https://${host}/details`
      }
    ]
  });
});

router.get('/details', (req, res) => {
  res.json({
    status_code: 1000,
    status_message: 'Success',
    timestamp: new Date().toISOString(),
    data: {
      version: '2.2.1',
      endpoints: [
        { identifier: 'credentials', role: 'RECEIVER', url: `https://${req.get('host')}/credentials` },
        { identifier: 'locations', role: 'SENDER', url: `https://${req.get('host')}/locations` },
        { identifier: 'tariffs', role: 'SENDER', url: `https://${req.get('host')}/tariffs` }
      ]
    }
  });
});

router.post('/credentials', async (req, res) => {
  try {
    console.log('🔥 POST /credentials received:', JSON.stringify(req.body, null, 2));
    
    const { token, url, roles } = req.body;

    const expectedToken = process.env.OCPI_TOKEN_A_NEW;
    console.log('🔑 Expected token:', expectedToken ? 'set' : 'MISSING');
    
    if (!expectedToken) {
      console.error('❌ OCPI_TOKEN_A environment variable is not set');
      return res.status(500).json({
        status_code: 5000,
        status_message: 'Server configuration error: OCPI_TOKEN_A not set',
        timestamp: new Date().toISOString()
      });
    }

    if (!token) {
      console.error('❌ No token provided in request');
      return res.status(400).json({
        status_code: 2001,
        status_message: 'Missing token in request',
        timestamp: new Date().toISOString()
      });
    }

    if (token !== expectedToken) {
      console.error('❌ Invalid token provided');
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }

    tokenC = crypto.randomBytes(48).toString('base64');
    console.log('✅ Token C generated successfully');

    res.json({
      status_code: 1000,
      status_message: 'Success',
      timestamp: new Date().toISOString(),
      data: {
        token: tokenC,
        url: `https://${req.get('host')}/versions`,
        roles: [{
          role: 'EMSP',
          party_id: OUR_PARTY.party_id,
          country_code: OUR_PARTY.country_code,
          business_details: OUR_PARTY.business_details
        }]
      }
    });
  } catch (error) {
    console.error('❌ POST /credentials error:', error);
    res.status(500).json({
      status_code: 5000,
      status_message: 'Internal server error: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/locations', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 GET /locations auth:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || authHeader !== `Token ${tokenC}`) {
      console.warn('⚠️ Unauthorized GET /locations attempt');
      return res.status(401).json({ 
        status_code: 2001, 
        status_message: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status_code: 1000,
      status_message: 'Success',
      timestamp: new Date().toISOString(),
      data: []
    });
  } catch (error) {
    console.error('❌ GET /locations error:', error);
    res.status(500).json({
      status_code: 5000,
      status_message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/tariffs', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔍 GET /tariffs auth:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || authHeader !== `Token ${tokenC}`) {
      console.warn('⚠️ Unauthorized GET /tariffs attempt');
      return res.status(401).json({ 
        status_code: 2001, 
        status_message: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status_code: 1000,
      status_message: 'Success',
      timestamp: new Date().toISOString(),
      data: []
    });
  } catch (error) {
    console.error('❌ GET /tariffs error:', error);
    res.status(500).json({
      status_code: 5000,
      status_message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

console.log('🔥 OCPI Router loaded!');

export default router;

export { router };
