'use client';

export default function Header() {
  return (
    <header className="h-14 border-b bg-white flex items-center px-6 shrink-0">
      <span className="font-bold text-gray-800 text-lg">Alignment Playground</span>
      <span className="ml-3 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
        beta
      </span>
    </header>
  );
}
