// ═══════════════════════════════════════════════════════════════
//  ARTA DECOR — FEATURES.JS
//  1) Backup Excel  2) Backup PDF  3) Njoftime  4) Fatura PDF
// ═══════════════════════════════════════════════════════════════

// ── 1. BACKUP EXCEL ─────────────────────────────────────────────
function exportExcel() {
  if (!window.XLSX) { toast('Libraria Excel nuk u ngarkua!', 'error'); return; }
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rezervimet / Dekoracionet
  const decorRows = [
    ['Klienti', 'Lloji i Eventit', 'Data', 'Vendndodhja', 'Çmimi (€)', 'Përgjegjësi', 'Statusi', 'Shënime'],
    ...state.decors.map(d => [
      d.client, d.type, d.date, d.location || '—',
      Number(d.price), d.worker || '—', d.status, d.notes || ''
    ])
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(decorRows);
  ws1['!cols'] = [22, 16, 12, 22, 12, 20, 16, 32].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws1, 'Rezervimet');

  // Sheet 2: Financat (hyrje + dalje të bashkuara)
  const allTrans = [
    ...state.incomes.map(i  => ['✅ Hyrje',  i.desc,  Number(i.amount),  i.date]),
    ...state.expenses.map(e => ['❌ Dalje',  e.desc,  Number(e.amount),  e.date])
  ].sort((a, b) => (b[3] || '') > (a[3] || '') ? 1 : -1);

  const totalInc = state.incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExp = state.expenses.reduce((s, e) => s + Number(e.amount), 0);

  const finRows = [
    ['Lloji', 'Përshkrimi', 'Shuma (€)', 'Data'],
    ...allTrans,
    [],
    ['', 'TOTALI TË ARDHURA (€)', totalInc, ''],
    ['', 'TOTALI SHPENZIME (€)',  totalExp, ''],
    ['', 'BALANCA / FITIMI (€)',  totalInc - totalExp, '']
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(finRows);
  ws2['!cols'] = [14, 34, 14, 12].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws2, 'Financat');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ArtaDecor_Backup_${dateStr}.xlsx`);
  toast('Excel u shkarkua me sukses! 📊', 'success');
}

// ── 2. BACKUP PDF ────────────────────────────────────────────────
function exportPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) { toast('Libraria PDF nuk u ngarkua!', 'error'); return; }
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W    = 210;
  const GOLD = [201, 168, 76];
  const DARK = [30, 26, 20];
  const MUTE = [120, 115, 105];
  const GRN  = [8, 80, 65];
  const RED  = [163, 0, 0];

  function pageHeader(subtitle) {
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, W, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('ARTA DECOR', 14, 11);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(subtitle, W - 14, 11, { align: 'right' });
    doc.setTextColor(...DARK);
  }

  function sectionBar(text, y) {
    doc.setFillColor(...GOLD);
    doc.rect(14, y, W - 28, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(text, 16, y + 5);
    doc.setTextColor(...DARK);
    return y + 10;
  }

  const dateLabel = new Date().toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' });

  // ─── FAQJA 1: REZERVIMET ───
  pageHeader('Rezervimet & Evente — ' + dateLabel);
  let y = 24;
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTE);
  doc.text('Raport i gjeneruar automatikisht nga Arta Decor Management System', 14, y); y += 7;
  y = sectionBar('LISTA E REZERVIMEVE', y);

  const dCols  = ['Klienti', 'Lloji', 'Data', 'Vendndodhja', 'Çmimi', 'Statusi'];
  const dWidths = [44, 24, 22, 36, 20, 24];
  let x = 14;
  doc.setFillColor(245, 240, 225);
  doc.rect(14, y - 1, W - 28, 7, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
  dCols.forEach((h, i) => { doc.text(h, x + 1, y + 4); x += dWidths[i]; });
  y += 8;

  doc.setFont('helvetica', 'normal');
  state.decors.forEach((d, idx) => {
    if (y > 272) { doc.addPage(); pageHeader('Rezervimet (vazh.)'); y = 24; }
    if (idx % 2 === 0) { doc.setFillColor(252, 250, 245); doc.rect(14, y - 1, W - 28, 6.5, 'F'); }
    x = 14;
    const statusClr = d.status === 'Përfunduar' ? GRN : d.status === 'Në Pritje' ? [133, 100, 4] : DARK;
    const cols = [d.client, d.type, d.date, d.location || '—', `${Number(d.price).toLocaleString()} €`, d.status];
    cols.forEach((c, i) => {
      doc.setTextColor(...(i === 5 ? statusClr : DARK));
      doc.text(String(c).substring(0, i === 3 ? 20 : 24), x + 1, y + 4);
      x += dWidths[i];
    });
    y += 7;
  });
  if (!state.decors.length) { doc.setTextColor(...MUTE); doc.text('Asnjë rezervim.', 14, y + 4); }

  // ─── FAQJA 2: FINANCAT ───
  doc.addPage();
  pageHeader('Raporti Financiar — ' + dateLabel);
  y = 24;

  const totalInc = state.incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExp = state.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance  = totalInc - totalExp;

  // Summary boxes
  [
    ['Të Ardhura Totale', `${totalInc.toLocaleString()} €`, GRN],
    ['Shpenzime Totale',  `${totalExp.toLocaleString()} €`, RED],
    ['Balanca (Fitimi)',  `${balance.toLocaleString()} €`,  balance >= 0 ? GRN : RED]
  ].forEach(([label, val, clr], i) => {
    const bx = 14 + i * 62;
    doc.setFillColor(245, 240, 225);
    doc.rect(bx, y, 58, 18, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTE);
    doc.text(label, bx + 4, y + 6);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...clr);
    doc.text(val, bx + 4, y + 14);
  });
  y += 26;

  y = sectionBar('TË GJITHA TRANSAKSIONET', y);

  const tCols  = ['Lloji', 'Përshkrimi', 'Shuma (€)', 'Data'];
  const tWidths = [18, 102, 28, 26];
  x = 14;
  doc.setFillColor(245, 240, 225);
  doc.rect(14, y - 1, W - 28, 7, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
  tCols.forEach((h, i) => { doc.text(h, x + 1, y + 4); x += tWidths[i]; });
  y += 8;

  const allTrans = [
    ...state.incomes.map(i  => ({ type: 'Hyrje', desc: i.desc,  amount: i.amount,  date: i.date,  isInc: true  })),
    ...state.expenses.map(e => ({ type: 'Dalje', desc: e.desc, amount: e.amount, date: e.date, isInc: false }))
  ].sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);

  doc.setFont('helvetica', 'normal');
  allTrans.forEach((t, idx) => {
    if (y > 272) { doc.addPage(); pageHeader('Financat (vazh.)'); y = 24; }
    if (idx % 2 === 0) { doc.setFillColor(252, 250, 245); doc.rect(14, y - 1, W - 28, 6.5, 'F'); }
    x = 14;
    doc.setTextColor(...(t.isInc ? GRN : RED)); doc.text(t.type, x + 1, y + 4); x += tWidths[0];
    doc.setTextColor(...DARK); doc.text(String(t.desc).substring(0, 52), x + 1, y + 4); x += tWidths[1];
    doc.setTextColor(...(t.isInc ? GRN : RED)); doc.text(`${t.isInc ? '+' : '-'}${Number(t.amount).toLocaleString()} €`, x + 1, y + 4); x += tWidths[2];
    doc.setTextColor(...MUTE); doc.text(t.date || '—', x + 1, y + 4);
    y += 7;
  });
  if (!allTrans.length) { doc.setTextColor(...MUTE); doc.text('Asnjë transaksion.', 14, y + 4); }

  const fileDateStr = new Date().toISOString().slice(0, 10);
  doc.save(`ArtaDecor_Backup_${fileDateStr}.pdf`);
  toast('PDF u shkarkua me sukses! 📄', 'success');
}

// ── 3. NJOFTIME PËR EVENTE ──────────────────────────────────────
function checkEventNotifications() {
  if (!state.decors || !state.decors.length) {
    toast('Nuk ka evente të regjistruara.', '');
    return;
  }

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const DAYS     = [1, 3, 7];
  const shown    = JSON.parse(localStorage.getItem('artadecor_notif_shown') || '{}');
  const newShown = { ...shown };
  const notifs   = [];

  state.decors.forEach(d => {
    if (d.status === 'Përfunduar') return;
    const evDate   = new Date(d.date + 'T00:00:00');
    const diffDays = Math.round((evDate - today) / 86400000);

    // Sot
    if (diffDays === 0 && !shown[`${d.id}_0`]) {
      notifs.push({ decor: d, days: 0 });
      newShown[`${d.id}_0`] = true;
    }
    // 1, 3, 7 ditë para
    DAYS.forEach(n => {
      if (diffDays === n && !shown[`${d.id}_${n}`]) {
        notifs.push({ decor: d, days: n });
        newShown[`${d.id}_${n}`] = true;
      }
    });
  });

  localStorage.setItem('artadecor_notif_shown', JSON.stringify(newShown));

  // Dot i kuq mbi zile
  const dot = document.getElementById('notif-bell-dot');
  if (dot) dot.style.display = notifs.length ? 'block' : 'none';

  if (notifs.length) {
    showNotificationPanel(notifs);
  } else {
    toast('Nuk ka njoftime të reja për sot! ✅', 'success');
  }
}

function showNotificationPanel(notifs) {
  const old = document.getElementById('notif-panel');
  if (old) old.remove();

  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.style.cssText = [
    'position:fixed', 'top:20px', 'right:20px', 'z-index:9999',
    'background:#fff', 'border:1px solid var(--gold-mid)',
    'border-left:4px solid var(--gold)', 'border-radius:10px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.15)', 'min-width:320px',
    'max-width:380px', 'animation:slideInRight 0.3s ease', 'overflow:hidden'
  ].join(';');

  const items = notifs.map(({ decor: d, days }) => {
    const label = days === 0 ? '🔴 SOT është eventi!'
                : days === 1 ? '🟡 Nesër ka event!'
                : `🟢 ${days} ditë deri te eventi`;
    return `<div style="padding:10px 16px;border-bottom:1px solid var(--bg3,#F0EDE4)">
      <div style="font-weight:600;font-size:13px;color:#1A1915">${d.client} — ${d.type}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${label} • ${d.date} • ${d.location || 'Pa vendndodhje'}</div>
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div style="background:var(--gold,#C9A84C);padding:10px 16px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:700;color:#fff;font-size:13px">🔔 Njoftime Eventesh (${notifs.length})</span>
      <button onclick="document.getElementById('notif-panel').remove()" style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer">✕</button>
    </div>
    ${items}
    <div style="padding:10px 16px;text-align:right">
      <button onclick="switchTab('calendar');document.getElementById('notif-panel').remove();"
        style="background:var(--gold,#C9A84C);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;font-weight:600">
        Shiko Kalendarin →
      </button>
    </div>`;

  document.body.appendChild(panel);
  setTimeout(() => { if (panel.parentNode) panel.remove(); }, 12000);
}

// Stili i animacionit
(function () {
  if (document.getElementById('feat-styles')) return;
  const s = document.createElement('style');
  s.id = 'feat-styles';
  s.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    #notif-bell-dot {
      position:absolute; top:2px; right:2px;
      width:8px; height:8px; border-radius:50%;
      background:#A30000; display:none; pointer-events:none;
    }
  `;
  document.head.appendChild(s);
})();

