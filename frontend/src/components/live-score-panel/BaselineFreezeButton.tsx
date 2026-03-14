'use client';

interface BaselineFreezeButtonProps {
  onFreeze: () => void;
}

export default function BaselineFreezeButton({ onFreeze }: BaselineFreezeButtonProps) {
  return (
    <button
      onClick={onFreeze}
      title="Pin current scores as baseline for delta comparison"
      style={{
        fontSize: 10, padding: '3px 8px', borderRadius: 4,
        border: '1px solid var(--border-active)', background: 'transparent',
        color: 'var(--text-muted)', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      Pin
    </button>
  );
}
