export function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'late':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'absent':
      return 'bg-red-50 text-red-600';
    case 'on-leave':
      return 'bg-blue-100 text-blue-800';
    case 'half-day':
      return 'bg-amber-100 text-amber-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export function getLeaveTypeColor(type: string): string {
  switch (type) {
    case 'sick':
      return 'bg-red-100 text-red-800';
    case 'casual':
      return 'bg-blue-100 text-blue-800';
    case 'earned':
      return 'bg-green-100 text-green-800';
    case 'emergency':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export function getDocumentIcon(type: string): string {
  const icons: Record<string, string> = {
    nid: '🪪',
    passport: '📘',
    cv: '📋',
    certificate: '🎓',
    offer_letter: '📨',
    appointment_letter: '📝',
    increment_letter: '📈',
    experience_certificate: '🏆',
    tax_document: '🧾',
    bank_statement: '🏦',
    academic_certificate: '🎓',
    training_certificate: '📜',
    photo: '🖼️',
    other: '📄',
  };
  return icons[type] || '📄';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
