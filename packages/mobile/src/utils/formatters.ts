import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper para formatear fechas de forma segura
export const formatDate = (dateInput: string | number | null | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!dateInput) return '-';

  try {
    let date: Date;

    // Si es un número, usarlo directamente
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    }
    // Si es un string que parece un timestamp numérico, parsearlo
    else if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
      date = new Date(parseInt(dateInput, 10));
    }
    // Si es un string ISO, parsearlo normalmente
    else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '-';

    return format(date, formatStr, { locale: es });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '-';
  }
};

// Helper para obtener el label de tipo de visita
export const getTipoVisitaLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    primera_visita: 'Primera Visita',
    visita_seguimiento: 'Seguimiento',
    no_se_pudo_realizar: 'No Realizada',
  };
  return labels[tipo] || tipo;
};

// Helper para obtener el label de status
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    programada: 'Programada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
  };
  return labels[status] || status;
};

// Helper para obtener el color de tipo de visita
export const getTipoVisitaColor = (tipo: string): string => {
  const colors: Record<string, string> = {
    primera_visita: '#3B82F6', // blue
    visita_seguimiento: '#10B981', // green
    no_se_pudo_realizar: '#EF4444', // red
  };
  return colors[tipo] || '#6B7280'; // gray
};

// Helper para obtener el color de status
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    programada: '#F59E0B', // yellow
    realizada: '#10B981', // green
    cancelada: '#6B7280', // gray
  };
  return colors[status] || '#6B7280';
};
