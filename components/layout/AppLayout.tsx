'use client';

import { ReactNode } from 'react';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  trending?: { title: string; id: string; score?: number; source_name?: string }[];
  topics?: string[];
  hideRightPanel?: boolean;
  rightPanelContent?: ReactNode;
}

export function AppLayout({
  children,
  trending = [],
  topics = [],
  hideRightPanel = false,
  rightPanelContent,
}: AppLayoutProps) {
  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="flex w-full max-w-[1265px]">
        {/* Left Sidebar — TOUJOURS monté sur desktop, masqué mobile */}
        <div className="hidden md:block w-[68px] xl:w-[275px] shrink-0 border-r border-border/40">
          <LeftSidebar />
        </div>

        {/* Main Feed */}
        <main className={cn(
          "flex-1 min-w-0",
          "border-r border-border/40",
        )}>
          <Header />
          <div className="pb-14 md:pb-0">
            {children}
          </div>
        </main>

        {/* Right Panel — masqué sur tablet/mobile */}
        {!hideRightPanel && (
          <div className="hidden xl:block w-[350px] shrink-0">
            <RightPanel
              trending={trending}
              topics={topics}
              customContent={rightPanelContent}
            />
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
