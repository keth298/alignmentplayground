'use client';

export default function PendingOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13, 15, 26, 0.75)', borderRadius: 8, pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 18, height: 18,
          border: '2px solid #6366f1', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Computing…</span>
      </div>
    </div>
  );
}
