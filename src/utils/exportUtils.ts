import { sanitizeCsvCell, sanitizeText } from './security';
import { globalRateLimiter, RATE_LIMIT_CONFIGS } from './rateLimiter';

export function exportToCSV(filename: string, rows: Record<string, any>[]): { success: boolean; message?: string } {
  // Rate limit exports to prevent automated file generation flooding
  const limitCheck = globalRateLimiter.check(
    'export:csv',
    RATE_LIMIT_CONFIGS.EXPORT.max,
    RATE_LIMIT_CONFIGS.EXPORT.windowMs,
    RATE_LIMIT_CONFIGS.EXPORT.lockoutMs
  );

  if (!limitCheck.allowed) {
    const msg = `Límite de descargas alcanzado. Por favor espera ${limitCheck.retryAfterSeconds} segundos antes de exportar nuevamente.`;
    return { success: false, message: msg };
  }

  if (!rows || !rows.length) {
    return { success: false, message: 'No hay datos disponibles para exportar.' };
  }

  globalRateLimiter.hit('export:csv');

  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  // Safe header generation
  const header = keys.map(k => sanitizeCsvCell(sanitizeText(k))).join(separator);

  // Safe row generation with formula injection prevention
  const csvRows = rows.map(row => {
    return keys
      .map(k => {
        const val = row[k];
        return sanitizeCsvCell(val);
      })
      .join(separator);
  });

  const csvContent = header + '\n' + csvRows.join('\n');
  const safeFilename = sanitizeText(filename).replace(/[^a-zA-Z0-9_\-]/g, '_') || 'reporte';

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${safeFilename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { success: true };
}

export function exportToJSON(filename: string, data: any): { success: boolean; message?: string } {
  // Rate limit export
  const limitCheck = globalRateLimiter.check(
    'export:json',
    RATE_LIMIT_CONFIGS.EXPORT.max,
    RATE_LIMIT_CONFIGS.EXPORT.windowMs,
    RATE_LIMIT_CONFIGS.EXPORT.lockoutMs
  );

  if (!limitCheck.allowed) {
    const msg = `Límite de descargas alcanzado. Espera ${limitCheck.retryAfterSeconds} segundos.`;
    return { success: false, message: msg };
  }

  globalRateLimiter.hit('export:json');

  const safeFilename = sanitizeText(filename).replace(/[^a-zA-Z0-9_\-]/g, '_') || 'export';
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const link = document.createElement('a');
  link.href = jsonString;
  link.setAttribute('download', `${safeFilename}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { success: true };
}

