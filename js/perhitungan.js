/**
 * ============================================================================
 * js/perhitungan.js — MESIN PERHITUNGAN UANG TERPUSAT (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * Seluruh halaman (Kasir, Dashboard, Layanan, Gaji, Transaksi, Laporan)
 * WAJIB mengambil hasil perhitungan uang dari file ini agar tidak ada selisih.
 *
 * Aturan Bagi Hasil Default:
 * - Jasa Rp 50.000 => 40% Capster (Rp 20.000) & 60% Toko (Rp 30.000)
 * - Diskon toko ditanggung porsi toko agar hak komisi capster tetap utuh
 * - Penjualan produk retail menghitung omzet, HPP, laba kotor, & komisi opsional
 */
(function (global) {
  'use strict';

  function formatRupiah(amount) {
    var safe = Number.isFinite(Number(amount)) ? Math.round(Number(amount)) : 0;
    var sign = safe < 0 ? '-' : '';
    return sign + 'Rp ' + Math.abs(safe).toLocaleString('id-ID');
  }

  function formatDateTime(iso) {
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDateShort(isoOrYmd) {
    if (!isoOrYmd) return '-';
    var d = new Date(isoOrYmd.length === 10 ? isoOrYmd + 'T00:00:00' : isoOrYmd);
    if (Number.isNaN(d.getTime())) return String(isoOrYmd);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function todayYmd() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function daysAgoYmd(days) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function isDateInRange(isoOrYmd, startYmd, endYmd) {
    var ymd = String(isoOrYmd || '').slice(0, 10);
    if (startYmd && ymd < startYmd) return false;
    if (endYmd && ymd > endYmd) return false;
    return true;
  }

  function getSplitConfig(settings) {
    var rawCap = settings && settings.defaultCapsterPct !== undefined ? Number(settings.defaultCapsterPct) : 40;
    var capPct = Number.isFinite(rawCap) ? Math.max(0, Math.min(100, Math.round(rawCap))) : 40;
    var shopPct = 100 - capPct;
    return {
      capsterPct: capPct,
      shopPct: shopPct,
      label: capPct + '% Capster / ' + shopPct + '% Toko',
      shortLabel: capPct + ' / ' + shopPct,
    };
  }

  function calculateServiceLine(service, qty, defaultCapsterPct) {
    var safeQty = Math.max(1, Math.floor(Number(qty) || 1));
    var unitPrice = Math.max(0, Math.round(Number(service.price) || 0));
    var subtotal = unitPrice * safeQty;
    var fallbackPct = defaultCapsterPct !== undefined ? Number(defaultCapsterPct) : 40;
    var rawPct = service && service.capsterSharePct !== undefined ? Number(service.capsterSharePct) : fallbackPct;
    var capPct = Math.max(0, Math.min(100, Number.isFinite(rawPct) ? rawPct : 40));
    var capsterShareAmount = Math.round((subtotal * capPct) / 100);
    var shopShareAmount = subtotal - capsterShareAmount;

    return {
      qty: safeQty,
      unitPrice: unitPrice,
      subtotal: subtotal,
      capsterSharePct: capPct,
      shopSharePct: 100 - capPct,
      capsterShareAmount: capsterShareAmount,
      shopShareAmount: shopShareAmount,
    };
  }

  function calculateProductLine(product, qty, hasRecommendingCapster) {
    var safeQty = Math.max(1, Math.floor(Number(qty) || 1));
    var unitPrice = Math.max(0, Math.round(Number(product.sellPrice) || 0));
    var costPrice = Math.max(0, Math.round(Number(product.costPrice) || 0));
    var subtotal = unitPrice * safeQty;
    var totalCost = costPrice * safeQty;
    var capPct = hasRecommendingCapster
      ? Math.max(0, Math.min(50, Number(product.capsterCommissionPct || 0)))
      : 0;
    var capsterShareAmount = Math.round((subtotal * capPct) / 100);
    var shopShareAmount = subtotal - capsterShareAmount;
    var grossProfit = subtotal - totalCost - capsterShareAmount;

    return {
      qty: safeQty,
      unitPrice: unitPrice,
      costPrice: costPrice,
      subtotal: subtotal,
      totalCost: totalCost,
      capsterSharePct: capPct,
      shopSharePct: 100 - capPct,
      capsterShareAmount: capsterShareAmount,
      shopShareAmount: shopShareAmount,
      grossProfit: grossProfit,
    };
  }

  function calculateCartSummary(items, discountInput, paidInput) {
    var subtotal = 0;
    var totalServiceGross = 0;
    var totalCapsterServiceShare = 0;
    var totalCapsterProductShare = 0;
    var totalShopServiceShare = 0;
    var totalProductSales = 0;
    var totalProductCost = 0;

    (items || []).forEach(function (item) {
      subtotal += Number(item.subtotal) || 0;
      if (item.itemType === 'service') {
        totalServiceGross += Number(item.subtotal) || 0;
        totalCapsterServiceShare += Number(item.capsterShareAmount) || 0;
        totalShopServiceShare += Number(item.shopShareAmount) || 0;
      } else {
        totalProductSales += Number(item.subtotal) || 0;
        totalProductCost += (Number(item.costPrice) || 0) * (Number(item.qty) || 1);
        totalCapsterProductShare += Number(item.capsterShareAmount) || 0;
      }
    });

    var discount = Math.max(0, Math.min(subtotal, Math.round(Number(discountInput) || 0)));
    var total = Math.max(0, subtotal - discount);
    var paidAmount = Math.max(0, Math.round(Number(paidInput) || 0));
    var changeAmount = Math.max(0, paidAmount - total);
    var totalCapsterShare = totalCapsterServiceShare + totalCapsterProductShare;
    var totalShopGross =
      totalShopServiceShare + totalProductSales - totalCapsterProductShare - discount;

    return {
      subtotal: subtotal,
      discount: discount,
      total: total,
      paidAmount: paidAmount,
      changeAmount: changeAmount,
      totalServiceGross: totalServiceGross,
      totalCapsterServiceShare: totalCapsterServiceShare,
      totalCapsterProductShare: totalCapsterProductShare,
      totalCapsterShare: totalCapsterShare,
      totalShopServiceShare: totalShopServiceShare,
      totalProductSales: totalProductSales,
      totalProductCost: totalProductCost,
      totalShopGross: totalShopGross,
    };
  }

  function calculateLedger(db, startYmd, endYmd) {
    var transactions = (db && db.transactions) || [];
    var expenses = (db && db.expenses) || [];
    var payrolls = (db && db.payrolls) || [];

    var transactionCount = 0;
    var voidCount = 0;
    var serviceUnitsCount = 0;
    var productUnitsCount = 0;
    var grossRevenue = 0;
    var totalDiscount = 0;
    var grossServiceRevenue = 0;
    var totalCapsterServiceShare = 0;
    var totalCapsterProductShare = 0;
    var totalShopServiceShare = 0;
    var totalProductSales = 0;
    var totalProductCost = 0;
    var cashInTunai = 0;
    var cashInQris = 0;
    var cashInTransfer = 0;

    transactions.forEach(function (trx) {
      if (!isDateInRange(trx.createdAt, startYmd, endYmd)) return;
      if (trx.status === 'void') {
        voidCount += 1;
        return;
      }

      transactionCount += 1;
      grossRevenue += Number(trx.total) || 0;
      totalDiscount += Number(trx.discount) || 0;

      if (trx.paymentMethod === 'tunai') cashInTunai += Number(trx.total) || 0;
      else if (trx.paymentMethod === 'qris') cashInQris += Number(trx.total) || 0;
      else cashInTransfer += Number(trx.total) || 0;

      (trx.items || []).forEach(function (item) {
        if (item.itemType === 'service') {
          serviceUnitsCount += Number(item.qty) || 1;
          grossServiceRevenue += Number(item.subtotal) || 0;
          totalCapsterServiceShare += Number(item.capsterShareAmount) || 0;
          totalShopServiceShare += Number(item.shopShareAmount) || 0;
        } else {
          productUnitsCount += Number(item.qty) || 1;
          totalProductSales += Number(item.subtotal) || 0;
          totalProductCost += (Number(item.costPrice) || 0) * (Number(item.qty) || 1);
          totalCapsterProductShare += Number(item.capsterShareAmount) || 0;
        }
      });
    });

    var totalCapsterShare = totalCapsterServiceShare + totalCapsterProductShare;
    var productGrossProfit = totalProductSales - totalProductCost - totalCapsterProductShare;
    var shopGrossIncome =
      totalShopServiceShare + totalProductSales - totalCapsterProductShare - totalDiscount;

    var operationalExpenses = 0;
    var allExpensesIncludingPayroll = 0;
    expenses.forEach(function (exp) {
      if (!isDateInRange(exp.date, startYmd, endYmd)) return;
      var amt = Number(exp.amount) || 0;
      allExpensesIncludingPayroll += amt;
      if (exp.category !== 'Gaji & Komisi') {
        operationalExpenses += amt;
      }
    });

    var payrollDisbursedTotal = 0;
    payrolls.forEach(function (pay) {
      if (!isDateInRange(pay.paidAt, startYmd, endYmd)) return;
      payrollDisbursedTotal += Number(pay.netPay) || 0;
    });

    var netShopProfit =
      totalShopServiceShare + productGrossProfit - totalDiscount - operationalExpenses;
    var cashOnHandBalance = grossRevenue - allExpensesIncludingPayroll;

    return {
      transactionCount: transactionCount,
      voidCount: voidCount,
      serviceUnitsCount: serviceUnitsCount,
      productUnitsCount: productUnitsCount,
      grossRevenue: grossRevenue,
      totalDiscount: totalDiscount,
      grossServiceRevenue: grossServiceRevenue,
      totalCapsterServiceShare: totalCapsterServiceShare,
      totalCapsterProductShare: totalCapsterProductShare,
      totalCapsterShare: totalCapsterShare,
      totalShopServiceShare: totalShopServiceShare,
      totalProductSales: totalProductSales,
      totalProductCost: totalProductCost,
      productGrossProfit: productGrossProfit,
      shopGrossIncome: shopGrossIncome,
      operationalExpenses: operationalExpenses,
      payrollDisbursedTotal: payrollDisbursedTotal,
      allExpensesIncludingPayroll: allExpensesIncludingPayroll,
      netShopProfit: netShopProfit,
      cashInTunai: cashInTunai,
      cashInQris: cashInQris,
      cashInTransfer: cashInTransfer,
      cashOnHandBalance: cashOnHandBalance,
    };
  }

  function calculateCapsterPayroll(db, periodStart, periodEnd) {
    var capsters = (db && db.capsters) || [];
    var transactions = (db && db.transactions) || [];
    var payrolls = (db && db.payrolls) || [];

    return capsters.map(function (capster) {
      var serviceCount = 0;
      var grossServiceRevenue = 0;
      var serviceCommission = 0;
      var shopServiceContribution = 0;
      var productCommission = 0;

      transactions.forEach(function (trx) {
        if (trx.status === 'void') return;
        if (!isDateInRange(trx.createdAt, periodStart, periodEnd)) return;
        (trx.items || []).forEach(function (item) {
          if (item.capsterId !== capster.id) return;
          if (item.itemType === 'service') {
            serviceCount += Number(item.qty) || 1;
            grossServiceRevenue += Number(item.subtotal) || 0;
            serviceCommission += Number(item.capsterShareAmount) || 0;
            shopServiceContribution += Number(item.shopShareAmount) || 0;
          } else {
            productCommission += Number(item.capsterShareAmount) || 0;
          }
        });
      });

      var totalEarnedCommission = serviceCommission + productCommission;
      var payrollsInPeriod = payrolls.filter(function (p) {
        return (
          p.capsterId === capster.id &&
          p.periodEnd >= periodStart &&
          p.periodStart <= periodEnd
        );
      });
      var paidServiceCommission = payrollsInPeriod.reduce(function (sum, p) {
        return sum + (Number(p.serviceCommission) || 0);
      }, 0);
      var paidProductCommission = payrollsInPeriod.reduce(function (sum, p) {
        return sum + (Number(p.productCommission) || 0);
      }, 0);
      var alreadyPaidInPeriod = paidServiceCommission + paidProductCommission;
      
      return {
        capster: capster,
        serviceCount: serviceCount,
        grossServiceRevenue: grossServiceRevenue,
        serviceCommission: serviceCommission,
        shopServiceContribution: shopServiceContribution,
        productCommission: productCommission,
        totalEarnedCommission: totalEarnedCommission,
        alreadyPaidInPeriod: alreadyPaidInPeriod,
        remainingCommission: Math.max(0, totalEarnedCommission - alreadyPaidInPeriod),
        remainingServiceCommission: Math.max(0, serviceCommission - paidServiceCommission),
        remainingProductCommission: Math.max(0, productCommission - paidProductCommission),
      };
    });
  }

  function calculatePayrollNetPay(summary, allowance, bonus, deductions) {
    return Math.max(
      0,
      (Number(summary.remainingServiceCommission) || 0) +
        (Number(summary.remainingProductCommission) || 0) +
        (Number(allowance) || 0) +
        (Number(bonus) || 0) -
        (Number(deductions) || 0)
    );
  }

  function buildDailySeries(db, days) {
    var count = days || 7;
    var points = [];
    var today = new Date();
    for (var i = count - 1; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(today.getDate() - i);
      var ymd =
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0');
      var label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      var ledger = calculateLedger(db, ymd, ymd);
      points.push({
        date: ymd,
        label: label,
        omzet: ledger.grossRevenue,
        bagianToko: ledger.shopGrossIncome,
        hakCapster: ledger.totalCapsterShare,
      });
    }
    return points;
  }

  global.FinanceEngine = {
    formatRupiah: formatRupiah,
    formatDateTime: formatDateTime,
    formatDateShort: formatDateShort,
    todayYmd: todayYmd,
    daysAgoYmd: daysAgoYmd,
    isDateInRange: isDateInRange,
    getSplitConfig: getSplitConfig,
    calculateServiceLine: calculateServiceLine,
    calculateProductLine: calculateProductLine,
    calculateCartSummary: calculateCartSummary,
    calculateLedger: calculateLedger,
    calculateCapsterPayroll: calculateCapsterPayroll,
    calculatePayrollNetPay: calculatePayrollNetPay,
    buildDailySeries: buildDailySeries,
  };
})(window);
