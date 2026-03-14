'use client';

import { ReactNode } from 'react';

interface MainPanelProps {
  children: ReactNode;
}

export default function MainPanel({ children }: MainPanelProps) {
  return (
    <main className="flex-1 overflow-y-auto p-6 min-w-0">
      {children}
    </main>
  );
}
