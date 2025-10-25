export const getVisitTypeIcon = (type: string): { family: string; name: string } => {
  const icons: Record<string, { family: string; name: string }> = {
    primera_visita: { family: 'MaterialCommunityIcons', name: 'star-circle' },
    visita_seguimiento: { family: 'MaterialCommunityIcons', name: 'refresh-circle' },
    no_se_pudo_realizar: { family: 'MaterialIcons', name: 'cancel' },
  };
  return icons[type] || { family: 'MaterialIcons', name: 'help' };
};

export const getVisitStatusIcon = (status: string): { family: string; name: string } => {
  const icons: Record<string, { family: string; name: string }> = {
    realizada: { family: 'MaterialIcons', name: 'check-circle' },
    programada: { family: 'MaterialIcons', name: 'schedule' },
    cancelada: { family: 'MaterialIcons', name: 'cancel' },
  };
  return icons[status] || { family: 'MaterialIcons', name: 'help' };
};

export const getVisitTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    primera_visita: '#2196F3', // Azul
    visita_seguimiento: '#4CAF50', // Verde
    no_se_pudo_realizar: '#F44336', // Rojo
  };
  return colors[type] || '#9E9E9E'; // Gris
};

export const getVisitStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    realizada: '#4CAF50', // Verde
    programada: '#FF9800', // Naranja
    cancelada: '#F44336', // Rojo
  };
  return colors[status] || '#9E9E9E'; // Gris
};
