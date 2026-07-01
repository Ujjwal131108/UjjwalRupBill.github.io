// Domain lock
(function() {
  const allowed = ['ujjwal131108.github.io'];
  const host = window.location.hostname;
  if (!allowed.includes(host)) {
    document.body.innerHTML = '<h2 style="text-align:center;margin-top:20vh;font-family:sans-serif;">This tool only works at ujjwal131108.github.io</h2>';
    throw new Error('Unauthorized domain');
  }
})();

let downloadCount = 0;
let invoiceData = {};

// ── Load data from localStorage ──
function loadInvoiceData() {
  const savedData = localStorage.getItem('invoiceData');
  if (savedData) {
    const data = JSON.parse(savedData);
    invoiceData = {
      invoiceNum: data.invoiceNum || 'INV-001',
      from: data.from || '',
      fromGst: data.fromGst || '',
      fromContact: data.fromContact || '',
      to: data.to || '',
      toGst: data.toGst || '',
      date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
      dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN') : '',
      currency: data.currency || '₹',
      gstRate: data.gstRate || 0,
      notes: data.notes || '',
      items: data.items || []
    };
  } else {
    invoiceData = {
      invoiceNum: 'INV-001',
      from: 'Your Business Name',
      fromGst: '27AABCU9603R1ZX',
      fromContact: 'business@example.com',
      to: 'Client Name',
      toGst: '22AAAAA0000A1Z5',
      date: new Date().toLocaleDateString('en-IN'),
      dueDate: new Date(Date.now() + 15*24*60*60*1000).toLocaleDateString('en-IN'),
      currency: '₹',
      gstRate: 18,
      notes: 'Please pay within 15 days via bank transfer or UPI.',
      items: [
        { desc: 'Web Development', qty: 1, rate: 10000 },
        { desc: 'UI/UX Design', qty: 1, rate: 5000 },
        { desc: 'Hosting Setup', qty: 1, rate: 2000 }
      ]
    };
  }

  // Calculate totals
  let subtotal = 0;
  invoiceData.items.forEach(item => {
    subtotal += (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
  });
  invoiceData.subtotal = subtotal;
  invoiceData.gstAmount = invoiceData.gstRate > 0 ? subtotal * (invoiceData.gstRate / 100) : 0;
  invoiceData.total = subtotal + invoiceData.gstAmount;

  updateInvoiceDisplay();
}

// ── Update invoice display ──
function updateInvoiceDisplay() {
  const cur = invoiceData.currency || '₹';

  const invoiceNumEl = document.querySelector('.invoice-num');
  if (invoiceNumEl) invoiceNumEl.textContent = `#${invoiceData.invoiceNum}`;

  const invDate = document.getElementById('invDate');
  if (invDate) invDate.textContent = invoiceData.date;

  const dueDate = document.getElementById('dueDate');
  if (dueDate) dueDate.textContent = invoiceData.dueDate;

  const sections = document.querySelectorAll('.invoice-section');

  if (sections[0]) {
    sections[0].innerHTML = `
      <div class="section-label">From</div>
      <div class="section-content">
        <strong>${invoiceData.from}</strong><br>
        ${invoiceData.fromContact ? `Contact: ${invoiceData.fromContact}<br>` : ''}
        ${invoiceData.fromGst ? `GST: ${invoiceData.fromGst}` : ''}
      </div>`;
  }

  if (sections[1]) {
    sections[1].innerHTML = `
      <div class="section-label">Bill To</div>
      <div class="section-content">
        <strong>${invoiceData.to}</strong><br>
        ${invoiceData.toGst ? `GST: ${invoiceData.toGst}` : ''}
      </div>`;
  }

  const tbody = document.querySelector('.invoice-table tbody');
  if (tbody) {
    let html = '';
    invoiceData.items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const amount = qty * rate;
      html += `<tr>
        <td>${item.desc || ''}</td>
        <td>${qty}</td>
        <td>${cur}${rate.toLocaleString('en-IN')}</td>
        <td>${cur}${amount.toLocaleString('en-IN')}</td>
      </tr>`;
    });

    html += `<tr class="total-row"><td colspan="3" style="text-align:right;">Subtotal</td><td>${cur}${invoiceData.subtotal.toLocaleString('en-IN')}</td></tr>`;
    if (invoiceData.gstRate > 0) {
      html += `<tr class="total-row"><td colspan="3" style="text-align:right;">GST (${invoiceData.gstRate}%)</td><td>${cur}${invoiceData.gstAmount.toLocaleString('en-IN')}</td></tr>`;
    }
    html += `<tr class="total-row"><td colspan="3" style="text-align:right;">Total Amount Due</td><td>${cur}${invoiceData.total.toLocaleString('en-IN')}</td></tr>`;
    tbody.innerHTML = html;
  }

  if (sections[3] && invoiceData.notes) {
    sections[3].innerHTML = `
      <div class="section-label">Notes</div>
      <div class="section-content">${invoiceData.notes.replace(/\n/g, '<br>')}</div>`;
  }
}

