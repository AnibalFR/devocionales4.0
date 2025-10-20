import { Edit3, Save } from 'lucide-react';

interface EditingIndicatorProps {
  isEditing: boolean;
  isSaving?: boolean;
  position?: 'top-right' | 'top-left' | 'inline';
}

export default function EditingIndicator({
  isEditing,
  isSaving = false,
  position = 'top-right'
}: EditingIndicatorProps) {
  if (!isEditing && !isSaving) return null;

  const positionClasses = {
    'top-right': 'absolute top-0 right-0 mt-1 mr-1',
    'top-left': 'absolute top-0 left-0 mt-1 ml-1',
    'inline': 'inline-flex ml-2',
  };

  if (isSaving) {
    return (
      <span
        className={`${positionClasses[position]} flex items-center gap-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm animate-pulse`}
        title="Guardando cambios..."
      >
        <Save size={10} />
        Guardando...
      </span>
    );
  }

  return (
    <span
      className={`${positionClasses[position]} flex items-center gap-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm`}
      title="Editando este campo"
    >
      <Edit3 size={10} />
      Editando
    </span>
  );
}
