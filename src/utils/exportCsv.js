export function exportCsv(rows, filename = 'dynemech-fms-registry.csv') {
  const head = ['Code', 'FMS name', 'Department', 'Status', 'SOP link', 'FMS link'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [head, ...rows.map((r) => [r.code ?? '', r.title, r.category, r.status, r.sop ?? '', r.fms ?? ''])]
    .map((l) => l.map(esc).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff' + lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