// ── Button listeners ──
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', async function() {
    const format = this.dataset.format;
    if (format) await handleDownload(format, this);
  });
});

async function handleDownload(format, btn) {
  const originalHTML = btn.innerHTML;
  try {
    btn.disabled = true;
    btn.innerHTML = `<span>Processing...</span>`;

    switch(format) {
      case 'pdf':   await downloadAsPDF(); break;
      case 'word':  await downloadAsWord(); break;
      case 'excel': await downloadAsExcel(); break;
      case 'txt':   await downloadAsText(); break;
    }

    btn.innerHTML = `<span>✓ Downloaded!</span>`;
    downloadCount++;
    const counter = document.getElementById('counter');
    if (counter) counter.textContent = downloadCount;

    showFeedback(`✓ Downloaded as ${format.toUpperCase()}!`, 'success');
    setTimeout(() => { btn.disabled = false; btn.innerHTML = originalHTML; }, 2000);

  } catch (error) {
    console.error('Download failed:', error);
    btn.innerHTML = `<span>✗ Failed</span>`;
    showFeedback(`✗ Failed to download as ${format.toUpperCase()}`, 'error');
    setTimeout(() => { btn.disabled = false; btn.innerHTML = originalHTML; }, 2000);
  }
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = `feedback show ${type}`;
  setTimeout(() => feedback.classList.remove('show'), 3000);
}

