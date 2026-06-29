const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('OCPI Server is running');
});

app.get('/versions', (req, res) => {
  res.json({
    status_code: 1000,
    data: [
      { version: '2.2.1', url: `https://${req.get('host')}/details` }
    ]
  });
});

app.get('/details', (req, res) => {
  res.json({
    status_code: 1000,
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

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ OCPI Server running on port ${port}`);
});
