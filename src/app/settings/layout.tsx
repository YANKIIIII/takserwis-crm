'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const settingsMenu = [
  { group: 'Profil', items: [
    { name: 'Moje konto', path: '/settings/account', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { name: 'Ustawienia ekranu', path: '/settings/display', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> }
  ]},
  { group: 'Warsztat', items: [
    { name: 'Ustawienia ogólne', path: '/settings/general', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> },
    { name: 'Przełącz warsztat', path: '/settings/workshops', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
  ]},
  { group: 'Integracje', items: [
    { name: 'Konfiguracja JPK', path: '/settings/jpk', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { name: 'Bramka SMS', path: '/settings/sms', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg> },
    { name: 'E-mail / SMTP', path: '/settings/email', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
  ]},
  { group: 'System', items: [
    { name: 'Planowane przypomnienia', path: '/settings/reminders', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { name: 'Historia zmian', path: '/settings/history', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg> }
  ]}
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2xl)', minHeight: 'calc(100vh - 100px)' }}>
      {/* Sidebar Navigation */}
      <div style={{ 
        width: '260px', 
        flexShrink: 0,
        background: 'var(--bg-white)',
        borderRight: '1px solid var(--border)',
        padding: 'var(--space-xl) var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 'var(--space-xl)', paddingLeft: 'var(--space-sm)' }}>
          Ustawienia
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {settingsMenu.map(group => (
            <div key={group.group}>
              <h3 style={{ 
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                fontWeight: 700, 
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-sm)',
                paddingLeft: 'var(--space-sm)',
                letterSpacing: '0.5px'
              }}>
                {group.group}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map(item => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                  return (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: isActive ? 'var(--orange-high)' : 'var(--text-primary)',
                        background: isActive ? 'var(--orange-bg)' : 'transparent',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease'
                      }}
                      className={isActive ? '' : 'hover-bg-body'}
                    >
                      <div style={{ 
                        color: isActive ? 'var(--orange)' : 'var(--text-muted)',
                        display: 'flex', 
                        alignItems: 'center' 
                      }}>
                        {item.icon}
                      </div>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-fade-in" style={{ flex: 1, padding: 'var(--space-md) 0' }}>
        {children}
      </div>
    </div>
  );
}
