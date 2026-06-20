require('dotenv').config();

const fetch   = require('node-fetch');
const express = require('express');
const bcrypt  = require('bcrypt');
const path    = require('path');

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const API_SECRET   = process.env.API_SECRET;
const SALT_ROUNDS  = 10;

if (!SUPABASE_URL || !SUPABASE_KEY || !API_SECRET) {
  console.error('Mungojne variablat ne .env');
  process.exit(1);
}

const supabaseHeaders = {
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type':  'application/json'
};

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.use('/api', (req, res, next) => {
  const token = req.headers['x-api-secret'];
  if (!token || token !== API_SECRET) {
    return res.status(403).json({ error: 'Akses i ndaluar' });
  }
  next();
});

app.get('/api/state', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/state?key=eq.main&select=value`, { headers: supabaseHeaders });
    const data = await response.json();
    if (data && data.length > 0) { res.json(JSON.parse(data[0].value)); } else { res.json({}); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/state', async (req, res) => {
  try {
    const stateData = req.body;
    if (stateData.adminPassword && !stateData.adminPassword.startsWith('$2b$')) {
      stateData.adminPassword = await bcrypt.hash(stateData.adminPassword, SALT_ROUNDS);
    }
    if (Array.isArray(stateData.workers)) {
      for (const worker of stateData.workers) {
        if (worker.password && !worker.password.startsWith('$2b$')) {
          worker.password = await bcrypt.hash(worker.password, SALT_ROUNDS);
        }
      }
    }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/state`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'main', value: JSON.stringify(stateData) })
    });
    if (!response.ok) { const errText = await response.text(); return res.status(500).json({ error: errText }); }
    res.json({ ok: true, state: stateData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { type, password, username, workerId } = req.body;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/state?key=eq.main&select=value`, { headers: supabaseHeaders });
    const data = await response.json();
    if (!data || data.length === 0) { return res.status(401).json({ ok: false, error: 'Nuk u gjet state' }); }
    const stateData = JSON.parse(data[0].value);
    if (type === 'admin') {
      if (username !== stateData.adminUsername) { return res.json({ ok: false, error: 'Emri i gabuar!' }); }
      const match = await bcrypt.compare(password, stateData.adminPassword);
      if (!match) { return res.json({ ok: false, error: 'Fjalekalimi i gabuar!' }); }
      return res.json({ ok: true, user: { name: 'Arta (Admin)', role: 'Super Admin', access: 'admin' } });
    } else {
      const worker = stateData.workers.find(w => w.id === workerId);
      if (!worker) { return res.json({ ok: false, error: 'Punetori nuk u gjet!' }); }
      const match = await bcrypt.compare(password, worker.password);
      if (!match) { return res.json({ ok: false, error: 'Fjalekalimi i gabuar!' }); }
      return res.json({ ok: true, user: { name: worker.name, role: worker.role, access: worker.access || 'worker', workerId: worker.id } });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = app;
