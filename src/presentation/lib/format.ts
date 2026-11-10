export const formatNumber = (value: number | null) =>
  value === null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
