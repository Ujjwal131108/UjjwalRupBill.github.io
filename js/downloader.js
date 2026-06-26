    // Domain lock — breaks if run locally or on another domain
      (function() {
        const allowed = ['ujjwal131108.github.io'];
        const host = window.location.hostname;
        if (!allowed.includes(host)) {
          document.body.innerHTML = '<h2 style="text-align:center;margin-top:20vh">This tool only works at rupbill.github.io</h2>';
          throw new Error('Unauthorized domain');
        }
      })();
    let downloadCount = 0;
    let invoiceData = {};

    // Load data from localStorage or use defaults
    function loadInvoiceData() {
      const savedData = localStorage.getItem('invoiceData');
      
      if (savedData) {
        const data = JSON.parse(savedData);
        invoiceData = {
          invoiceNum: data.invoiceNum,
          from: data.from,
          fromGst: data.fromGst,
          fromContact: data.fromContact,
          to: data.to,
          toGst: data.toGst,
          date: data.date ? new Date(data.date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
          dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN') : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
          currency: data.currency || '₹',
          gstRate: data.gstRate || 18,
          notes: data.notes,
          items: data.items || []
        };
      } else {
        // Fallback default data
        invoiceData = {
          invoiceNum: 'INV-001',
          from: 'Your Business Name',
          fromGst: '27AABCU9603R1ZX',
          fromContact: 'business@example.com',
          to: 'Client Name',
          toGst: '22AAAAA0000A1Z5',
          date: new Date().toLocaleDateString('en-IN'),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
          currency: '₹',
          gstRate: 18,
          notes: 'Please pay within 15 days via bank transfer or UPI.',
          items: [
            { desc: 'Web Development', qty: 1, rate: 10000, amount: 10000 },
            { desc: 'UI/UX Design', qty: 1, rate: 5000, amount: 5000 },
            { desc: 'Hosting Setup', qty: 1, rate: 2000, amount: 2000 }
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

    // Update invoice display with loaded data
    function updateInvoiceDisplay() {
  const invoiceNumEl = document.querySelector('.invoice-num');
  if (invoiceNumEl) {
    invoiceNumEl.textContent = `#${invoiceData.invoiceNum}`;
  }

  const invDate = document.getElementById('invDate');
  if (invDate) invDate.textContent = invoiceData.date;

  const dueDate = document.getElementById('dueDate');
  if (dueDate) dueDate.textContent = invoiceData.dueDate;

  const sections = document.querySelectorAll('.invoice-section');

  if (sections[0]) {
    sections[0].innerHTML = `
      <div class="section-label">From</div>
      <div class="section-content">
        <strong>${invoiceData.from || ''}</strong><br>
        ${invoiceData.fromContact ? `Contact: ${invoiceData.fromContact}<br>` : ''}
        ${invoiceData.fromGst ? `GST: ${invoiceData.fromGst}` : ''}
      </div>
    `;
  }

  if (sections[1]) {
    sections[1].innerHTML = `
      <div class="section-label">Bill To</div>
      <div class="section-content">
        <strong>${invoiceData.to || ''}</strong><br>
        ${invoiceData.toGst ? `GST: ${invoiceData.toGst}` : ''}
      </div>
    `;
  }

  const tbody = document.querySelector('.invoice-table tbody');

  if (tbody) {
    let html = '';

    invoiceData.items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const amount = qty * rate;

      html += `
        <tr>
          <td>${item.desc || ''}</td>
          <td>${qty}</td>
          <td>${invoiceData.currency}${rate.toLocaleString('en-IN')}</td>
          <td>${invoiceData.currency}${amount.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    html += `
      <tr class="total-row">
        <td colspan="3" style="text-align:right;">Subtotal</td>
        <td>${invoiceData.currency}${invoiceData.subtotal.toLocaleString('en-IN')}</td>
      </tr>
    `;

    if (invoiceData.gstRate > 0) {
      html += `
        <tr class="total-row">
          <td colspan="3" style="text-align:right;">
            GST (${invoiceData.gstRate}%)
          </td>
          <td>${invoiceData.currency}${invoiceData.gstAmount.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    html += `
      <tr class="total-row">
        <td colspan="3" style="text-align:right;">
          Total Amount Due
        </td>
        <td>${invoiceData.currency}${invoiceData.total.toLocaleString('en-IN')}</td>
      </tr>
    `;

    tbody.innerHTML = html;
  }

  if (sections[3] && invoiceData.notes) {
    sections[3].innerHTML = `
      <div class="section-label">Notes</div>
      <div class="section-content">
        ${invoiceData.notes.replace(/\n/g, '<br>')}
      </div>
    `;
  }
}

    // Load data when page loads
    loadInvoiceData();

    // Add event listeners to all download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const format = this.dataset.format;
        if (format) {
          await handleDownload(format, this);
        }
      });
    });

    async function handleDownload(format, btn) {
      const originalHTML = btn.innerHTML;
      const feedback = document.getElementById('feedback');

      try {
        btn.disabled = true;
        btn.classList.add('loading');
        btn.innerHTML = `<span class="spinner"></span> <span>Processing...</span>`;

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1200));

        let filename;

        switch(format) {
          case 'pdf':
            await downloadAsPDF();
            filename = `invoice-${invoiceData.invoiceNum}.pdf`;
            break;
          case 'word':
            await downloadAsWord();
            filename = `invoice-${invoiceData.invoiceNum}.docx`;
            break;
          case 'excel':
            await downloadAsExcel();
            filename = `invoice-${invoiceData.invoiceNum}.xlsx`;
            break;
          case 'csv':
            await downloadAsCSV();
            filename = `invoice-${invoiceData.invoiceNum}.csv`;
            break;
          case 'txt':
            await downloadAsText();
            filename = `invoice-${invoiceData.invoiceNum}.txt`;
            break;
        }

        // Show success state
        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = `<span class="btn-icon">✓</span> <span>Downloaded!</span>`;

        downloadCount++;
        document.getElementById('counter').textContent = downloadCount;
        showFeedback(`✓ Invoice downloaded as ${format.toUpperCase()}!`, 'success');

        // Reset button
        setTimeout(() => {
          btn.disabled = false;
          btn.classList.remove('success');
          btn.innerHTML = originalHTML;
        }, 2000);

      } catch (error) {
        console.error('Download failed:', error);
        btn.classList.remove('loading');
        btn.classList.add('error');
        btn.innerHTML = `<span class="btn-icon">✗</span> <span>Failed</span>`;
        showFeedback(`✗ Failed to download as ${format.toUpperCase()}`, 'error');

        setTimeout(() => {
          btn.disabled = false;
          btn.classList.remove('error');
          btn.innerHTML = originalHTML;
        }, 2000);
      }
    }

    function showFeedback(message, type) {
      const feedback = document.getElementById('feedback');
      feedback.textContent = message;
      feedback.className = `feedback show ${type}`;
      setTimeout(() => {
        feedback.classList.remove('show');
      }, 3000);
    }

    function downloadFile(data, filename, type) {
      const blob = new Blob([data], { type: type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

  async function downloadAsPDF() {
  const d = invoiceData;
  const cur = d.currency || '₹';
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const green = [116, 183, 46];
  const black = [30, 30, 30];
  const white = [255, 255, 255];
  const lightGray = [245, 245, 245];

  let y = 15;
  const L = 15, R = 195;

  // Header
  doc.setFillColor(...green);
  doc.rect(L, y, R - L, 14, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', L + 4, y + 10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${d.invoiceNum}`, R - 4, y + 10, { align: 'right' });
  y += 20;

  // From / Bill To / Dates
  doc.setTextColor(...green);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', L, y);
  doc.text('BILL TO', 80, y);
  doc.text('DATES', 150, y);
  y += 5;

  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(d.from || '', L, y);
  doc.text(d.to || '', 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice: ${d.date}`, 150, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (d.fromContact) { doc.text(`Contact: ${d.fromContact}`, L, y); }
  if (d.toGst) { doc.text(`GST: ${d.toGst}`, 80, y); }
  doc.text(`Due: ${d.dueDate}`, 150, y);
  y += 5;

  if (d.fromGst) { doc.text(`GST: ${d.fromGst}`, L, y); }
  y += 10;

  // Table header
  doc.setFillColor(...green);
  doc.rect(L, y, R - L, 8, 'F');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', L + 3, y + 5.5);
  doc.text('Qty', 130, y + 5.5, { align: 'center' });
  doc.text('Rate', 158, y + 5.5, { align: 'right' });
  doc.text('Amount', R - 3, y + 5.5, { align: 'right' });
  y += 10;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  d.items.forEach((item, i) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const amount = qty * rate;
    if (i % 2 === 0) {
      doc.setFillColor(...lightGray);
      doc.rect(L, y - 4, R - L, 8, 'F');
    }
    doc.setTextColor(...black);
    doc.text(item.desc || '', L + 3, y + 1);
    doc.text(String(qty), 130, y + 1, { align: 'center' });
    doc.text(`${cur}${rate.toLocaleString('en-IN')}`, 158, y + 1, { align: 'right' });
    doc.text(`${cur}${amount.toLocaleString('en-IN')}`, R - 3, y + 1, { align: 'right' });
    y += 8;
  });

  y += 4;
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', 158, y, { align: 'right' });
  doc.text(`${cur}${d.subtotal.toLocaleString('en-IN')}`, R - 3, y, { align: 'right' });
  y += 7;

  // GST
  if (d.gstRate > 0) {
    doc.text(`GST (${d.gstRate}%)`, 158, y, { align: 'right' });
    doc.text(`${cur}${d.gstAmount.toLocaleString('en-IN')}`, R - 3, y, { align: 'right' });
    y += 7;
  }

  // Total
  doc.setFillColor(...green);
  doc.rect(L, y - 5, R - L, 10, 'F');
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL AMOUNT DUE', 158, y + 2, { align: 'right' });
  doc.text(`${cur}${d.total.toLocaleString('en-IN')}`, R - 3, y + 2, { align: 'right' });
  y += 15;

  // Notes
  if (d.notes) {
    doc.setTextColor(...green);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('NOTES', L, y);
    y += 5;
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(d.notes, R - L);
    doc.text(lines, L, y);
  }

  doc.save(`invoice-${d.invoiceNum}.pdf`);
}
    function downloadAsWordAlt() {
      // Fallback Word download as HTML (opens as Word doc)
      return new Promise((resolve, reject) => {
        try {
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Invoice ${invoiceData.invoiceNum}</title>
            </head>
            <body>
              <h1>INVOICE #${invoiceData.invoiceNum}</h1>
              <p><b>FROM:</b> ${invoiceData.from}</p>
              ${invoiceData.fromGst ? `<p>GST: ${invoiceData.fromGst}</p>` : ''}
              ${invoiceData.fromContact ? `<p>Contact: ${invoiceData.fromContact}</p>` : ''}
              <p><b>BILL TO:</b> ${invoiceData.to}</p>
              ${invoiceData.toGst ? `<p>GST: ${invoiceData.toGst}</p>` : ''}
              <p>Invoice Date: ${invoiceData.date} | Due Date: ${invoiceData.dueDate}</p>
              <table border="1" style="width:100%; border-collapse:collapse;">
                <tr style="background:#f0f0f0;">
                  <th style="padding:8px;">Description</th><th style="padding:8px;">Qty</th>
                  <th style="padding:8px;">Rate</th><th style="padding:8px;">Amount</th>
                </tr>
                ${invoiceData.items.map(item => {
                  const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                  return `<tr><td style="padding:8px;">${item.desc}</td><td style="padding:8px;">${item.qty}</td>
                    <td style="padding:8px;">${invoiceData.currency}${parseFloat(item.rate).toLocaleString('en-IN')}</td>
                    <td style="padding:8px;">${invoiceData.currency}${amount.toLocaleString('en-IN')}</td></tr>`;
                }).join('')}
              </table>
              <p><b>Subtotal:</b> ${invoiceData.currency}${invoiceData.subtotal.toLocaleString('en-IN')}</p>
              ${invoiceData.gstRate > 0 ? `<p><b>GST (${invoiceData.gstRate}%):</b> ${invoiceData.currency}${invoiceData.gstAmount.toLocaleString('en-IN')}</p>` : ''}
              <p><b>Total:</b> ${invoiceData.currency}${invoiceData.total.toLocaleString('en-IN')}</p>
              ${invoiceData.notes ? `<p><b>Notes:</b><br>${invoiceData.notes.replace(/\n/g, '<br>')}</p>` : ''}
            </body>
            </html>
          `;
          
          const blob = new Blob([html], { type: 'application/msword' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `invoice-${invoiceData.invoiceNum}.doc`;
          link.click();
          setTimeout(() => resolve(), 300);
        } catch (error) {
          reject(error);
        }
      });
    }

        function downloadAsWord() {
          return new Promise((resolve) => {

            const styles = `
            <style>
              body{
                font-family: Arial, sans-serif;
                background: transparent;
                color: inherit;
                padding: 20px;
              }

              .invoice-card{
                background: transparent;
                border: 1px solid #4f4f4f;
                border-radius: 16px;
                padding: 32px;
              }

              .invoice-header{
                display: flex;
                justify-content: space-between;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 2px solid #4f4f4f;
              }

              .invoice-title{
                color: #74B72E;
                font-size: 32px;
                font-weight: bold;
              }

              .invoice-num{
                color: inherit;
              }

              .section-label{
                color: #74B72E;
                font-weight: bold;
                margin-bottom: 8px;
                text-transform: uppercase;
              }

              .section-content{
                color: inherit;
                line-height: 1.6;
              }

              table{
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }

              th{
                border: 1px solid #4f4f4f;
                padding: 10px;
                text-align: left;
                color: #74B72E;
              }

              td{
                border: 1px solid #4f4f4f;
                padding: 10px;
                color: inherit;
              }

              .total-row{
                font-weight: bold;
              }

              strong{
                color: inherit;
              }
            </style>
            `;

            const html = `
              <html>
              <head>
                <meta charset="utf-8">
                ${styles}
              </head>
              <body>
                ${document.getElementById('invoiceContent').outerHTML}
              </body>
              </html>
            `;

            const blob = new Blob(
              [html],
              { type: 'application/msword' }
            );

            const link = document.createElement('a');

            link.href = URL.createObjectURL(blob);

            link.download =
              `invoice-${invoiceData.invoiceNum}.doc`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            resolve();
          });
        }

        function downloadAsExcel() {
          return new Promise((resolve, reject) => {

            if (typeof XLSX === 'undefined') {
              alert('XLSX library failed to load');
              reject('XLSX missing');
              return;
            }

            try {

              const gstLabel =
                invoiceData.gstRate > 0
                  ? `GST (${invoiceData.gstRate}%)`
                  : 'GST Exempted';

              const data = [];

              data.push([`INVOICE #${invoiceData.invoiceNum}`]);
              data.push([]);

              data.push(['FROM']);
              data.push([invoiceData.from || '']);

              if (invoiceData.fromContact) {
                data.push([`Contact: ${invoiceData.fromContact}`]);
              }

              if (invoiceData.fromGst) {
                data.push([`GST: ${invoiceData.fromGst}`]);
              }

              data.push([]);

              data.push(['BILL TO']);
              data.push([invoiceData.to || '']);

              if (invoiceData.toGst) {
                data.push([`GST: ${invoiceData.toGst}`]);
              }

              data.push([]);

              data.push(['Invoice Date', invoiceData.date]);
              data.push(['Due Date', invoiceData.dueDate]);

              data.push([]);
              data.push(['ITEMS']);
              data.push(['Description', 'Qty', 'Rate', 'Amount']);

              invoiceData.items.forEach(item => {

                const qty = parseFloat(item.qty) || 0;
                const rate = parseFloat(item.rate) || 0;

                data.push([
                  item.desc || '',
                  qty,
                  rate,
                  qty * rate
                ]);
              });

              data.push([]);

              data.push([
                'Subtotal',
                '',
                '',
                invoiceData.subtotal
              ]);

              if (invoiceData.gstRate > 0) {
                data.push([
                  gstLabel,
                  '',
                  '',
                  invoiceData.gstAmount
                ]);
              }

              data.push([
                'TOTAL AMOUNT DUE',
                '',
                '',
                invoiceData.total
              ]);

              if (invoiceData.notes) {
                data.push([]);
                data.push(['NOTES']);
                data.push([invoiceData.notes]);
              }

              const ws = XLSX.utils.aoa_to_sheet(data);

              ws['!cols'] = [
                { wch: 45 },
                { wch: 12 },
                { wch: 18 },
                { wch: 18 }
              ];

              ws['!merges'] = [
                {
                  s: { r: 0, c: 0 },
                  e: { r: 0, c: 3 }
                }
              ];

              const wb = XLSX.utils.book_new();

              XLSX.utils.book_append_sheet(
                wb,
                ws,
                'Invoice'
              );

              XLSX.writeFile(
                wb,
                `invoice-${invoiceData.invoiceNum}.xlsx`
              );

              resolve();

            } catch (error) {
              console.error(error);
              reject(error);
            }
          });
        }

        async function downloadAsPNG() {

          try {

            const invoice =
              document.getElementById('invoiceContent');

            const canvas =
              await html2canvas(invoice, {
                scale: 3,
                useCORS: true,
                backgroundColor: null
              });

            const link =
              document.createElement('a');

            link.download =
              `invoice-${invoiceData.invoiceNum}.png`;

            link.href =
              canvas.toDataURL('image/png');

            link.click();

          } catch (error) {

            console.error(error);

            alert(
              'Failed to download PNG'
            );
          }
        }

    function downloadAsText() {
      return new Promise((resolve, reject) => {
        try {
          const gstLabel = invoiceData.gstRate === 18 ? 'GST (18%)' : invoiceData.gstRate === 6 ? 'GST (6%)' : invoiceData.gstRate === 0 ? 'GST Exempted' : `GST (${invoiceData.gstRate}%)`;
          
          let text = `${'='.repeat(60)}\n`;
          text += `INVOICE #${invoiceData.invoiceNum}\n`;
          text += `${'='.repeat(60)}\n\n`;
          text += `FROM:\n${invoiceData.from}\n`;
          if (invoiceData.fromGst) text += `GST: ${invoiceData.fromGst}\n`;
          if (invoiceData.fromContact) text += `Contact: ${invoiceData.fromContact}\n`;
          text += `\nBILL TO:\n${invoiceData.to}\n`;
          if (invoiceData.toGst) text += `GST: ${invoiceData.toGst}\n`;
          text += `\nInvoice Date: ${invoiceData.date}\n`;
          text += `Due Date: ${invoiceData.dueDate}\n`;
          text += `${'='.repeat(60)}\n\n`;
          text += `${'Description'.padEnd(30)} ${'Qty'.padEnd(6)} ${'Rate'.padEnd(12)} Amount\n`;
          text += `${'-'.repeat(60)}\n`;
          invoiceData.items.forEach(item => {
            const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
            const desc = (item.desc || '').substring(0, 29).padEnd(30);
            const qty = (item.qty || 0).toString().padEnd(6);
            const rate = `${invoiceData.currency}${item.rate || 0}`.padEnd(12);
            text += `${desc} ${qty} ${rate} ${invoiceData.currency}${amount.toLocaleString('en-IN')}\n`;
          });
          text += `${'-'.repeat(60)}\n`;
          text += `Subtotal: ${invoiceData.currency}${invoiceData.subtotal.toLocaleString('en-IN')}\n`;
          if (invoiceData.gstRate > 0) text += `${gstLabel}: ${invoiceData.currency}${invoiceData.gstAmount.toLocaleString('en-IN')}\n`;
          text += `Total Due: ${invoiceData.currency}${invoiceData.total.toLocaleString('en-IN')}\n`;
          if (invoiceData.notes) text += `\nNotes:\n${invoiceData.notes}\n`;

          downloadFile(text, `invoice-${invoiceData.invoiceNum}.txt`, 'text/plain');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }
