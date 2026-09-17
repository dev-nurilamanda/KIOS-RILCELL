import { RilcellTransaction, RilcellSettings } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function generateInvoiceNumber(sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `RIL-${year}${month}${day}-${seq}`;
}

export function detectProvider(number: string): string {
  const clean = number.replace(/[^0-9]/g, '');
  if (!clean) return '';

  // PLN Meter / ID Pelanggan (usually 11-12 digits starting with non-08)
  if (!clean.startsWith('08') && clean.length >= 11) {
    return 'PLN Prabayar / Pascabayar';
  }

  // Telkomsel: 0811, 0812, 0813, 0821, 0822, 0823, 0851, 0852, 0853
  if (/^08(11|12|13|21|22|23|51|52|53)/.test(clean)) return 'Telkomsel';

  // Indosat: 0814, 0815, 0816, 0855, 0856, 0857, 0858
  if (/^08(14|15|16|55|56|57|58)/.test(clean)) return 'Indosat';

  // XL: 0817, 0818, 0819, 0859, 0877, 0878
  if (/^08(17|18|19|59|77|78)/.test(clean)) return 'XL Axiata';

  // AXIS: 0831, 0832, 0833, 0838
  if (/^08(31|32|33|38)/.test(clean)) return 'AXIS';

  // Tri (3): 0895, 0896, 0897, 0898, 0899
  if (/^08(95|96|97|98|99)/.test(clean)) return 'Tri (3)';

  // Smartfren: 0881, 0882, 0883, 0884, 0885, 0886, 0887, 0888, 0889
  if (/^08(81|82|83|84|85|86|87|88|89)/.test(clean)) return 'Smartfren';

  return 'Nomor / ID';
}

export function generateWhatsAppReceipt(
  trx: RilcellTransaction,
  settings: RilcellSettings
): string {
  const line = '--------------------------------';
  const statusStr = trx.status === 'sukses' ? '✅ SUKSES' : trx.status === 'pending' ? '⏳ PROSES' : '❌ GAGAL';

  return `*${settings.storeName.toUpperCase()}*
${settings.tagline}
${settings.address}
WA: ${settings.phone}
${line}
*BUKTI TRANSAKSI PEMBAYARAN*
No. Ref   : ${trx.invoiceNumber}
Waktu     : ${formatDate(trx.timestamp)}
Kasir     : ${settings.cashierName}
${line}
Layanan   : *${trx.serviceName}*
Tujuan    : *${trx.targetNumber}*
${trx.provider ? `Provider  : ${trx.provider}\n` : ''}${trx.snRefNumber ? `No. Seri  : *${trx.snRefNumber}*\n` : ''}Status    : *${statusStr}*
${line}
Total Bayar: *${formatRupiah(trx.sellingPrice)}*
Metode     : *${(trx.paymentMethod || 'tunai').toUpperCase()}*
${line}
${settings.receiptFooter}
`;
}
