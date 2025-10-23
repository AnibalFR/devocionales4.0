import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Visita {
  id: string;
  visitDate: string;
  visitTime: string;
  visitType: string;
  visitStatus: string;
  familia: {
    id: string;
    nombre: string;
  };
  barrio?: {
    id: string;
    nombre: string;
  } | null;
  barrioOtro?: string | null;
  nucleo?: {
    id: string;
    nombre: string;
  } | null;
  visitadores?: Array<{
    id: string;
    nombre: string;
  }>;
  visitActivities: {
    conversacion_preocupaciones: boolean;
    oraciones: boolean;
    estudio_instituto: boolean;
    otro_estudio: boolean;
    invitacion_actividad: boolean;
  };
  materialDejado: {
    libro_oraciones: boolean;
    otro: boolean;
  };
  seguimientoVisita: boolean;
  tipoSeguimiento?: string | null;
  seguimientoFecha?: string | null;
  additionalNotes?: string | null;
  motivoNoVisita?: string | null;
  motivoNoVisitaOtra?: string | null;
  creadoPor: {
    nombre: string;
  };
  createdAt: string;
}

interface VisitaDetallesModalProps {
  visita: Visita;
  onClose: () => void;
}

const TIPO_LABELS: Record<string, string> = {
  primera_visita: 'Primera Visita',
  visita_seguimiento: 'Seguimiento',
  no_se_pudo_realizar: 'No Realizada',
};

const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  programada: 'bg-yellow-100 text-yellow-800',
  realizada: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-800',
};

const MOTIVO_NO_VISITA_LABELS: Record<string, string> = {
  no_abrieron: 'No abrieron la puerta',
  sin_tiempo: 'No tenían tiempo',
  otra: 'Otra razón',
};

const TIPO_SEGUIMIENTO_LABELS: Record<string, string> = {
  estudio_instituto: 'Estudio del Instituto',
  actividad_devocional: 'Actividad Devocional',
  visita_seguimiento: 'Visita de Seguimiento',
};

export function VisitaDetallesModal({ visita, onClose }: VisitaDetallesModalProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-xl text-gray-900">Detalles de la Visita</h3>
            <p className="text-sm text-gray-500 mt-1">
              Creada por {visita.creadoPor.nombre} el {formatDate(visita.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Sección 1: Información General */}
          <section className="border-b pb-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Información General
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Fecha y Hora</label>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDate(visita.visitDate)} - {visita.visitTime}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Estado</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    STATUS_COLORS[visita.visitStatus] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {STATUS_LABELS[visita.visitStatus] || visita.visitStatus}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Tipo de Visita</label>
                <p className="mt-1 font-medium text-gray-900">
                  {TIPO_LABELS[visita.visitType] || visita.visitType}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Familia</label>
                <p className="mt-1 font-medium text-gray-900">{visita.familia.nombre}</p>
              </div>
            </div>
          </section>

          {/* Sección 2: Ubicación */}
          <section className="border-b pb-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ubicación
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Barrio</label>
                <p className="mt-1 text-gray-900">
                  {visita.barrio?.nombre || visita.barrioOtro || '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Núcleo</label>
                <p className="mt-1 text-gray-900">{visita.nucleo?.nombre || '-'}</p>
              </div>
            </div>
          </section>

          {/* Sección 3: Visitadores */}
          <section className="border-b pb-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Visitadores
            </h4>
            <div className="flex flex-wrap gap-2">
              {visita.visitadores && visita.visitadores.length > 0 ? (
                visita.visitadores.map((visitador) => (
                  <span key={visitador.id} className="px-3 py-1.5 inline-flex text-sm font-medium rounded-full bg-primary-100 text-primary-800">
                    {visitador.nombre}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">No se registraron visitadores</p>
              )}
            </div>
          </section>

          {/* Sección 4: Actividades Realizadas (solo si no es "no_se_pudo_realizar") */}
          {visita.visitType !== 'no_se_pudo_realizar' && (
            <section className="border-b pb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Actividades Realizadas
              </h4>
              <div className="space-y-2">
                {visita.visitActivities.conversacion_preocupaciones && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Conversación sobre preocupaciones</span>
                  </div>
                )}
                {visita.visitActivities.oraciones && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Oraciones</span>
                  </div>
                )}
                {visita.visitActivities.estudio_instituto && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Estudio del Instituto</span>
                  </div>
                )}
                {visita.visitActivities.otro_estudio && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Otro estudio</span>
                  </div>
                )}
                {visita.visitActivities.invitacion_actividad && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Invitación a actividad</span>
                  </div>
                )}
                {!visita.visitActivities.conversacion_preocupaciones &&
                  !visita.visitActivities.oraciones &&
                  !visita.visitActivities.estudio_instituto &&
                  !visita.visitActivities.otro_estudio &&
                  !visita.visitActivities.invitacion_actividad && (
                    <p className="text-gray-500 italic">No se registraron actividades</p>
                  )}
              </div>
            </section>
          )}

          {/* Sección 5: Motivo si No se Realizó */}
          {visita.visitType === 'no_se_pudo_realizar' && (
            <section className="border-b pb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Motivo de No Realización
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800">
                  {visita.motivoNoVisita && MOTIVO_NO_VISITA_LABELS[visita.motivoNoVisita]}
                  {visita.motivoNoVisita === 'otra' && visita.motivoNoVisitaOtra && (
                    <span className="block text-sm mt-1">Detalles: {visita.motivoNoVisitaOtra}</span>
                  )}
                </p>
              </div>
            </section>
          )}

          {/* Sección 6: Material Dejado */}
          {visita.visitType !== 'no_se_pudo_realizar' && (
            <section className="border-b pb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Material Dejado
              </h4>
              <div className="space-y-2">
                {visita.materialDejado.libro_oraciones && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Libro de Oraciones</span>
                  </div>
                )}
                {visita.materialDejado.otro && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Otro material</span>
                  </div>
                )}
                {!visita.materialDejado.libro_oraciones && !visita.materialDejado.otro && (
                  <p className="text-gray-500 italic">No se dejó material</p>
                )}
              </div>
            </section>
          )}

          {/* Sección 7: Seguimiento Programado */}
          {visita.seguimientoVisita && (
            <section className="border-b pb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Seguimiento Programado
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                {visita.tipoSeguimiento && (
                  <div>
                    <label className="text-xs text-green-700 uppercase tracking-wide">Tipo</label>
                    <p className="text-green-900 font-medium">
                      {TIPO_SEGUIMIENTO_LABELS[visita.tipoSeguimiento] || visita.tipoSeguimiento}
                    </p>
                  </div>
                )}
                {visita.seguimientoFecha && (
                  <div>
                    <label className="text-xs text-green-700 uppercase tracking-wide">Fecha</label>
                    <p className="text-green-900 font-medium">{formatDate(visita.seguimientoFecha)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Sección 8: Notas Adicionales */}
          {visita.additionalNotes && (
            <section className="pb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notas Adicionales
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{visita.additionalNotes}</p>
              </div>
            </section>
          )}
        </div>

        {/* Footer con botón Cerrar */}
        <div className="modal-action mt-6">
          <button onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>
      {/* Backdrop - permite cerrar al hacer clic fuera del modal */}
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
