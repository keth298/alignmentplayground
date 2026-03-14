'use client';

export default function PendingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/70 rounded-lg pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500">Computing&hellip;</span>
      </div>
    </div>
  );
}
