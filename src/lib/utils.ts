export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pl-PL');
  } catch (e) {
    return '—';
  }
}
