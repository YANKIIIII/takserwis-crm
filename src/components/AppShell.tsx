'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;
      
      const btn = target.closest('.btn, .btn-icon') as HTMLElement;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        btn.style.setProperty('--mouse-x', `${x}px`);
        btn.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isPrintMode = pathname?.startsWith('/print');
  const isAuthMode = pathname?.startsWith('/login');

  if (isAuthMode) {
    return <>{children}</>;
  }

  if (isPrintMode) {
    return (
      <div className="print-mode-layout" style={{ background: '#fff', minHeight: '100vh', width: '100%' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="main-area">
        <TopHeader />
        <main className="main-content">
          {children}
        </main>
      </div>
      <Sidebar />
    </div>
  );
}