// ── 4. FATURA PDF ────────────────────────────────────────────────
function generateInvoice(decorId) {
  if (!window.jspdf || !window.jspdf.jsPDF) { toast('Libraria PDF nuk u ngarkua!', 'error'); return; }
  const d = state.decors.find(x => x.id === decorId);
  if (!d) { toast('Rezervimi nuk u gjet!', 'error'); return; }

  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W    = 210;
  const GOLD = [201, 168, 76];
  const DARK = [30, 26, 20];
  const MUTE = [120, 115, 105];
  const GRN  = [8, 80, 65];
  const WHT  = [255, 255, 255];

  const now       = new Date();
  const invoiceNo = `F-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${d.id.slice(-3).toUpperCase()}`;
  const issuedLbl = now.toLocaleDateString('sq-AL', { day:'numeric', month:'long', year:'numeric' });
  const eventLbl  = new Date(d.date + 'T12:00:00').toLocaleDateString('sq-AL', { day:'numeric', month:'long', year:'numeric' });

  // ── HEADER ──
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(...WHT);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('ARTA DECOR', 14, 17);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
  doc.text('Studio e Dekorimit & Eventeve Profesionale', 14, 24);
  doc.text('Tel: +383 XX XXX XXX  |  artadecor@email.com', 14, 30);

  doc.setFontSize(26); doc.setFont('helvetica', 'bold');
  doc.text('FATURË', W - 14, 18, { align: 'right' });
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
  doc.text(`Nr. ${invoiceNo}`, W - 14, 26, { align: 'right' });
  doc.text(`Lëshuar: ${issuedLbl}`, W - 14, 32, { align: 'right' });

  let y = 48;

  // ── INFO KLIENTIT & EVENTIT ──
  doc.setFillColor(248, 244, 232);
  doc.rect(14, y, 85, 35, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MUTE);
  doc.text('FATURUAR PËR:', 18, y + 8);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
  doc.text(d.client, 18, y + 17);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTE);
  doc.text(`Lloji: ${d.type}`, 18, y + 24);
  doc.text(`Data e Eventit: ${eventLbl}`, 18, y + 30);

  doc.setFillColor(248, 244, 232);
  doc.rect(111, y, 85, 35, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MUTE);
  doc.text('DETAJET E EVENTIT:', 115, y + 8);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
  doc.text(`Vendndodhja: ${d.location || '—'}`, 115, y + 17);
  doc.text(`Koordinatori: ${d.worker || 'Pa caktuar'}`, 115, y + 24);
  doc.text(`Statusi: ${d.status}`, 115, y + 30);

  y += 45;

  // ── TABELA E SHËRBIMEVE ──
  doc.setFillColor(...GOLD);
  doc.rect(14, y, W - 28, 9, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHT);
  doc.text('PËRSHKRIMI I SHËRBIMIT', 18, y + 6);
  doc.text('SASIA', 125, y + 6);
  doc.text('ÇMIMI', 149, y + 6);
  doc.text('TOTALI', 194, y + 6, { align: 'right' });
  y += 12;

  doc.setFillColor(252, 250, 245);
  doc.rect(14, y - 1, W - 28, 10, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
  doc.text(`Dekorim Profesional — ${d.type}`, 18, y + 6);
  doc.text('1', 128, y + 6);
  doc.text(`${Number(d.price).toLocaleString()} €`, 149, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Number(d.price).toLocaleString()} €`, 194, y + 6, { align: 'right' });
  y += 14;

  // Shënime
  if (d.notes) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTE);
    const lines = doc.splitTextToSize(`Shënime: ${d.notes}`, W - 32);
    lines.forEach(line => { doc.text(line, 18, y); y += 5.5; });
    y += 4;
  }

  // ── TOTALI ──
  y += 6;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
  doc.line(115, y, W - 14, y); y += 6;

  [['Nëntotali:', `${Number(d.price).toLocaleString()} €`],
   ['TVSH (0%):', '0.00 €']
  ].forEach(([lbl, val]) => {
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...MUTE);
    doc.text(lbl, 148, y); doc.text(val, 194, y, { align:'right' }); y += 7;
  });

  doc.setFillColor(...GOLD);
  doc.rect(113, y - 2, W - 127, 12, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHT);
  doc.text('TOTALI:', 117, y + 6);
  doc.text(`${Number(d.price).toLocaleString()} €`, 194, y + 6, { align: 'right' });
  y += 20;

  // ── STATUSI I PAGESËS ──
  const statusColor = d.status === 'Përfunduar' ? GRN : [133, 100, 4];
  doc.setFillColor(...statusColor);
  doc.rect(14, y, 60, 10, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHT);
  doc.text(`● ${d.status === 'Përfunduar' ? 'E PAGUAR' : 'NË PRITJE TË PAGESËS'}`, 17, y + 7);

  // ── FOOTER ──
  const fY = 275;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
  doc.line(14, fY, W - 14, fY);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTE);
  doc.text('Faleminderit që zgjodhët Arta Decor! Çdo event i juaji, kreacia jonë.', W / 2, fY + 5, { align: 'center' });
  doc.setTextColor(...GOLD);
  doc.text('ARTA DECOR  •  artadecor@email.com  •  +383 XX XXX XXX', W / 2, fY + 10, { align: 'center' });

  doc.save(`Fatura_${d.client.replace(/\s+/g, '_')}_${invoiceNo}.pdf`);
  toast(`Fatura u gjenerua për ${d.client}! 📄`, 'success');
}

// ── SHTIMI I BUTONIT TË FATURËS NË TABELËN E DEKORACIONEVE ─────
// Kjo funksion thirret nga app.js kur renderohet tabela e dekoracioneve
// Shto në fund të çdo rreshti të tabelës butonin "Faturë"
function patchDecorsTable() {
  const tbody = document.getElementById('decors-table-body');
  if (!tbody) return;

  // Vëzhgo ndryshime në tbody (kur renderohet nga app.js)
  const obs = new MutationObserver(() => {
    tbody.querySelectorAll('tr').forEach(row => {
      // Mos shto dy herë
      if (row.querySelector('.inv-btn')) return;
      // Merr ID e dekorit nga butoni i parë edit/delete nëse ekziston
      const editBtn = row.querySelector('button[onclick*="openDecorModal"]');
      if (!editBtn) return;
      const match = editBtn.getAttribute('onclick').match(/'([^']+)'/);
      if (!match) return;
      const decorId = match[1];

      const td = document.createElement('td');
      td.innerHTML = `<button class="btn btn-sm btn-outline inv-btn" onclick="generateInvoice('${decorId}')" style="color:var(--gold-dark);border-color:var(--gold-dark);white-space:nowrap">📄 Faturë</button>`;
      row.appendChild(td);
    });
  });

  obs.observe(tbody, { childList: true, subtree: true });
}

// ── AUTO-NJOFTIME KUR HAPET APLIKACIONI ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Patch tabelën e dekoracioneve pasi DOM është gati
  setTimeout(patchDecorsTable, 500);

  // Wrap showApp për të thirrur njoftime
  const origShowApp = window.showApp;
  if (typeof origShowApp === 'function') {
    window.showApp = function () {
      origShowApp.apply(this, arguments);
      setTimeout(() => {
        patchDecorsTable();
        // Kontrollo njoftimet automatikisht vetëm herën e parë
        const lastCheck = localStorage.getItem('artadecor_last_notif_check');
        const today     = new Date().toISOString().slice(0, 10);
        if (lastCheck !== today) {
          localStorage.setItem('artadecor_last_notif_check', today);
          checkEventNotifications();
        }
      }, 800);
    };
  }
});
