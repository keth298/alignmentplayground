'use client';

interface BaselineFreezeButtonProps {
  onFreeze: () => void;
}

export default function BaselineFreezeButton({ onFreeze }: BaselineFreezeButtonProps) {
  return (
    <button
      onClick={onFreeze}
      title="Freeze current scores as baseline for delta comparison"
      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors"
    >
      Freeze baseline
    </button>
  );
}
