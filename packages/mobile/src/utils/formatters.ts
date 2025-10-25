export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateLong = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString('es-MX');
};

export const getProgressColor = (percentage: number): string => {
  if (percentage >= 75) return '#4CAF50'; // Verde
  if (percentage >= 50) return '#FF9800'; // Naranja
  return '#F44336'; // Rojo
};

export const getRolLabel = (rol: string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    CEA: 'Comité de Enseñanza',
    MCA: 'Miembro del Comité',
    COLABORADOR: 'Colaborador',
    VISITANTE: 'Visitante',
  };
  return labels[rol] || rol;
};

export const getVisitTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    primera_visita: 'Primera Visita',
    visita_seguimiento: 'Seguimiento',
    no_se_pudo_realizar: 'No Realizada',
  };
  return labels[type] || type;
};

export const getVisitStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    realizada: 'Realizada',
    programada: 'Programada',
    cancelada: 'Cancelada',
  };
  return labels[status] || status;
};
