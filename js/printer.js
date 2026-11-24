/**
 * ============================================================================
 * js/printer.js — PRINTER THERMAL BLUETOOTH (ESC/POS 58mm / 80mm) & STRUK
 * ============================================================================
 */
(function (global) {
  'use strict';

  var SERVICE_UUIDS = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '0000ae30-0000-1000-8000-00805f9b34fb',
  ];

  var btDevice = null;
  var btChar = null;

  function isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  function getStatus() {
    if (!btDevice) return null;
    return {
      name: btDevice.name || 'Thermal Printer BLE',
      connected: Boolean(btDevice.gatt && btDevice.gatt.connected && btChar),
    };
  }

  async function connect() {
    if (!isSupported()) {
      throw new Error('Browser ini belum mendukung Web Bluetooth. Gunakan Chrome/Edge atau Print Browser.');
    }
    var device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: SERVICE_UUIDS,
    });
    var server = await device.gatt.connect();
    var writable = null;

    for (var i = 0; i < SERVICE_UUIDS.length; i++) {
      try {
        var svc = await server.getPrimaryService(SERVICE_UUIDS[i]);
        var chars = await svc.getCharacteristics();
        for (var j = 0; j < chars.length; j++) {
          if (chars[j].properties.writeWithoutResponse || chars[j].properties.write) {
            writable = chars[j];
            break;
          }
        }
        if (writable) break;
      } catch (e) {}
    }

    if (!writable) {
      try {
        var svcs = await server.getPrimaryServices();
        for (var s = 0; s < svcs.length; s++) {
          var chs = await svcs[s].getCharacteristics();
          for (var c = 0; c < chs.length; c++) {
            if (chs[c].properties.writeWithoutResponse || chs[c].properties.write) {
              writable = chs[c];
              break;
            }
          }
          if (writable) break;
        }
      } catch (e) {}
    }

    if (!writable) {
      throw new Error('Printer tersambung, namun characteristic cetak ESC/POS tidak ditemukan.');
    }

    btDevice = device;
    btChar = writable;
    return getStatus();
  }

  function disconnect() {
    if (btDevice && btDevice.gatt && btDevice.gatt.connected) {
      btDevice.gatt.disconnect();
    }
    btDevice = null;
    btChar = null;
  }

  async function writeBytes(bytes) {
    if (!btChar || !btDevice || !btDevice.gatt || !btDevice.gatt.connected) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }
    var chunkSize = 20;
    for (var i = 0; i < bytes.length; i += chunkSize) {
      var slice = bytes.slice(i, i + chunkSize);
      if (btChar.properties.writeWithoutResponse) {
        await btChar.writeValueWithoutResponse(slice);
      } else {
        await btChar.writeValue(slice);
      }
      await new Promise(function (r) { setTimeout(r, 18); });
    }
  }

  async function printLines(lines) {
    var enc = new TextEncoder();
    var buf = [0x1b, 0x40, 0x1b, 0x61, 0x00];
    lines.forEach(function (line, idx) {
      if (idx === 0) {
        buf.push(0x1b, 0x61, 0x01, 0x1b, 0x45, 0x01);
        buf.push.apply(buf, Array.from(enc.encode(line + '\n')));
        buf.push(0x1b, 0x45, 0x00, 0x1b, 0x61, 0x00);
      } else {
        buf.push.apply(buf, Array.from(enc.encode(line + '\n')));
      }
    });
    buf.push(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x41, 0x10);
    await writeBytes(new Uint8Array(buf));
  }

  function centerText(text, width) {
    var clean = String(text || '').slice(0, width);
    var pad = Math.max(0, Math.floor((width - clean.length) / 2));
    return ' '.repeat(pad) + clean;
  }

  function twoCol(left, right, width) {
    var r = String(right || '');
    var maxLeft = Math.max(4, width - r.length - 1);
    var l = String(left || '').slice(0, maxLeft);
    var sp = Math.max(1, width - l.length - r.length);
    return l + ' '.repeat(sp) + r;
  }

  function buildTransactionLines(trx, settings) {
    var FE = global.FinanceEngine;
    var width = settings.paperWidth === '80mm' ? 42 : 32;
    var sep = '-'.repeat(width);
    var lines = [
      String(settings.shopName || 'BARBERDESK').toUpperCase(),
      centerText(settings.address || '', width),
      centerText('Telp: ' + (settings.phone || '-'), width),
      sep,
      twoCol('No', trx.invoiceNo, width),
      twoCol('Tgl', FE.formatDateTime(trx.createdAt), width),
      twoCol('Kasir', trx.cashierName, width),
      twoCol('Pelanggan', trx.customerName || 'Walk-in', width),
      sep,
    ];
    (trx.items || []).forEach(function (item) {
      lines.push(String(item.name || '').slice(0, width));
      var cap = item.capsterName ? ' (' + item.capsterName + ')' : '';
      lines.push(
        twoCol(
          (item.qty + 'x ' + FE.formatRupiah(item.unitPrice) + cap).slice(0, width - 11),
          FE.formatRupiah(item.subtotal),
          width
        )
      );
    });
    lines.push(sep);
    lines.push(twoCol('Subtotal', FE.formatRupiah(trx.subtotal), width));
    if (trx.discount > 0) lines.push(twoCol('Diskon', '-' + FE.formatRupiah(trx.discount), width));
    lines.push(twoCol('TOTAL', FE.formatRupiah(trx.total), width));
    lines.push(twoCol('Bayar (' + String(trx.paymentMethod || '').toUpperCase() + ')', FE.formatRupiah(trx.paidAmount), width));
    lines.push(twoCol('Kembali', FE.formatRupiah(trx.changeAmount), width));
    lines.push(sep);
    lines.push(centerText(settings.receiptFooter || 'Terima kasih!', width));
    return lines;
  }

  function buildPayrollLines(pay, settings) {
    var FE = global.FinanceEngine;
    var width = settings.paperWidth === '80mm' ? 42 : 32;
    var sep = '-'.repeat(width);
    var lines = [
      String(settings.shopName || 'BARBERDESK').toUpperCase(),
      centerText('SLIP GAJI & KOMISI CAPSTER', width),
      sep,
      twoCol('No Slip', pay.slipNo, width),
      twoCol('Capster', pay.capsterName, width),
      twoCol('Periode', FE.formatDateShort(pay.periodStart), width),
      twoCol('s/d', FE.formatDateShort(pay.periodEnd), width),
      sep,
      twoCol('Jumlah Jasa', pay.serviceCount + ' layanan', width),
      twoCol('Omzet Jasa', FE.formatRupiah(pay.grossServiceRevenue), width),
      twoCol('Komisi Jasa', FE.formatRupiah(pay.serviceCommission), width),
    ];
    if (pay.productCommission > 0) lines.push(twoCol('Komisi Produk', FE.formatRupiah(pay.productCommission), width));
    if (pay.baseAllowance > 0) lines.push(twoCol('Tunjangan/Pokok', FE.formatRupiah(pay.baseAllowance), width));
    if (pay.bonus > 0) lines.push(twoCol('Bonus', FE.formatRupiah(pay.bonus), width));
    if (pay.deductions > 0) lines.push(twoCol('Potongan/Kasbon', '-' + FE.formatRupiah(pay.deductions), width));
    lines.push(sep);
    lines.push(twoCol('TOTAL DITERIMA', FE.formatRupiah(pay.netPay), width));
    lines.push(sep);
    lines.push(twoCol('Dicairkan', pay.paidBy, width));
    lines.push(twoCol('Waktu', FE.formatDateTime(pay.paidAt), width));
    lines.push(sep);
    lines.push(centerText('Terima kasih atas dedikasinya!', width));
    return lines;
  }

  async function printTestPage(settings) {
    var FE = global.FinanceEngine;
    var width = settings.paperWidth === '80mm' ? 42 : 32;
    var sep = '-'.repeat(width);
    await printLines([
      String(settings.shopName || 'BARBERDESK').toUpperCase(),
      centerText('UJI CETAK THERMAL BLUETOOTH', width),
      sep,
      twoCol('Lebar Kertas', settings.paperWidth || '58mm', width),
      twoCol('Bagi Hasil', (settings.defaultCapsterPct || 40) + '% / ' + (settings.defaultShopPct || 60) + '%', width),
      twoCol('Waktu', FE.formatDateTime(new Date().toISOString()), width),
      sep,
      centerText('Printer siap mencetak struk!', width),
    ]);
  }

  function openReceiptModal(title, lines, settings) {
    var old = document.getElementById('barberdesk-receipt-modal');
    if (old) old.remove();

    var widthCls = settings.paperWidth === '80mm' ? 'w-80' : 'w-58';
    var st = getStatus();
    var btLabel = st && st.connected ? 'Bluetooth: ' + st.name : 'Bluetooth belum terhubung';

    var wrap = document.createElement('div');
    wrap.id = 'barberdesk-receipt-modal';
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal-card" style="max-width:440px;">' +
        '<div class="modal-header">' +
          '<div><h3 class="panel-title">' + title + '</h3><p class="panel-sub">Format ' + (settings.paperWidth || '58mm') + ' · ' + btLabel + '</p></div>' +
          '<button type="button" class="btn-icon" id="close-receipt-modal" aria-label="Tutup">✕</button>' +
        '</div>' +
        '<div class="modal-body" style="background:#F1F5F9;">' +
          '<div id="thermal-print-area" class="receipt-paper ' + widthCls + '"></div>' +
          '<div id="receipt-bt-feedback" class="hidden"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-outline" id="btn-print-browser">Print Browser</button>' +
          '<button type="button" class="btn btn-primary" id="btn-print-bt">Cetak Bluetooth</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);
    wrap.querySelector('#thermal-print-area').textContent = lines.join('\n');
    wrap.querySelector('#close-receipt-modal').addEventListener('click', function () { wrap.remove(); });
    wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
    wrap.querySelector('#btn-print-browser').addEventListener('click', function () { window.print(); });

    var btBtn = wrap.querySelector('#btn-print-bt');
    var fb = wrap.querySelector('#receipt-bt-feedback');
    btBtn.addEventListener('click', async function () {
      btBtn.disabled = true;
      btBtn.textContent = 'Mencetak...';
      fb.className = 'hidden';
      try {
        if (!getStatus() || !getStatus().connected) await connect();
        await printLines(lines);
        fb.className = 'notice success';
        fb.textContent = 'Struk berhasil dikirim ke printer thermal Bluetooth.';
      } catch (err) {
        fb.className = 'notice error';
        fb.textContent = err && err.message ? err.message : 'Gagal mencetak lewat Bluetooth.';
      } finally {
        btBtn.disabled = false;
        btBtn.textContent = 'Cetak Bluetooth';
      }
    });
  }

  global.ThermalPrinter = {
    isSupported: isSupported,
    getStatus: getStatus,
    connect: connect,
    disconnect: disconnect,
    printLines: printLines,
    printTestPage: printTestPage,
    buildTransactionLines: buildTransactionLines,
    buildPayrollLines: buildPayrollLines,
    openTransactionModal: function (trx, settings) {
      openReceiptModal('Struk Transaksi Pelanggan', buildTransactionLines(trx, settings), settings);
    },
    openPayrollModal: function (pay, settings) {
      openReceiptModal('Slip Gaji & Komisi Capster', buildPayrollLines(pay, settings), settings);
    },
  };
})(window);
