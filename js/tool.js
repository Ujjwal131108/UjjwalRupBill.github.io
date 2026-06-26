    // Domain lock — breaks if run locally or on another domain
    (function() {
      const allowed = ['UjjwalRupBill.github.io'];
      const host = window.location.hostname;
      if (!allowed.includes(host)) {
        document.body.innerHTML = '<h2 style="text-align:center;margin-top:20vh">This tool only works at rupbill.github.io</h2>';
        throw new Error('Unauthorized domain');
      }
    })();
    // ── Set today's date and due date automatically ──
    const today = new Date();
    const due = new Date(); due.setDate(due.getDate() + 15);
    const fmt = d => d.toISOString().split('T')[0];
    document.getElementById('inv-date').value = fmt(today);
    document.getElementById('due-date').value = fmt(due);

    // ── Format date nicely for the invoice ──
    function niceDate(str) {
      if (!str) return '—';
      const d = new Date(str + 'T00:00:00');
      return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    }

    // ── Items array ──
    let items = [
      { desc: '', qty: 1, rate: '' },
      { desc: '', qty: 1, rate: '' }
    ];

    function addItem() {
      items.push({ desc: '', qty: 1, rate: '' });
      renderItems();
      updatePreview();
    }

    function removeItem(i) {
      if (items.length === 1) return; // keep at least 1 row
      items.splice(i, 1);
      renderItems();
      updatePreview();
    }

    function renderItems() {
      const sym = document.getElementById('currency').value;
      const list = document.getElementById('items-list');
      list.innerHTML = '';
      items.forEach((item, i) => {
        const amount = (parseFloat(item.qty)||0) * (parseFloat(item.rate)||0);
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <input type="text" placeholder="Service description" value="${item.desc}"
            oninput="items[${i}].desc=this.value; updatePreview()" />
          <input type="number" min="1" value="${item.qty}"
            oninput="items[${i}].qty=this.value; updatePreview(); updateAmounts()" />
          <input type="number" min="0" placeholder="0" value="${item.rate}"
            oninput="items[${i}].rate=this.value; updatePreview(); updateAmounts()" />
          <div class="item-amount" id="amt-${i}">${sym}${amount>0?amount.toLocaleString('en-IN'):'0'}</div>
          <button class="remove-btn" onclick="removeItem(${i})">✕</button>
        `;
        list.appendChild(row);
      });
    }

    function updateAmounts() {
      const sym = document.getElementById('currency').value;
      items.forEach((item, i) => {
        const amount = (parseFloat(item.qty)||0) * (parseFloat(item.rate)||0);
        const el = document.getElementById('amt-'+i);
        if (el) el.textContent = sym + (amount>0?amount.toLocaleString('en-IN'):'0');
      });
    }

    // ── Main preview update ──
    function updatePreview() {
      const sym   = document.getElementById('currency').value;
      const gstRate = parseFloat(document.querySelector('input[name="gst-type"]:checked').value);
      const from  = document.getElementById('from-name').value || 'Your Name';
      const fromG = document.getElementById('from-gst').value;
      const fromC = document.getElementById('from-contact').value;
      const to    = document.getElementById('to-name').value || 'Client Name';
      const toG   = document.getElementById('to-gst').value;
      const num   = document.getElementById('inv-num').value || 'INV-001';
      const date  = niceDate(document.getElementById('inv-date').value);
      const due   = niceDate(document.getElementById('due-date').value);
      const notes = document.getElementById('notes').value;

      // Calculate totals
      let subtotal = 0;
      items.forEach(item => {
        subtotal += (parseFloat(item.qty)||0) * (parseFloat(item.rate)||0);
      });
      const gstAmt = gstRate > 0 ? subtotal * (gstRate / 100) : 0;
      const total  = subtotal + gstAmt;
      const gstLabel = gstRate === 18 ? 'GST (18%)' : gstRate === 6 ? 'GST (6% - Composition)' : 'GST (0% - Exempt)';

      // Build rows HTML
      const rows = items.map(item => {
        const amt = (parseFloat(item.qty)||0) * (parseFloat(item.rate)||0);
        if (!item.desc && !item.rate) return '';
        return `<tr>
          <td>${item.desc || '—'}</td>
          <td>${item.qty}</td>
          <td>${sym}${(parseFloat(item.rate)||0).toLocaleString('en-IN')}</td>
          <td>${sym}${amt.toLocaleString('en-IN')}</td>
        </tr>`;
      }).join('');

      document.getElementById('invoice-preview').innerHTML = `
        <div class="inv-header">
          <div class="inv-brand">
            <img src="images/logo.png" alt="RupBill" />
            <div class="inv-brand-name">Rup<span>Bill</span></div>
          </div>
          <div class="inv-title-block">
            <div class="inv-title">INVOICE</div>
            <div class="inv-num">#${num}</div>
          </div>
        </div>

        <div class="inv-parties">
          <div>
            <div class="inv-party-label">From</div>
            <div class="inv-party-name">${from}</div>
            ${fromG ? `<div class="inv-party-detail">GST: ${fromG}</div>` : ''}
            ${fromC ? `<div class="inv-party-detail">${fromC}</div>` : ''}
          </div>
          <div>
            <div class="inv-party-label">Bill To</div>
            <div class="inv-party-name">${to}</div>
            ${toG ? `<div class="inv-party-detail">GST/PAN: ${toG}</div>` : ''}
          </div>
        </div>

        <div class="inv-dates">
          <div class="inv-date-block"><div class="inv-date-label">Invoice Date</div><div class="inv-date-val">${date}</div></div>
          <div class="inv-date-block"><div class="inv-date-label">Due Date</div><div class="inv-date-val">${due}</div></div>
        </div>

        <table class="inv-table">
          <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" style="color:#aaa;text-align:center;padding:16px;">Add items on the left</td></tr>'}</tbody>
        </table>

        <div class="inv-subtotal-row">
          <div class="inv-totals">
            <div class="inv-totals-row"><span>Subtotal</span><span>${sym}${subtotal.toLocaleString('en-IN')}</span></div>
            ${gstRate > 0 ? `<div class="inv-totals-row"><span>${gstLabel}</span><span>${sym}${gstAmt.toLocaleString('en-IN')}</span></div>` : ''}
            <div class="inv-totals-row grand"><span>Total Due</span><span>${sym}${total.toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        ${notes ? `<div class="inv-notes"><div class="inv-notes-label">Notes</div><div class="inv-notes-text">${notes.replace(/\n/g,'<br>')}</div></div>` : ''}
      `;
    }

    // ── PDF Download ──
    async function downloadPDF() {
      const element = document.getElementById('invoice-preview');
      const opt = {
        margin: 10,
        filename: 'invoice.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      html2pdf().set(opt).from(element).save();
    }

    // ── Initialize ──
    renderItems();
    updatePreview();

    // ── Save data and redirect to downloader ──
    function saveAndRedirect() {
      const invoiceData = {
        invoiceNum: document.getElementById('inv-num').value || 'INV-001',
        from: document.getElementById('from-name').value || 'Your Name',
        fromGst: document.getElementById('from-gst').value,
        fromContact: document.getElementById('from-contact').value,
        to: document.getElementById('to-name').value || 'Client Name',
        toGst: document.getElementById('to-gst').value,
        date: document.getElementById('inv-date').value,
        dueDate: document.getElementById('due-date').value,
        currency: document.getElementById('currency').value,
        gstRate: parseFloat(document.querySelector('input[name="gst-type"]:checked').value),
        notes: document.getElementById('notes').value,
        items: items
      };
      localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
      window.location.href = 'invoice-downloader.html';
    }
  
