/**
 * ============================================================================
 * js/sidebar.js — LAYOUT, SIDEBAR, TOPBAR, NAVIGASI MOBILE & STYLE TERPUSAT
 * ============================================================================
 * Dipakai bersama oleh semua halaman HTML menu:
 * - index.html           (Login)
 * - page-dashboard.html  (Dashboard Ringkasan)
 * - page-kasir.html      (Kasir POS & Scan Barcode)
 * - page-layanan.html    (Layanan & Tarif 40/60)
 * - page-produk.html     (Produk & Stok Barang)
 * - page-gaji.html       (Capster & Penggajian)
 * - page-transaksi.html  (Riwayat Transaksi & Kas)
 * - page-laporan.html    (Laporan Keuangan — Owner/Developer)
 * - page-pengaturan.html (Printer, Sync Offline & User)
 */
(function (global) {
  'use strict';

  /* ==========================================================================
     1. INJECT STYLESHEET TERPUSAT (DESKTOP + TABLET + MOBILE + PRINT THERMAL)
     ========================================================================== */
  if (!document.getElementById('barberdesk-core-style')) {
    var styleEl = document.createElement('style');
    styleEl.id = 'barberdesk-core-style';
    styleEl.textContent = `
:root {
  --bg-canvas: #F8F9FA;
  --bg-surface: #FFFFFF;
  --bg-subtle: #F1F5F9;
  --bg-sidebar: #111315;
  --bg-sidebar-hover: rgba(255, 255, 255, 0.07);

  --text-primary: #111315;
  --text-secondary: #475569;
  --text-muted: #64748B;
  --text-on-dark: #F8FAFC;
  --text-on-dark-muted: #94A3B8;

  --border-color: #E2E8F0;
  --border-subtle: #F1F5F9;

  --accent-green: #14532D;
  --accent-green-hover: #166534;
  --accent-green-soft: rgba(20, 83, 45, 0.08);
  --accent-brass: #B45309;
  --accent-amber: #D97706;
  --accent-red: #DC2626;
  --accent-emerald: #16A34A;

  --font-display: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --sidebar-width: 256px;
  --topbar-height: 64px;
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-canvas);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, .font-display {
  font-family: var(--font-display);
  margin: 0;
  letter-spacing: -0.02em;
}

p { margin: 0; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font-family: inherit; }

.mono, .tabular-nums {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.text-green { color: var(--accent-green); }
.text-brass { color: var(--accent-brass); }
.text-red { color: var(--accent-red); }
.text-emerald { color: var(--accent-emerald); }
.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; }
.fs-xs { font-size: 12px; }
.fs-11 { font-size: 11px; }
.nowrap { white-space: nowrap; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hidden { display: none !important; }

/* APP SHELL */
.app-shell { display: flex; min-height: 100vh; }

.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--bg-sidebar);
  color: var(--text-on-dark);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1E293B;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 40;
}

.sidebar-brand {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  background: var(--accent-green);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: #CBD5E1;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 150ms ease, color 150ms ease;
}

.nav-link:hover { background: var(--bg-sidebar-hover); color: #FFFFFF; }
.nav-link.active { background: var(--accent-green); color: #FFFFFF; }
.nav-link svg { width: 17px; height: 17px; flex-shrink: 0; }

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
}

.sidebar-user { padding: 0 6px 12px; }
.sidebar-user-name { font-size: 13px; font-weight: 600; color: #FFFFFF; }
.sidebar-user-meta { font-size: 12px; color: var(--text-on-dark-muted); margin-top: 2px; }

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: #CBD5E1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}

.btn-logout:hover { background: rgba(255, 255, 255, 0.08); color: #FFFFFF; }

.app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.topbar {
  height: var(--topbar-height);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 30;
}

.topbar-left { display: flex; align-items: center; gap: 10px; min-width: 0; }

.btn-menu-mobile {
  display: none;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 7px 9px;
  cursor: pointer;
  color: var(--text-primary);
}

.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; min-width: 0; }
.breadcrumb-root { color: var(--text-muted); white-space: nowrap; }
.breadcrumb-sep { color: #CBD5E1; }
.breadcrumb-current {
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.sync-btn:hover { border-color: #94A3B8; }
.sync-btn.offline { border-color: #FCD34D; background: #FFFBEB; color: #92400E; }

.page-content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.page-title { font-size: 24px; font-weight: 600; color: var(--text-primary); line-height: 1.25; }
.page-subtitle { margin-top: 4px; font-size: 13px; color: var(--text-muted); }
.header-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

/* BUTTONS, INPUTS, SEGMENTED CONTROLS */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--accent-green); color: #FFFFFF; }
.btn-primary:hover:not(:disabled) { background: var(--accent-green-hover); }
.btn-dark { background: #111315; color: #FFFFFF; }
.btn-dark:hover:not(:disabled) { background: #27272A; }
.btn-outline { background: #FFFFFF; border-color: #CBD5E1; color: var(--text-primary); }
.btn-outline:hover:not(:disabled) { background: #F8FAFC; border-color: #94A3B8; }
.btn-danger { background: var(--accent-red); color: #FFFFFF; }
.btn-danger:hover:not(:disabled) { background: #B91C1C; }
.btn-danger-outline { background: #FFFFFF; border-color: #FECACA; color: var(--accent-red); }
.btn-danger-outline:hover:not(:disabled) { background: #FEF2F2; }
.btn-sm { padding: 6px 11px; font-size: 12px; }

.btn-icon {
  padding: 6px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover { background: var(--bg-subtle); color: var(--text-primary); }
.btn-icon.danger:hover { background: #FEF2F2; color: var(--accent-red); }

.segmented {
  display: inline-flex;
  align-items: center;
  padding: 4px;
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  gap: 2px;
}

.segmented button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.segmented button:hover { color: var(--text-primary); }
.segmented button.active { background: #111315; color: #FFFFFF; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 500; color: #334155; }

.input, .select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #CBD5E1;
  border-radius: var(--radius-md);
  background: #FFFFFF;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input:focus, .select:focus {
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px rgba(20, 83, 45, 0.12);
}

.input-sm { padding: 6px 10px; font-size: 12px; }

.date-range-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 12px;
}

.date-range-box input {
  border: none;
  outline: none;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  background: transparent;
}

/* CARDS, GRIDS & TABLES */
.panel { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); }
.panel-pad { padding: 20px; }

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.panel-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.grid-12 { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 20px; }

.col-4 { grid-column: span 4; }
.col-5 { grid-column: span 5; }
.col-6 { grid-column: span 6; }
.col-7 { grid-column: span 7; }
.col-8 { grid-column: span 8; }

.kpi-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.kpi-label { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; }

.kpi-value {
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.kpi-meta { margin-top: 8px; font-size: 12px; color: var(--text-muted); }

.table-wrap { width: 100%; overflow-x: auto; }
table.data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }

table.data-table th {
  padding: 12px 18px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background: #F8FAFC;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

table.data-table td { padding: 13px 18px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
table.data-table tbody tr:last-child td { border-bottom: none; }
table.data-table tbody tr:hover { background: #F8FAFC; }
table.data-table tbody tr.row-void { background: rgba(254, 226, 226, 0.35); opacity: 0.78; }

/* POS LAYOUT */
.pos-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(330px, 1fr);
  gap: 20px;
  align-items: start;
}

.capster-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
}

.capster-btn-list { display: flex; flex-wrap: wrap; gap: 8px; }

.capster-btn {
  padding: 7px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: #FFFFFF;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 140ms ease;
}

.capster-btn.active { background: var(--accent-green); border-color: var(--accent-green); color: #FFFFFF; }

.catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 12px; }

.catalog-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  transition: border-color 140ms ease, transform 120ms ease;
}

.catalog-card:hover:not(:disabled) { border-color: var(--accent-green); }
.catalog-card:active:not(:disabled) { transform: scale(0.99); }
.catalog-card:disabled { opacity: 0.48; cursor: not-allowed; }
.catalog-card-foot { border-top: 1px solid var(--border-subtle); padding-top: 10px; }

.cart-panel { position: sticky; top: calc(var(--topbar-height) + 16px); display: flex; flex-direction: column; }
.cart-list { max-height: 320px; overflow-y: auto; padding: 4px 20px; }

.cart-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.cart-item:last-child { border-bottom: none; }
.qty-box { display: inline-flex; align-items: center; gap: 4px; }

.qty-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  background: #FFFFFF;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: var(--text-primary);
}

.qty-btn:hover { background: var(--bg-subtle); }

.cart-footer {
  border-top: 1px solid var(--border-color);
  background: #F8FAFC;
  padding: 18px 20px;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-secondary); }
.summary-total { border-top: 1px solid var(--border-color); padding-top: 10px; font-size: 15px; font-weight: 700; color: var(--text-primary); }
.pay-methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

.pay-method-btn {
  padding: 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.pay-method-btn.active { background: #111315; border-color: #111315; color: #FFFFFF; }
.quick-cash { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }

.quick-cash button {
  padding: 6px 4px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: #FFFFFF;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.quick-cash button:hover { border-color: #64748B; }

/* BAR CHART */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 230px;
  padding: 16px 6px 4px;
  border-bottom: 1px solid var(--border-color);
}

.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 6px; }
.bar-pair { width: 100%; max-width: 44px; height: 180px; display: flex; align-items: flex-end; justify-content: center; gap: 4px; }
.bar-rect { flex: 1; border-radius: 4px 4px 0 0; min-height: 2px; transition: height 220ms ease; }
.bar-rect.shop { background: var(--accent-green); }
.bar-rect.capster { background: var(--accent-amber); }
.bar-label { font-size: 11px; color: var(--text-muted); white-space: nowrap; }

/* MODAL, ALERTS & RECEIPT */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  max-height: 92vh;
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.modal-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { padding: 14px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px; background: #F8FAFC; }

.notice { padding: 10px 14px; border-radius: var(--radius-md); font-size: 12px; border: 1px solid var(--border-color); }
.notice.success { background: #ECFDF5; border-color: #A7F3D0; color: #065F46; }
.notice.error { background: #FEF2F2; border-color: #FECACA; color: #991B1B; }
.notice.warning { background: #FFFBEB; border-color: #FDE68A; color: #92400E; }

.receipt-paper {
  margin: 0 auto;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  padding: 18px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.55;
  color: #000000;
  white-space: pre;
  overflow-x: auto;
}

.receipt-paper.w-58 { max-width: 280px; }
.receipt-paper.w-80 { max-width: 350px; }

/* LOGIN SPLIT SCREEN */
.login-shell { min-height: 100vh; display: grid; grid-template-columns: 1.15fr 1fr; }

.login-hero {
  position: relative;
  background: #111315;
  color: #FFFFFF;
  padding: 44px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.login-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.52; }
.login-hero-scrim { position: absolute; inset: 0; background: linear-gradient(to top, #111315 5%, rgba(17, 19, 21, 0.58) 55%, rgba(17, 19, 21, 0.35) 100%); }
.login-hero-content { position: relative; z-index: 2; }
.login-hero h1 { font-size: clamp(28px, 3vw, 40px); line-height: 1.15; text-wrap: balance; max-width: 540px; }

.login-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.login-panel { display: flex; align-items: center; justify-content: center; padding: 36px 24px; background: var(--bg-canvas); }
.login-box { width: 100%; max-width: 430px; display: flex; flex-direction: column; gap: 24px; }
.role-demo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }

.role-demo-card {
  padding: 12px;
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease;
}

.role-demo-card:hover { border-color: #94A3B8; }
.role-demo-card.selected { border-color: var(--accent-green); background: var(--accent-green-soft); }

.inv-banner { display: grid; grid-template-columns: 280px 1fr; overflow: hidden; }
.inv-banner img { width: 100%; height: 100%; min-height: 140px; object-fit: cover; display: block; }

.sidebar-backdrop { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 39; }
.mobile-bottom-nav { display: none; }

/* RESPONSIVE BREAKPOINTS */
@media (max-width: 1120px) {
  .grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pos-layout { grid-template-columns: 1fr; }
  .cart-panel { position: static; }
  .col-4, .col-5, .col-6, .col-7, .col-8 { grid-column: span 12; }
}

@media (max-width: 900px) {
  .login-shell { grid-template-columns: 1fr; }
  .login-hero { display: none; }
  .sidebar { position: fixed; left: -280px; top: 0; transition: left 200ms ease; }
  .sidebar.open { left: 0; }
  .sidebar-backdrop.open { display: block; }
  .btn-menu-mobile { display: inline-flex; }
  .topbar { padding: 0 16px; height: 54px; }
  .app-main { padding-bottom: 68px; }
  .page-content { padding: 18px 16px; }
  .inv-banner { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: 1fr; }
  .btn, .input, .select, .capster-btn, .pay-method-btn { min-height: 44px; }
  .btn-sm { min-height: 36px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-actions { justify-content: flex-start; }
  .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .catalog-card { padding: 12px; }

  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60px;
    background: #FFFFFF;
    border-top: 1px solid var(--border-color);
    z-index: 38;
    padding: 4px 6px calc(4px + env(safe-area-inset-bottom, 0px));
    align-items: center;
    justify-content: space-around;
  }

  .mobile-bottom-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 100%;
    border: none;
    background: transparent;
    color: #64748B;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
  }

  .mobile-bottom-item svg { width: 19px; height: 19px; }
  .mobile-bottom-item.active { color: var(--accent-green); font-weight: 700; }
}

@media (max-width: 600px) {
  .grid-4, .grid-2, .role-demo-grid { grid-template-columns: 1fr; }
  .breadcrumb-root, .breadcrumb-sep { display: none; }
}

@media (max-width: 420px) {
  .catalog-grid { grid-template-columns: 1fr; }
}

/* PRINT THERMAL */
@media print {
  .mobile-bottom-nav, .sidebar, .topbar { display: none !important; }
  body * { visibility: hidden !important; }
  #thermal-print-area, #thermal-print-area * { visibility: visible !important; }
  #thermal-print-area {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 80mm !important;
    margin: 0 !important;
    padding: 4mm !important;
    border: none !important;
    box-shadow: none !important;
    background: #FFFFFF !important;
    color: #000000 !important;
  }
}
`;
    document.head.appendChild(styleEl);
  }

  /* ==========================================================================
     2. DAFTAR MENU SIDEBAR TERPUSAT (1 MENU = 1 FILE page-xxxxx.html)
     ========================================================================== */
  var MENU_ITEMS = [
    {
      id: 'dashboard',
      href: './page-dashboard.html',
      label: 'Dashboard',
      shortLabel: 'Beranda',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    },
    {
      id: 'kasir',
      href: './page-kasir.html',
      label: 'Kasir POS',
      shortLabel: 'Kasir',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    },
    {
      id: 'layanan',
      href: './page-layanan.html',
      label: 'Layanan & Tarif',
      shortLabel: 'Layanan',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    },
    {
      id: 'produk',
      href: './page-produk.html',
      label: 'Produk & Stok',
      shortLabel: 'Produk',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    },
    {
      id: 'gaji',
      href: './page-gaji.html',
      label: 'Capster & Gaji',
      shortLabel: 'Gaji',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    },
    {
      id: 'transaksi',
      href: './page-transaksi.html',
      label: 'Transaksi & Kas',
      shortLabel: 'Riwayat',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>',
    },
    {
      id: 'laporan',
      href: './page-laporan.html',
      label: 'Laporan Keuangan',
      shortLabel: 'Laporan',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    },
    {
      id: 'akun',
      href: './page-akun.html',
      label: 'Kelola Akun',
      shortLabel: 'Akun',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
    },
    {
      id: 'pengaturan',
      href: './page-pengaturan.html',
      label: 'Pengaturan',
      shortLabel: 'Atur',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
    },
  ];

  /* ==========================================================================
     3. RENDER SIDEBAR DESKTOP, TOPBAR, DRAWER & MOBILE BOTTOM NAV
     ========================================================================== */
  function applyBranding(settings, pageTitle, roleLabel) {
    var cfg = settings || {};
    var appName = String(cfg.appName || 'BarberDesk').trim() || 'BarberDesk';
    var shopName = String(cfg.shopName || appName).trim() || appName;
    var branchName = String(cfg.branchName || 'Cabang Utama').trim() || 'Cabang Utama';

    var brandEl = document.getElementById('sidebar-brand-name');
    if (brandEl) brandEl.textContent = appName;

    var topShopEl = document.getElementById('topbar-shop-name');
    if (topShopEl) topShopEl.textContent = shopName;

    var metaEl = document.getElementById('sidebar-user-meta');
    if (metaEl && roleLabel) metaEl.textContent = roleLabel + ' · ' + branchName;

    if (pageTitle) {
      document.title = pageTitle + ' — ' + appName;
    }
  }

  async function init(activePageId, pageTitle) {
    var user = global.AuthRBAC.requirePageAccess(activePageId);
    if (!user) return null;

    var state = await global.BarberDB.loadState();
    var roleLabel = global.AuthRBAC.ROLE_LABELS[user.role] || user.role;
    var appName = (state.settings && state.settings.appName) || 'BarberDesk';
    var shopName = (state.settings && state.settings.shopName) || appName;
    var branchName = (state.settings && state.settings.branchName) || 'Cabang Utama';

    var sidebarMount = document.getElementById('app-sidebar');
    var topbarMount = document.getElementById('app-topbar');

    var visibleItems = MENU_ITEMS.filter(function (item) {
      return global.AuthRBAC.canAccess(user.role, item.id);
    });

    if (sidebarMount) {
      sidebarMount.innerHTML =
        '<div class="sidebar-backdrop" id="sidebar-backdrop"></div>' +
        '<aside class="sidebar" id="sidebar-drawer">' +
          '<div class="sidebar-brand">' +
            '<div class="brand-mark">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
                '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>' +
                '<line x1="20" y1="4" x2="8.12" y2="15.88"/>' +
                '<line x1="14.47" y1="14.48" x2="20" y2="20"/>' +
                '<line x1="8.12" y1="8.12" x2="12" y2="12"/>' +
              '</svg>' +
            '</div>' +
            '<span class="brand-name truncate" id="sidebar-brand-name">' + appName + '</span>' +
          '</div>' +
          '<nav class="sidebar-nav">' +
            visibleItems.map(function (item) {
              return (
                '<a href="' + item.href + '" class="nav-link ' + (item.id === activePageId ? 'active' : '') + '">' +
                  item.icon +
                  '<span>' + item.label + '</span>' +
                '</a>'
              );
            }).join('') +
          '</nav>' +
          '<div class="sidebar-footer">' +
            '<div class="sidebar-user">' +
              '<div class="sidebar-user-name truncate">' + user.name + '</div>' +
              '<div class="sidebar-user-meta" id="sidebar-user-meta">' + roleLabel + ' · ' + branchName + '</div>' +
            '</div>' +
            '<button type="button" class="btn-logout" id="btn-app-logout">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>' +
              '</svg>' +
              '<span>Keluar / Ganti Akun</span>' +
            '</button>' +
          '</div>' +
        '</aside>';

      var logoutBtn = document.getElementById('btn-app-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          global.AuthRBAC.logout();
        });
      }
    }

    if (topbarMount) {
      topbarMount.innerHTML =
        '<header class="topbar">' +
          '<div class="topbar-left">' +
            '<button type="button" class="btn-menu-mobile" id="btn-toggle-sidebar" aria-label="Buka menu">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' +
              '</svg>' +
            '</button>' +
            '<div class="breadcrumb">' +
              '<span class="breadcrumb-root" id="topbar-shop-name">' + shopName + '</span>' +
              '<span class="breadcrumb-sep">/</span>' +
              '<span class="breadcrumb-current">' + pageTitle + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="topbar-right">' +
            '<button type="button" class="sync-btn" id="topbar-sync-btn" title="Status jaringan & antrean sinkronisasi offline">' +
              '<span id="topbar-sync-label">Memeriksa...</span>' +
            '</button>' +
          '</div>' +
        '</header>';

      var toggleBtn = document.getElementById('btn-toggle-sidebar');
      var drawer = document.getElementById('sidebar-drawer');
      var backdrop = document.getElementById('sidebar-backdrop');
      var closeMobile = function () {
        if (drawer) drawer.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
      };

      if (toggleBtn && drawer && backdrop) {
        toggleBtn.addEventListener('click', function () {
          drawer.classList.toggle('open');
          backdrop.classList.toggle('open');
        });
        backdrop.addEventListener('click', closeMobile);
      }

      var syncBtn = document.getElementById('topbar-sync-btn');
      if (syncBtn) {
        syncBtn.addEventListener('click', async function () {
          if (global.BarberDB.isOnlineNow()) {
            await global.BarberDB.syncNow();
          } else {
            global.location.href = './page-pengaturan.html';
          }
        });
      }
    }

    // Mobile Bottom Navigation Bar (HP <= 900px)
    if (!document.getElementById('mobile-bottom-nav')) {
      var primaryIds = user.role === 'kasir'
        ? ['kasir', 'transaksi', 'produk', 'pengaturan']
        : ['dashboard', 'kasir', 'gaji', 'transaksi'];
      var navBtns = primaryIds
        .map(function (id) {
          return visibleItems.find(function (x) { return x.id === id; });
        })
        .filter(Boolean);

      var bar = document.createElement('nav');
      bar.id = 'mobile-bottom-nav';
      bar.className = 'mobile-bottom-nav';
      bar.setAttribute('aria-label', 'Navigasi cepat ponsel');
      bar.innerHTML =
        navBtns.map(function (it) {
          return (
            '<a href="' + it.href + '" class="mobile-bottom-item ' + (it.id === activePageId ? 'active' : '') + '">' +
              it.icon +
              '<span>' + it.shortLabel + '</span>' +
            '</a>'
          );
        }).join('') +
        '<button type="button" class="mobile-bottom-item" id="mobile-bottom-more">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' +
          '</svg>' +
          '<span>Menu</span>' +
        '</button>';

      document.body.appendChild(bar);

      var moreBtn = document.getElementById('mobile-bottom-more');
      if (moreBtn) {
        moreBtn.addEventListener('click', function () {
          var d = document.getElementById('sidebar-drawer');
          var b = document.getElementById('sidebar-backdrop');
          if (d) d.classList.add('open');
          if (b) b.classList.add('open');
        });
      }
    }

    applyBranding(state.settings, pageTitle, roleLabel);

    async function refreshSyncIndicator() {
      var btn = document.getElementById('topbar-sync-btn');
      var label = document.getElementById('topbar-sync-label');
      if (!btn || !label) return;
      var online = global.BarberDB.isOnlineNow();
      var queue = await global.BarberDB.getQueue();
      if (online) {
        btn.classList.remove('offline');
        label.textContent = queue.length > 0 ? 'Online · ' + queue.length + ' antre' : 'Online · Tersinkron';
      } else {
        btn.classList.add('offline');
        label.textContent = 'Offline · ' + queue.length + ' antre';
      }
    }

    refreshSyncIndicator();
    global.addEventListener('barberdesk:sync-change', refreshSyncIndicator);
    global.addEventListener('barberdesk:settings-change', function (ev) {
      if (ev && ev.detail) applyBranding(ev.detail, pageTitle, roleLabel);
    });

    return {
      user: user,
      state: state,
      perms: global.AuthRBAC.getPermissions(user.role),
    };
  }

  global.BarberLayout = {
    init: init,
    applyBranding: applyBranding,
    MENU_ITEMS: MENU_ITEMS,
  };
})(window);
