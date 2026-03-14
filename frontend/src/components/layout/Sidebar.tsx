'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/compare', label: 'Compare' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 border-r bg-white flex flex-col py-6 px-4 gap-1">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">
        Navigation
      </span>
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === href
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
