/**
 * ============================================================================
 * js/auth.js — LOGIN & PEMBATASAN HAK AKSES 4 ROLE (Developer, Owner, Admin, Kasir)
 * ============================================================================
 */
(function (global) {
  'use strict';

  var SESSION_KEY = 'barberdesk_session_v1';

  var ROLE_LABELS = {
    developer: 'Developer',
    owner: 'Owner',
    admin: 'Admin',
    kasir: 'Kasir',
  };

  var ROLE_DESCRIPTIONS = {
    developer: 'Akses penuh seluruh menu, konfigurasi sistem, backup/reset data, dan kelola semua role.',
    owner: 'Pemilik barbershop: laporan laba rugi, HPP produk, ubah nama aplikasi & persentase bagi hasil, pencairan gaji capster, void transaksi, kelola Admin & Kasir.',
    admin: 'Kepala operasional: dashboard omzet, kasir POS, kelola layanan/stok/capster, rekap komisi, dan pengeluaran harian.',
    kasir: 'Front desk: fokus Kasir POS, scan barcode, cetak struk thermal Bluetooth, riwayat hari ini, dan cek stok/tarif (baca saja).',
  };

  var PERMISSIONS = {
    developer: {
      pages: ['dashboard', 'kasir', 'layanan', 'produk', 'gaji', 'transaksi', 'laporan', 'akun', 'pengaturan'],
      canEditServices: true,
      canEditProducts: true,
      canViewCostAndProfit: true,
      canManageCapsters: true,
      canDisbursePayroll: true,
      canRecordExpenses: true,
      canVoidTransaction: true,
      canViewReports: true,
      canManageUsers: true,
      canManageSystem: true,
      canManageRoleTarget: function () { return true; },
    },
    owner: {
      pages: ['dashboard', 'kasir', 'layanan', 'produk', 'gaji', 'transaksi', 'laporan', 'akun', 'pengaturan'],
      canEditServices: true,
      canEditProducts: true,
      canViewCostAndProfit: true,
      canManageCapsters: true,
      canDisbursePayroll: true,
      canRecordExpenses: true,
      canVoidTransaction: true,
      canViewReports: true,
      canManageUsers: true,
      canManageSystem: false,
      canManageRoleTarget: function (targetRole) { return targetRole === 'admin' || targetRole === 'kasir'; },
    },
    admin: {
      pages: ['dashboard', 'kasir', 'layanan', 'produk', 'gaji', 'transaksi', 'pengaturan'],
      canEditServices: true,
      canEditProducts: true,
      canViewCostAndProfit: false,
      canManageCapsters: true,
      canDisbursePayroll: false,
      canRecordExpenses: true,
      canVoidTransaction: false,
      canViewReports: false,
      canManageUsers: false,
      canManageSystem: false,
      canManageRoleTarget: function () { return false; },
    },
    kasir: {
      pages: ['kasir', 'transaksi', 'layanan', 'produk', 'pengaturan'],
      canEditServices: false,
      canEditProducts: false,
      canViewCostAndProfit: false,
      canManageCapsters: false,
      canDisbursePayroll: false,
      canRecordExpenses: false,
      canVoidTransaction: false,
      canViewReports: false,
      canManageUsers: false,
      canManageSystem: false,
      canManageRoleTarget: function () { return false; },
    },
  };

  async function hashPassword(plain, salt) {
    var text = String(salt) + ':' + String(plain);
    if (global.crypto && global.crypto.subtle) {
      var data = new TextEncoder().encode(text);
      var buf = await global.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    }
    var hash = 0;
    for (var i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return 'fb_' + Math.abs(hash).toString(16);
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.role || !PERMISSIONS[parsed.role]) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function setSession(user) {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        loggedInAt: new Date().toISOString(),
      })
    );
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    global.location.href = './index.html';
  }

  function getPermissions(role) {
    return PERMISSIONS[role] || PERMISSIONS.kasir;
  }

  function getDefaultPageUrl(role) {
    return role === 'kasir' ? './page-kasir.html' : './page-dashboard.html';
  }

  function canAccess(role, pageId) {
    return getPermissions(role).pages.indexOf(pageId) !== -1;
  }

  function requirePageAccess(pageId) {
    var user = getSession();
    if (!user) {
      global.location.href = './index.html';
      return null;
    }
    if (!canAccess(user.role, pageId)) {
      global.location.href = getDefaultPageUrl(user.role);
      return null;
    }
    return user;
  }

  async function login(username, password) {
    var db = await global.BarberDB.loadState();
    var uname = String(username || '').trim().toLowerCase();
    var user = (db.users || []).find(function (u) {
      return u.username === uname && u.active;
    });
    if (!user) {
      throw new Error('Username tidak ditemukan atau akun sedang nonaktif.');
    }
    var computedHash = await hashPassword(password, user.salt);
    if (computedHash !== user.passHash) {
      throw new Error('Password / PIN salah. Periksa kembali atau pilih akun uji.');
    }
    setSession(user);
    return user;
  }

  global.AuthRBAC = {
    ROLE_LABELS: ROLE_LABELS,
    ROLE_DESCRIPTIONS: ROLE_DESCRIPTIONS,
    PERMISSIONS: PERMISSIONS,
    hashPassword: hashPassword,
    getSession: getSession,
    setSession: setSession,
    login: login,
    logout: logout,
    getPermissions: getPermissions,
    getDefaultPageUrl: getDefaultPageUrl,
    canAccess: canAccess,
    requirePageAccess: requirePageAccess,
  };
})(window);
