export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export const MONL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const fmt = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
};
