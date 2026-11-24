/**
 * ============================================================================
 * js/scanner.js — SCAN BARCODE KAMERA & SCANNER USB / BLUETOOTH HID
 * ============================================================================
 */
(function (global) {
  'use strict';

  function attachHidListener(onDetected) {
    var buf = '';
    var lastTime = 0;

    function onKeyDown(e) {
      var tag = e.target && e.target.tagName ? e.target.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      var now = Date.now();
      if (now - lastTime > 85) buf = '';
      lastTime = now;

      if (e.key === 'Enter' && buf.length >= 6) {
        var scanned = buf;
        buf = '';
        onDetected(scanned);
      } else if (e.key && e.key.length === 1) {
        buf += e.key;
      }
    }

    global.addEventListener('keydown', onKeyDown);
    return function () { global.removeEventListener('keydown', onKeyDown); };
  }

  function openModal(products, onDetected) {
    var old = document.getElementById('barberdesk-barcode-modal');
    if (old) old.remove();

    var qrInstance = null;
    var regionId = 'barberdesk-qr-viewport';
    var FE = global.FinanceEngine;

    var quickItems = (products || [])
      .filter(function (p) { return p.active && p.barcode; })
      .map(function (p) {
        return (
          '<button type="button" class="role-demo-card" data-scan-code="' + p.barcode + '">' +
            '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">' +
              '<strong style="font-size:12px;" class="truncate">' + p.name + '</strong>' +
              '<span class="mono fs-xs fw-600">' + FE.formatRupiah(p.sellPrice) + '</span>' +
            '</div>' +
            '<div class="mono fs-11 text-muted" style="margin-top:2px;">' + p.barcode + '</div>' +
          '</button>'
        );
      })
      .join('');

    var wrap = document.createElement('div');
    wrap.id = 'barberdesk-barcode-modal';
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal-card" style="max-width:520px;">' +
        '<div class="modal-header">' +
          '<div><h3 class="panel-title">Scan Barcode Produk</h3><p class="panel-sub">Kamera perangkat, scanner USB/Bluetooth HID, atau ketik manual</p></div>' +
          '<button type="button" class="btn-icon" id="close-barcode-modal" aria-label="Tutup">✕</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div style="border:1px solid var(--border-color);border-radius:8px;overflow:hidden;background:#111315;">' +
            '<div id="' + regionId + '" style="min-height:200px;width:100%;"></div>' +
            '<div id="barcode-cam-msg" class="fs-xs text-center" style="padding:10px;color:#CBD5E1;">Mengaktifkan kamera...</div>' +
          '</div>' +
          '<form id="manual-barcode-form" style="display:flex;gap:8px;">' +
            '<input type="text" id="manual-barcode-input" class="input mono" placeholder="Contoh: 8991001000011" autofocus />' +
            '<button type="submit" class="btn btn-primary">Tambah</button>' +
          '</form>' +
          '<div>' +
            '<p class="fs-xs text-muted" style="margin-bottom:8px;">Uji cepat scan dari katalog barcode toko:</p>' +
            '<div class="role-demo-grid" style="max-height:150px;overflow-y:auto;">' + quickItems + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);

    function cleanupAndClose() {
      if (qrInstance) {
        var inst = qrInstance;
        qrInstance = null;
        try {
          if (inst.isScanning) {
            inst.stop().catch(function () {}).finally(function () {
              try { inst.clear(); } catch (e) {}
            });
          }
        } catch (e) {}
      }
      wrap.remove();
    }

    wrap.querySelector('#close-barcode-modal').addEventListener('click', cleanupAndClose);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) cleanupAndClose(); });

    wrap.querySelector('#manual-barcode-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var val = wrap.querySelector('#manual-barcode-input').value.trim();
      if (!val) return;
      cleanupAndClose();
      onDetected(val);
    });

    wrap.querySelectorAll('[data-scan-code]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-scan-code');
        cleanupAndClose();
        onDetected(code);
      });
    });

    var camMsg = wrap.querySelector('#barcode-cam-msg');
    if (typeof global.Html5Qrcode === 'function') {
      try {
        qrInstance = new global.Html5Qrcode(regionId);
        qrInstance
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 120 } },
            function (decodedText) {
              if (decodedText) {
                cleanupAndClose();
                onDetected(decodedText.trim());
              }
            },
            function () {}
          )
          .then(function () {
            if (camMsg) camMsg.textContent = 'Kamera aktif — arahkan ke barcode produk';
          })
          .catch(function (err) {
            if (camMsg) {
              camMsg.style.color = '#FDE68A';
              camMsg.textContent =
                'Kamera tidak aktif (' + (err && err.message ? err.message : 'izin ditolak') + '). Gunakan scanner USB atau klik daftar uji cepat.';
            }
          });
      } catch (e) {
        if (camMsg) camMsg.textContent = 'Kamera tidak tersedia. Gunakan scanner USB atau input manual.';
      }
    } else if (camMsg) {
      camMsg.textContent = 'Library kamera belum dimuat. Gunakan scanner USB atau input manual.';
    }
  }

  global.BarcodeScanner = {
    attachHidListener: attachHidListener,
    openModal: openModal,
  };
})(window);
