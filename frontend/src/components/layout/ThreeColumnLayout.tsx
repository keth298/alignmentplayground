'use client';

import { ReactNode } from 'react';

interface ThreeColumnLayoutProps {
  ruleEditor: ReactNode;
  main: ReactNode;
  liveScorePanel: ReactNode;
}

/**
 * Permanent three-column layout:
 * | Rule Editor (left, fixed width) | Main content (center, flex-grow) | Live Score Panel (right, fixed width) |
 *
 * The Live Score Panel is always visible and never hidden behind a tab.
 * On narrow viewports (<768px) the panel moves to a bottom drawer.
 */
export default function ThreeColumnLayout({
  ruleEditor,
  main,
  liveScorePanel,
}: ThreeColumnLayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Rule Editor */}
      <aside className="w-72 shrink-0 border-r bg-white overflow-y-auto p-4">
        {ruleEditor}
      </aside>

      {/* Center: Main content */}
      <main className="flex-1 overflow-y-auto min-w-0 p-6">
        {main}
      </main>

      {/* Right: Live Score Panel — always visible */}
      <div className="hidden md:flex">
        {liveScorePanel}
      </div>

      {/* Narrow screens: bottom drawer placeholder */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-20 p-3">
        {liveScorePanel}
      </div>
    </div>
  );
}
