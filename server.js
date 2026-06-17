const fetch = require('node-fetch');
const express = require('express');
const path = require('path');

const app = express();

const SUPABASE_URL = 'https://edfqdywrizdtmcdtswek.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ca3vjadORNxM3RB06Gyf1w_b7oOusG0';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/api/state', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/state?key=eq.main&select=value`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      res.json(JSON.parse(data[0].value));
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/state', async (req, res) => {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/state`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key: 'main', value: JSON.stringify(req.body) })
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Arta Decor: http://localhost:${PORT}`);
});