// ── PDF Download (using jsPDF directly - no html2pdf) ──
async function downloadAsPDF() {
  const d = invoiceData;
  const cur = d.currency || '₹';
  // jsPDF can't render ₹ — use Rs. as fallback
  const sym = (cur === '₹' || cur === 'INR') ? 'Rs.' : cur;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const green = [116, 183, 46];
  const dark  = [20, 20, 20];
  const white = [255, 255, 255];
  const gray  = [245, 245, 245];
  const textGray = [80, 80, 80];

  const L = 15, R = 195, W = R - L;
  let y = 15;

  // Header bar
  doc.setFillColor(...dark);
  doc.rect(L, y, W, 16, 'F');
  doc.setTextColor(...green);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', L + 5, y + 11);
  doc.setTextColor(...gray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${d.invoiceNum}`, R - 5, y + 11, { align: 'right' });
  y += 24;

  // Info section - draw each column independently
  const boxH = 36;
  const colW = W / 3;

  // Backgrounds
  doc.setFillColor(245, 245, 245);
  doc.rect(L,          y, colW, boxH, 'F');
  doc.setFillColor(238, 238, 238);
  doc.rect(L + colW,   y, colW, boxH, 'F');
  doc.setFillColor(245, 245, 245);
  doc.rect(L + colW*2, y, colW, boxH, 'F');

  // --- FROM ---
  const x1 = L + 4;
  doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...green);
  doc.text('FROM', x1, y + 6);
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...dark);
  doc.text(String(d.from||'').substring(0,20), x1, y + 13);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...textGray);
  let fy = y + 19;
  if (d.fromContact) { doc.text(String(d.fromContact).substring(0,24), x1, fy); fy += 5; }
  if (d.fromGst)     { doc.text('GST: '+String(d.fromGst).substring(0,18), x1, fy); }

  // --- BILL TO ---
  const x2 = L + colW + 4;
  doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...green);
  doc.text('BILL TO', x2, y + 6);
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...dark);
  doc.text(String(d.to||'').substring(0,20), x2, y + 13);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...textGray);
  if (d.toGst) { doc.text('GST: '+String(d.toGst).substring(0,18), x2, y + 19); }

  // --- DATES ---
  const x3 = L + colW*2 + 4;
  doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...green);
  doc.text('DATES', x3, y + 6);
  doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(...dark);
  doc.text('Invoice: ' + d.date, x3, y + 13);
  doc.setTextColor(...textGray);
  doc.text('Due:     ' + d.dueDate, x3, y + 19);

  y += boxH + 6;

  // Green divider
  doc.setDrawColor(...green);
  doc.setLineWidth(0.5);
  doc.line(L, y, R, y);
  y += 8;

  // Table header
  doc.setFillColor(...green);
  doc.rect(L, y, W, 9, 'F');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', L + 3, y + 6);
  doc.text('Qty', 135, y + 6, { align: 'center' });
  doc.text('Rate', 162, y + 6, { align: 'right' });
  doc.text('Amount', R - 3, y + 6, { align: 'right' });
  y += 11;

  // Items - skip empty rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const validItems = d.items.filter(item => item.desc || parseFloat(item.rate) > 0);
  validItems.forEach((item, i) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const amount = qty * rate;
    if (i % 2 === 0) {
      doc.setFillColor(...gray);
      doc.rect(L, y - 5, W, 8, 'F');
    }
    doc.setTextColor(...dark);
    doc.text(String(item.desc || ''), L + 3, y);
    doc.text(String(qty), 135, y, { align: 'center' });
    doc.setTextColor(...textGray);
    doc.text(sym + rate.toLocaleString('en-IN'), 162, y, { align: 'right' });
    doc.setTextColor(...dark);
    doc.text(sym + amount.toLocaleString('en-IN'), R - 3, y, { align: 'right' });
    y += 8;
  });

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(L, y, R, y);
  y += 6;

  // Subtotal
  doc.setTextColor(...textGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal', R - 40, y);
  doc.setTextColor(...dark);
  doc.text(sym + d.subtotal.toLocaleString('en-IN'), R - 3, y, { align: 'right' });
  y += 7;

  // GST
  if (d.gstRate > 0) {
    doc.setTextColor(...textGray);
    doc.text(`GST (${d.gstRate}%)`, R - 40, y);
    doc.setTextColor(...dark);
    doc.text(sym + d.gstAmount.toLocaleString('en-IN'), R - 3, y, { align: 'right' });
    y += 7;
  }

  // Total bar
  doc.setFillColor(...green);
  doc.rect(L, y - 4, W, 10, 'F');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL AMOUNT DUE', L + 4, y + 3);
  doc.text(sym + d.total.toLocaleString('en-IN'), R - 3, y + 3, { align: 'right' });
  y += 16;

  // Notes
  if (d.notes) {
    doc.setFillColor(240, 248, 232);
    const noteLines = doc.splitTextToSize(d.notes, W - 10);
    const noteH = noteLines.length * 5 + 10;
    doc.rect(L, y, W, noteH, 'F');
    doc.setTextColor(...green);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NOTES', L + 4, y + 6);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'normal');
    doc.text(noteLines, L + 4, y + 12);
  }

  doc.save(`invoice-${d.invoiceNum}.pdf`);
}

// ── Word Download ──
function downloadAsWord() {
  return new Promise((resolve) => {
    const d = invoiceData;
    const cur = d.currency || '₹';
    const html = `<html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;padding:30px;color:#222;}
      h1{color:#74B72E;} table{width:100%;border-collapse:collapse;margin-top:16px;}
      th{background:#74B72E;color:#fff;padding:8px;text-align:left;}
      td{border:1px solid #ddd;padding:8px;}
      .label{color:#74B72E;font-weight:bold;margin-top:12px;}
    </style></head><body>
      <h1>INVOICE #${d.invoiceNum}</h1>
      <p class="label">FROM</p><p><b>${d.from}</b>${d.fromContact?'<br>'+d.fromContact:''}${d.fromGst?'<br>GST: '+d.fromGst:''}</p>
      <p class="label">BILL TO</p><p><b>${d.to}</b>${d.toGst?'<br>GST: '+d.toGst:''}</p>
      <p>Invoice Date: ${d.date} &nbsp;|&nbsp; Due Date: ${d.dueDate}</p>
      <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
      ${d.items.map(item=>{const a=(+item.qty||0)*(+item.rate||0);return`<tr><td>${item.desc||''}</td><td>${item.qty}</td><td>${cur}${(+item.rate||0).toLocaleString('en-IN')}</td><td>${cur}${a.toLocaleString('en-IN')}</td></tr>`;}).join('')}
      <tr><td colspan="3" style="text-align:right"><b>Subtotal</b></td><td>${cur}${d.subtotal.toLocaleString('en-IN')}</td></tr>
      ${d.gstRate>0?`<tr><td colspan="3" style="text-align:right"><b>GST (${d.gstRate}%)</b></td><td>${cur}${d.gstAmount.toLocaleString('en-IN')}</td></tr>`:''}
      <tr style="background:#74B72E;color:#fff"><td colspan="3" style="text-align:right"><b>TOTAL</b></td><td><b>${cur}${d.total.toLocaleString('en-IN')}</b></td></tr>
      </tbody></table>
      ${d.notes?`<p class="label">NOTES</p><p>${d.notes.replace(/\n/g,'<br>')}</p>`:''}
    </body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `invoice-${d.invoiceNum}.doc`;
    a.click();
    resolve();
  });
}

// ── Excel Download ──
function downloadAsExcel() {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') { reject('XLSX missing'); return; }
    const d = invoiceData;
    const data = [
      [`INVOICE #${d.invoiceNum}`], [],
      ['FROM', d.from], d.fromContact?['Contact', d.fromContact]:null,
      d.fromGst?['GST', d.fromGst]:null, [],
      ['BILL TO', d.to], d.toGst?['GST', d.toGst]:null, [],
      ['Invoice Date', d.date], ['Due Date', d.dueDate], [],
      ['Description', 'Qty', 'Rate', 'Amount'],
      ...d.items.map(item => {
        const a = (+item.qty||0)*(+item.rate||0);
        return [item.desc||'', +item.qty||0, +item.rate||0, a];
      }),
      [], ['Subtotal', '', '', d.subtotal],
      d.gstRate>0 ? [`GST (${d.gstRate}%)`, '', '', d.gstAmount] : null,
      ['TOTAL AMOUNT DUE', '', '', d.total],
      d.notes ? [] : null, d.notes ? ['Notes', d.notes] : null
    ].filter(Boolean);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{wch:40},{wch:10},{wch:15},{wch:15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `invoice-${d.invoiceNum}.xlsx`);
    resolve();
  });
}

// ── Text Download ──
function downloadAsText() {
  return new Promise((resolve, reject) => {
    try {
      const d = invoiceData;
      const cur = d.currency || '₹';
      let t = `${'='.repeat(55)}\nINVOICE #${d.invoiceNum}\n${'='.repeat(55)}\n\n`;
      t += `FROM: ${d.from}\n`;
      if (d.fromContact) t += `Contact: ${d.fromContact}\n`;
      if (d.fromGst) t += `GST: ${d.fromGst}\n`;
      t += `\nBILL TO: ${d.to}\n`;
      if (d.toGst) t += `GST: ${d.toGst}\n`;
      t += `\nInvoice Date: ${d.date}\nDue Date: ${d.dueDate}\n\n`;
      t += `${'─'.repeat(55)}\n`;
      t += `${'Description'.padEnd(28)} ${'Qty'.padEnd(5)} ${'Rate'.padEnd(10)} Amount\n`;
      t += `${'─'.repeat(55)}\n`;
      d.items.forEach(item => {
        const a = (+item.qty||0)*(+item.rate||0);
        t += `${(item.desc||'').substring(0,27).padEnd(28)} ${String(item.qty).padEnd(5)} ${(cur+(+item.rate||0)).padEnd(10)} ${cur}${a.toLocaleString('en-IN')}\n`;
      });
      t += `${'─'.repeat(55)}\nSubtotal: ${cur}${d.subtotal.toLocaleString('en-IN')}\n`;
      if (d.gstRate > 0) t += `GST (${d.gstRate}%): ${cur}${d.gstAmount.toLocaleString('en-IN')}\n`;
      t += `TOTAL: ${cur}${d.total.toLocaleString('en-IN')}\n`;
      if (d.notes) t += `\nNotes:\n${d.notes}\n`;

      const blob = new Blob([t], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `invoice-${d.invoiceNum}.txt`;
      a.click();
      resolve();
    } catch(e) { reject(e); }
  });
}

// ── PNG Download ──
async function downloadAsPNG() {
  try {
    const canvas = await html2canvas(document.getElementById('invoiceContent'), {
      scale: 3, useCORS: true, backgroundColor: '#1a1a1a'
    });
    const a = document.createElement('a');
    a.download = `invoice-${invoiceData.invoiceNum}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  } catch(e) { alert('PNG download failed'); }
}

// ── Init ──
loadInvoiceData();
