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
  console.error('❌ Mungojnë variablat në .env (SUPABASE_URL, SUPABASE_KEY, API_SECRET)');
  process.exit(1);
}
 
const supabaseHeaders = {
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type':  'application/json'
};
 
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));
 
// 🔒 Mbrojtja e të gjitha rrugëve /api/*
app.use('/api', (req, res, next) => {
  const token = req.headers['x-api-secret'];
  if (!token || token !== API_SECRET) {
    return res.status(403).json({ error: 'Akses i ndaluar' });
  }
  next();
});
 
// ── GET /api/state ──────────────────────────────────────────
app.get('/api/state', async (req, res) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/state?key=eq.main&select=value`,
      { headers: supabaseHeaders }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      res.json(JSON.parse(data[0].value));
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('Gabim GET:', err.message);
    res.status(500).json({ error: err.message });
  }
});
 
// ── POST /api/state ─────────────────────────────────────────
// Hash-on fjalëkalimet para se t'i ruajmë
app.post('/api/state', async (req, res) => {
  try {
    const stateData = req.body;
 
    // Hash fjalëkalimin e adminit nëse është tekst i thjeshtë
    if (stateData.adminPassword && !stateData.adminPassword.startsWith('$2b$')) {
      stateData.adminPassword = await bcrypt.hash(stateData.adminPassword, SALT_ROUNDS);
    }
 
    // Hash fjalëkalimet e punëtorëve nëse janë tekst i thjeshtë
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
 
    if (!response.ok) {
      const errText = await response.text();
      console.error('Gabim Supabase POST:', errText);
      return res.status(500).json({ error: errText });
    }
 
    // Kthe state-in me fjalëkalimet e hash-uara që app.js ta përditësojë
    res.json({ ok: true, state: stateData });
  } catch (err) {
    console.error('Gabim POST:', err.message);
    res.status(500).json({ error: err.message });
  }
});
 
// ── POST /api/login ─────────────────────────────────────────
// Verifikim i sigurt i fjalëkalimit me bcrypt
app.post('/api/login', async (req, res) => {
  try {
    const { type, password, username, workerId } = req.body;
 
    // Ngarko state nga Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/state?key=eq.main&select=value`,
      { headers: supabaseHeaders }
    );
    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(401).json({ ok: false, error: 'Nuk u gjet state' });
    }
 
    const stateData = JSON.parse(data[0].value);
 
    if (type === 'admin') {
      if (username !== stateData.adminUsername) {
        return res.json({ ok: false, error: 'Emri i përdoruesit është i gabuar!' });
      }
      const match = await bcrypt.compare(password, stateData.adminPassword);
      if (!match) {
        return res.json({ ok: false, error: 'Fjalëkalimi i gabuar!' });
      }
      return res.json({ ok: true, user: { name: 'Arta (Admin)', role: 'Super Admin', access: 'admin' } });
 
    } else {
      const worker = stateData.workers.find(w => w.id === workerId);
      if (!worker) {
        return res.json({ ok: false, error: 'Punëtori nuk u gjet!' });
      }
      const match = await bcrypt.compare(password, worker.password);
      if (!match) {
        return res.json({ ok: false, error: 'Fjalëkalimi i gabuar!' });
      }
      return res.json({ ok: true, user: { name: worker.name, role: worker.role, access: worker.access || 'worker', workerId: worker.id } });
    }
  } catch (err) {
    console.error('Gabim LOGIN:', err.message);
    res.status(500).json({ error: err.message });
  }
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Arta Decor: http://localhost:${PORT}`);
});
 