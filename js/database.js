/**
 * ============================================================================
 * js/database.js — DATABASE TERPUSAT (INDEXEDDB OFFLINE-FIRST + SYNC FIRESTORE)
 * ============================================================================
 * Seluruh operasi baca/tulis database dipusatkan di file ini agar halaman HTML
 * (page-kasir.html, page-gaji.html, dll.) tidak mengolah penyimpanan mentah.
 *
 * Saat Anda menghubungkan ke Firestore sendiri, cukup pasang adapter di
 * `BarberDB.setFirestoreAdapter(async (queue) => { ... })`.
 */
(function (global) {
  'use strict';

  var DB_NAME = 'BarberDeskOfflineDB_v1';
  var DB_VERSION = 1;
  var STORE_STATE = 'appState';
  var STORE_QUEUE = 'syncQueue';
  var SIM_OFFLINE_KEY = 'barberdesk_sim_offline';
  var LAST_SYNC_KEY = 'barberdesk_last_sync';

  var cachedState = null;
  var firestoreAdapter = null;

  function openIDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE_STATE)) db.createObjectStore(STORE_STATE);
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function generateId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function generateInvoiceNo() {
    var d = new Date();
    var yy = String(d.getFullYear()).slice(-2);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var rand = Math.floor(1000 + Math.random() * 9000);
    return 'INV-' + yy + mm + dd + '-' + rand;
  }

  function generateSlipNo() {
    var d = new Date();
    var yy = String(d.getFullYear()).slice(-2);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var rand = Math.floor(100 + Math.random() * 900);
    return 'SLP-' + yy + mm + '-' + rand;
  }

  function isoDaysAgo(days, hour, minute) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  async function buildSeedState() {
    var now = new Date().toISOString();
    var h = global.AuthRBAC.hashPassword;
    var FE = global.FinanceEngine;

    var services = [
      { id: 'srv_haircut', name: 'Gentleman Haircut', category: 'Potong Rambut', price: 50000, capsterSharePct: 40, shopSharePct: 60, durationMin: 35, active: true, updatedAt: now },
      { id: 'srv_combo', name: 'Haircut + Wash & Tonic', category: 'Paket Kombo', price: 65000, capsterSharePct: 40, shopSharePct: 60, durationMin: 45, active: true, updatedAt: now },
      { id: 'srv_kids', name: 'Kids Haircut', category: 'Potong Rambut', price: 35000, capsterSharePct: 40, shopSharePct: 60, durationMin: 25, active: true, updatedAt: now },
      { id: 'srv_beard', name: 'Beard Trim & Hot Towel Shave', category: 'Perawatan', price: 30000, capsterSharePct: 40, shopSharePct: 60, durationMin: 20, active: true, updatedAt: now },
      { id: 'srv_creambath', name: 'Creambath & Head Massage', category: 'Perawatan', price: 45000, capsterSharePct: 40, shopSharePct: 60, durationMin: 30, active: true, updatedAt: now },
      { id: 'srv_color', name: 'Hair Coloring / Highlight', category: 'Pewarnaan', price: 120000, capsterSharePct: 35, shopSharePct: 65, durationMin: 60, active: true, updatedAt: now },
    ];

    var products = [
      { id: 'prd_clay', barcode: '8991001000011', name: 'Matte Clay Pomade 100g', category: 'Styling', costPrice: 45000, sellPrice: 85000, stock: 18, minStock: 5, capsterCommissionPct: 5, active: true, updatedAt: now },
      { id: 'prd_water', barcode: '8991001000028', name: 'Waterbased Pomade Shine', category: 'Styling', costPrice: 40000, sellPrice: 75000, stock: 14, minStock: 5, capsterCommissionPct: 5, active: true, updatedAt: now },
      { id: 'prd_tonic', barcode: '8991001000035', name: 'Ginseng Hair Tonic 150ml', category: 'Perawatan', costPrice: 28000, sellPrice: 55000, stock: 20, minStock: 6, capsterCommissionPct: 0, active: true, updatedAt: now },
      { id: 'prd_powder', barcode: '8991001000042', name: 'Hair Powder Volume 20g', category: 'Styling', costPrice: 32000, sellPrice: 65000, stock: 4, minStock: 6, capsterCommissionPct: 5, active: true, updatedAt: now },
      { id: 'prd_beard', barcode: '8991001000059', name: 'Beard Oil Cedarwood 30ml', category: 'Perawatan', costPrice: 35000, sellPrice: 70000, stock: 9, minStock: 4, capsterCommissionPct: 0, active: true, updatedAt: now },
      { id: 'prd_mineral', barcode: '8991001000066', name: 'Air Mineral Dingin 600ml', category: 'Minuman', costPrice: 3000, sellPrice: 6000, stock: 34, minStock: 10, capsterCommissionPct: 0, active: true, updatedAt: now },
    ];

    var capsters = [
      { id: 'cap_andi', name: 'Andi Pratama', phone: '0812-3400-1101', specialty: 'Skin Fade & Classic Taper', defaultSharePct: 40, baseAllowance: 300000, active: true, joinedAt: '2025-01-12' },
      { id: 'cap_reza', name: 'Reza Mahendra', phone: '0813-8820-4412', specialty: 'Crop Cut & Beard Sculpting', defaultSharePct: 40, baseAllowance: 300000, active: true, joinedAt: '2025-04-03' },
      { id: 'cap_bagas', name: 'Bagas Saputra', phone: '0857-1904-7723', specialty: 'French Crop & Coloring', defaultSharePct: 40, baseAllowance: 250000, active: true, joinedAt: '2025-08-20' },
    ];

    var seedSamples = [
      { daysAgo: 6, hr: 10, min: 15, cap: capsters[0], srv: services[0], prd: products[0], method: 'qris', customer: 'Budi Santoso' },
      { daysAgo: 6, hr: 13, min: 40, cap: capsters[1], srv: services[1], prd: null, method: 'tunai', customer: 'Fajar Hidayat' },
      { daysAgo: 5, hr: 11, min: 20, cap: capsters[2], srv: services[0], prd: products[5], method: 'tunai', customer: 'Dimas Wijaya' },
      { daysAgo: 5, hr: 16, min: 5, cap: capsters[0], srv: services[1], prd: products[2], method: 'qris', customer: 'Rizky Ramadhan' },
      { daysAgo: 4, hr: 14, min: 10, cap: capsters[1], srv: services[0], prd: null, method: 'tunai', customer: 'Hendra Gunawan' },
      { daysAgo: 3, hr: 10, min: 50, cap: capsters[2], srv: services[5], prd: products[1], method: 'transfer', customer: 'Kevin Pratama' },
      { daysAgo: 3, hr: 15, min: 30, cap: capsters[0], srv: services[0], prd: null, method: 'tunai', customer: 'Ilham Akbar' },
      { daysAgo: 2, hr: 11, min: 45, cap: capsters[1], srv: services[1], prd: products[3], method: 'qris', customer: 'Yoga Saputra' },
      { daysAgo: 2, hr: 17, min: 15, cap: capsters[0], srv: services[0], prd: products[5], method: 'tunai', customer: 'Arief Rahman' },
      { daysAgo: 1, hr: 12, min: 5, cap: capsters[2], srv: services[0], prd: null, method: 'qris', customer: 'Naufal Azhari' },
      { daysAgo: 1, hr: 16, min: 25, cap: capsters[1], srv: services[4], prd: products[4], method: 'tunai', customer: 'Satrio Wibowo' },
      { daysAgo: 0, hr: 9, min: 45, cap: capsters[0], srv: services[0], prd: products[0], method: 'qris', customer: 'Rendi Kurniawan' },
      { daysAgo: 0, hr: 11, min: 10, cap: capsters[1], srv: services[1], prd: null, method: 'tunai', customer: 'Taufik Ismail' },
      { daysAgo: 0, hr: 13, min: 20, cap: capsters[2], srv: services[0], prd: products[5], method: 'tunai', customer: 'Galih Permana' },
    ];

    var transactions = seedSamples.map(function (cfg, idx) {
      var items = [];
      var sc = FE.calculateServiceLine(cfg.srv, 1);
      items.push({
        id: 'ti_s_' + idx,
        itemType: 'service',
        refId: cfg.srv.id,
        name: cfg.srv.name,
        qty: 1,
        unitPrice: sc.unitPrice,
        costPrice: 0,
        subtotal: sc.subtotal,
        capsterId: cfg.cap.id,
        capsterName: cfg.cap.name,
        capsterSharePct: sc.capsterSharePct,
        capsterShareAmount: sc.capsterShareAmount,
        shopShareAmount: sc.shopShareAmount,
      });

      if (cfg.prd) {
        var pc = FE.calculateProductLine(cfg.prd, 1, cfg.prd.capsterCommissionPct > 0);
        items.push({
          id: 'ti_p_' + idx,
          itemType: 'product',
          refId: cfg.prd.id,
          name: cfg.prd.name,
          qty: 1,
          unitPrice: pc.unitPrice,
          costPrice: pc.costPrice,
          subtotal: pc.subtotal,
          capsterId: cfg.prd.capsterCommissionPct > 0 ? cfg.cap.id : null,
          capsterName: cfg.prd.capsterCommissionPct > 0 ? cfg.cap.name : null,
          capsterSharePct: pc.capsterSharePct,
          capsterShareAmount: pc.capsterShareAmount,
          shopShareAmount: pc.shopShareAmount,
        });
      }

      var cartSum = FE.calculateCartSummary(items, 0, 0);
      var paid = cfg.method === 'tunai' ? Math.ceil(cartSum.total / 50000) * 50000 : cartSum.total;

      return {
        id: 'trx_seed_' + (idx + 1),
        invoiceNo: 'INV-2611-' + (1001 + idx),
        createdAt: isoDaysAgo(cfg.daysAgo, cfg.hr, cfg.min),
        cashierId: 'usr_kasir',
        cashierName: 'Rina Kasir',
        customerName: cfg.customer,
        items: items,
        subtotal: cartSum.subtotal,
        discount: 0,
        total: cartSum.total,
        paidAmount: paid,
        changeAmount: paid - cartSum.total,
        paymentMethod: cfg.method,
        totalCapsterShare: cartSum.totalCapsterShare,
        totalShopServiceShare: cartSum.totalShopServiceShare,
        totalProductSales: cartSum.totalProductSales,
        totalProductCost: cartSum.totalProductCost,
        status: 'completed',
        synced: true,
      };
    }).reverse();

    var expenses = [
      { id: 'exp_1', date: FE.daysAgoYmd(5), category: 'Perlengkapan Barber', description: 'Isi ulang silet Astra, neck paper & bedak talcum', amount: 145000, createdBy: 'Budi Admin', createdAt: isoDaysAgo(5, 9, 30) },
      { id: 'exp_2', date: FE.daysAgoYmd(3), category: 'Listrik & Air', description: 'Token listrik PLN ruang utama & AC', amount: 250000, createdBy: 'Hendra Owner', createdAt: isoDaysAgo(3, 14, 0) },
      { id: 'exp_3', date: FE.daysAgoYmd(1), category: 'Operasional', description: 'Laundry handuk hangat & cape potong (12 kg)', amount: 96000, createdBy: 'Budi Admin', createdAt: isoDaysAgo(1, 10, 15) },
    ];

    var users = [
      { id: 'usr_dev', name: 'Sepryan Developer', username: 'developer', role: 'developer', active: true, salt: 's_dev', passHash: await h('dev123', 's_dev'), createdAt: now },
      { id: 'usr_owner', name: 'Hendra Owner', username: 'owner', role: 'owner', active: true, salt: 's_own', passHash: await h('owner123', 's_own'), createdAt: now },
      { id: 'usr_admin', name: 'Budi Admin', username: 'admin', role: 'admin', active: true, salt: 's_adm', passHash: await h('admin123', 's_adm'), createdAt: now },
      { id: 'usr_kasir', name: 'Rina Kasir', username: 'kasir', role: 'kasir', active: true, salt: 's_ksr', passHash: await h('kasir123', 's_ksr'), createdAt: now },
    ];

    return {
      revision: 1,
      updatedAt: now,
      settings: {
        appName: 'BarberDesk',
        shopName: 'BARBERDESK STUDIO',
        branchName: 'Cabang Utama',
        address: 'Jl. Merdeka No. 48, Kota Baru',
        phone: '0812-9000-4848',
        receiptFooter: 'Terima kasih telah berkunjung. Sampai jumpa kembali!',
        defaultCapsterPct: 40,
        defaultShopPct: 60,
        paperWidth: '58mm',
        autoPrintReceipt: false,
      },
      services: services,
      products: products,
      capsters: capsters,
      transactions: transactions,
      payrolls: [],
      expenses: expenses,
      users: users,
    };
  }

  async function saveState(state) {
    cachedState = state;
    var db = await openIDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_STATE, 'readwrite');
      tx.objectStore(STORE_STATE).put(state, 'main');
      tx.oncomplete = function () { resolve(state); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  async function loadState() {
    if (cachedState) return cachedState;
    var db = await openIDB();
    var existing = await new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_STATE, 'readonly');
      var req = tx.objectStore(STORE_STATE).get('main');
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
    if (existing) {
      existing.settings = Object.assign(
        {
          appName: 'BarberDesk',
          shopName: 'BARBERDESK STUDIO',
          branchName: 'Cabang Utama',
          defaultCapsterPct: 40,
          defaultShopPct: 60,
          paperWidth: '58mm',
          autoPrintReceipt: false,
        },
        existing.settings || {}
      );
      if (existing.settings.defaultCapsterPct !== undefined) {
        var normCap = Math.max(0, Math.min(100, Math.round(Number(existing.settings.defaultCapsterPct) || 0)));
        existing.settings.defaultCapsterPct = normCap;
        existing.settings.defaultShopPct = 100 - normCap;
      }
      cachedState = existing;
      return existing;
    }
    var seed = await buildSeedState();
    await saveState(seed);
    return seed;
  }

  async function getQueue() {
    var db = await openIDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_QUEUE, 'readonly');
      var req = tx.objectStore(STORE_QUEUE).getAll();
      req.onsuccess = function () {
        var list = req.result || [];
        list.sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); });
        resolve(list);
      };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function enqueueMutation(action, collection, docId, payload) {
    var user = global.AuthRBAC.getSession();
    var item = {
      id: generateId('mut'),
      action: action,
      collection: collection,
      docId: docId,
      payload: payload,
      actor: user ? user.name : 'system',
      createdAt: new Date().toISOString(),
    };
    var db = await openIDB();
    await new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).put(item);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
    return item;
  }

  async function clearQueueIds(ids) {
    if (!ids || ids.length === 0) return;
    var db = await openIDB();
    await new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE_QUEUE, 'readwrite');
      var store = tx.objectStore(STORE_QUEUE);
      ids.forEach(function (id) { store.delete(id); });
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  function isSimulatedOffline() {
    return localStorage.getItem(SIM_OFFLINE_KEY) === '1';
  }

  function setSimulatedOffline(val) {
    localStorage.setItem(SIM_OFFLINE_KEY, val ? '1' : '0');
    global.dispatchEvent(new CustomEvent('barberdesk:sync-change'));
    if (!val && navigator.onLine) syncNow();
  }

  function isOnlineNow() {
    return navigator.onLine && !isSimulatedOffline();
  }

  function getLastSyncedAt() {
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  async function syncNow() {
    if (!isOnlineNow()) return { synced: 0, online: false };
    var queue = await getQueue();
    if (queue.length === 0) {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      global.dispatchEvent(new CustomEvent('barberdesk:sync-change'));
      return { synced: 0, online: true };
    }

    if (typeof firestoreAdapter === 'function') {
      for (var i = 0; i < queue.length; i++) {
  await firestoreAdapter(queue[i]);
}
    }

    var state = await loadState();
    state.transactions.forEach(function (t) { t.synced = true; });
    state.revision = (state.revision || 1) + 1;
    state.updatedAt = new Date().toISOString();
    await saveState(state);

    await clearQueueIds(queue.map(function (q) { return q.id; }));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    global.dispatchEvent(new CustomEvent('barberdesk:sync-change'));
    return { synced: queue.length, online: true };
  }

  async function mutate(action, collection, docId, mutatorFn, payloadForQueue) {
    var state = await loadState();
    mutatorFn(state);
    state.revision = (state.revision || 1) + 1;
    state.updatedAt = new Date().toISOString();
    await saveState(state);
    await enqueueMutation(action, collection, docId, payloadForQueue || {});

    if (isOnlineNow()) {
      await syncNow();
    } else {
      global.dispatchEvent(new CustomEvent('barberdesk:sync-change'));
    }
    return state;
  }

  /* =========================================================================
     OPERASI CRUD TERPUSAT (Dipanggil oleh page-*.html tanpa olah array mentah)
     ========================================================================= */
  async function simpanTransaksi(trx) {
    return mutate('CREATE_TRANSACTION', 'transactions', trx.id, function (db) {
      db.transactions.unshift(trx);
      (trx.items || []).forEach(function (it) {
        if (it.itemType === 'product') {
          var p = db.products.find(function (x) { return x.id === it.refId; });
          if (p) p.stock = Math.max(0, p.stock - it.qty);
        }
      });
    }, trx);
  }

  async function voidTransaksi(transactionId, reason) {
    return mutate('VOID_TRANSACTION', 'transactions', transactionId, function (db) {
      var trx = db.transactions.find(function (x) { return x.id === transactionId; });
      if (trx && trx.status !== 'void') {
        trx.status = 'void';
        trx.voidReason = reason;
        (trx.items || []).forEach(function (it) {
          if (it.itemType === 'product') {
            var p = db.products.find(function (pr) { return pr.id === it.refId; });
            if (p) p.stock += it.qty;
          }
        });
      }
    }, { transactionId: transactionId, reason: reason });
  }

  async function simpanLayanan(service) {
    return mutate('UPSERT_SERVICE', 'services', service.id, function (db) {
      var idx = db.services.findIndex(function (x) { return x.id === service.id; });
      if (idx >= 0) db.services[idx] = service;
      else db.services.push(service);
    }, service);
  }

  async function hapusLayanan(id) {
    return mutate('DELETE_SERVICE', 'services', id, function (db) {
      db.services = db.services.filter(function (x) { return x.id !== id; });
    }, { id: id });
  }

  async function simpanProduk(product) {
    return mutate('UPSERT_PRODUCT', 'products', product.id, function (db) {
      var idx = db.products.findIndex(function (x) { return x.id === product.id; });
      if (idx >= 0) db.products[idx] = product;
      else db.products.push(product);
    }, product);
  }

  async function restokProduk(id, delta) {
    return mutate('ADJUST_STOCK', 'products', id, function (db) {
      var p = db.products.find(function (x) { return x.id === id; });
      if (p) p.stock = Math.max(0, p.stock + Number(delta || 0));
    }, { id: id, delta: delta });
  }

  async function hapusProduk(id) {
    return mutate('DELETE_PRODUCT', 'products', id, function (db) {
      db.products = db.products.filter(function (x) { return x.id !== id; });
    }, { id: id });
  }

  async function simpanCapster(capster) {
    return mutate('UPSERT_CAPSTER', 'capsters', capster.id, function (db) {
      var idx = db.capsters.findIndex(function (x) { return x.id === capster.id; });
      if (idx >= 0) db.capsters[idx] = capster;
      else db.capsters.push(capster);
    }, capster);
  }

  async function cairkanGaji(record, recordAsExpense) {
    return mutate('CREATE_PAYROLL', 'payrolls', record.id, function (db) {
      db.payrolls.unshift(record);
      if (recordAsExpense && record.netPay > 0) {
        db.expenses.unshift({
          id: 'exp_pay_' + record.id,
          date: record.paidAt.slice(0, 10),
          category: 'Gaji & Komisi',
          description: 'Pencairan Gaji Capster ' + record.capsterName + ' (' + record.periodStart + ' s/d ' + record.periodEnd + ')',
          amount: record.netPay,
          createdBy: record.paidBy,
          createdAt: record.paidAt,
        });
      }
    }, record);
  }

  async function simpanPengeluaran(exp) {
    return mutate('CREATE_EXPENSE', 'expenses', exp.id, function (db) {
      db.expenses.unshift(exp);
    }, exp);
  }

  async function hapusPengeluaran(id) {
    return mutate('DELETE_EXPENSE', 'expenses', id, function (db) {
      db.expenses = db.expenses.filter(function (x) { return x.id !== id; });
    }, { id: id });
  }

  async function simpanPengaturan(partial, options) {
    var opts = options || {};
    var normalized = Object.assign({}, partial);
    if (normalized.defaultCapsterPct !== undefined) {
      var capPct = Math.max(0, Math.min(100, Math.round(Number(normalized.defaultCapsterPct) || 0)));
      normalized.defaultCapsterPct = capPct;
      normalized.defaultShopPct = 100 - capPct;
    }
    var updated = await mutate('UPDATE_SETTINGS', 'settings', 'shop', function (db) {
      db.settings = Object.assign({}, db.settings, normalized);
      if (opts.applySplitToAllServices && normalized.defaultCapsterPct !== undefined) {
        var nowIso = new Date().toISOString();
        var nextCap = normalized.defaultCapsterPct;
        var nextShop = 100 - nextCap;
        (db.services || []).forEach(function (srv) {
          srv.capsterSharePct = nextCap;
          srv.shopSharePct = nextShop;
          srv.updatedAt = nowIso;
        });
        (db.capsters || []).forEach(function (cap) {
          cap.defaultSharePct = nextCap;
        });
      }
    }, Object.assign({}, normalized, { applySplitToAllServices: Boolean(opts.applySplitToAllServices) }));
    global.dispatchEvent(new CustomEvent('barberdesk:settings-change', { detail: updated.settings }));
    return updated;
  }

  async function simpanUser(userData) {
    var cleanUsername = String(userData.username || '').trim().toLowerCase();
    if (!cleanUsername) {
      throw new Error('Username wajib diisi.');
    }
    var cur = await loadState();
    var dup = (cur.users || []).find(function (u) {
      return u.username === cleanUsername && u.id !== userData.id;
    });
    if (dup) {
      throw new Error('Username "' + cleanUsername + '" sudah digunakan akun lain.');
    }
    var payload = Object.assign({}, userData, { username: cleanUsername });
    return mutate('UPSERT_USER', 'users', payload.id, function (db) {
      var idx = db.users.findIndex(function (x) { return x.id === payload.id; });
      if (idx >= 0) {
        db.users[idx] = Object.assign({}, db.users[idx], payload);
      } else {
        db.users.push(payload);
      }
    }, {
      id: payload.id,
      name: payload.name,
      username: payload.username,
      role: payload.role,
      active: Boolean(payload.active),
    });
  }

  async function tambahUser(newUser) {
    return simpanUser(newUser);
  }

  async function toggleUserActive(id) {
    var cur = await loadState();
    var target = (cur.users || []).find(function (u) { return u.id === id; });
    if (!target) return cur;
    var nextActive = !target.active;
    return mutate('UPSERT_USER', 'users', id, function (db) {
      var u = db.users.find(function (x) { return x.id === id; });
      if (u) u.active = nextActive;
    }, { id: id, active: nextActive });
  }

  async function hapusUser(id) {
    return mutate('DELETE_USER', 'users', id, function (db) {
      db.users = db.users.filter(function (x) { return x.id !== id; });
    }, { id: id });
  }

  async function resetDemoData() {
    var seed = await buildSeedState();
    await saveState(seed);
    var q = await getQueue();
    await clearQueueIds(q.map(function (x) { return x.id; }));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    global.dispatchEvent(new CustomEvent('barberdesk:sync-change'));
    return seed;
  }

  global.addEventListener('online', function () {
    global.dispatchEvent(new CustomEvent('barberdesk:sync-change'));
    if (!isSimulatedOffline()) syncNow().catch(function () {});
  });
  global.addEventListener('offline', function () {
    global.dispatchEvent(new CustomEvent('barberdesk:sync-change'));
  });

  var FIRESTORE_COLLECTIONS = [
    { path: 'settings/shop', desc: 'Identitas barbershop, lebar struk 58mm/80mm, default bagi hasil 40/60.' },
    { path: 'services/{serviceId}', desc: 'Daftar layanan potong & perawatan dengan tarif, capsterSharePct, shopSharePct.' },
    { path: 'products/{productId}', desc: 'Produk grooming & minuman dengan barcode EAN-13, costPrice (HPP), sellPrice, stock.' },
    { path: 'capsters/{capsterId}', desc: 'Data capster, spesialisasi, defaultSharePct (40%), dan baseAllowance.' },
    { path: 'transactions/{transactionId}', desc: 'Transaksi POS lengkap dengan items[], totalCapsterShare, totalShopServiceShare, status.' },
    { path: 'payrolls/{payrollId}', desc: 'Arsip pencairan gaji & komisi capster per periode beserta slipNo.' },
    { path: 'expenses/{expenseId}', desc: 'Pengeluaran operasional toko & pencairan gaji.' },
    { path: 'users/{userId}', desc: 'Daftar akun & role (developer, owner, admin, kasir) untuk Firestore Rules.' },
  ];

  global.BarberDB = {
    loadState: loadState,
    saveState: saveState,
    getQueue: getQueue,
    mutate: mutate,
    syncNow: syncNow,
    isOnlineNow: isOnlineNow,
    isSimulatedOffline: isSimulatedOffline,
    setSimulatedOffline: setSimulatedOffline,
    getLastSyncedAt: getLastSyncedAt,
    resetDemoData: resetDemoData,
    generateId: generateId,
    generateInvoiceNo: generateInvoiceNo,
    generateSlipNo: generateSlipNo,
    simpanTransaksi: simpanTransaksi,
    voidTransaksi: voidTransaksi,
    simpanLayanan: simpanLayanan,
    hapusLayanan: hapusLayanan,
    simpanProduk: simpanProduk,
    restokProduk: restokProduk,
    hapusProduk: hapusProduk,
    simpanCapster: simpanCapster,
    cairkanGaji: cairkanGaji,
    simpanPengeluaran: simpanPengeluaran,
    hapusPengeluaran: hapusPengeluaran,
    simpanPengaturan: simpanPengaturan,
    simpanUser: simpanUser,
    tambahUser: tambahUser,
    toggleUserActive: toggleUserActive,
    hapusUser: hapusUser,
    setFirestoreAdapter: function (fn) { firestoreAdapter = fn; },
    FIRESTORE_COLLECTIONS: FIRESTORE_COLLECTIONS,
  };
})(window);
