'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDialog } from '@/contexts/DialogContext';

const MenuItem = ({ icon, text, rightElement, onClick, href }: { icon: React.ReactNode, text: string, rightElement?: React.ReactNode, onClick?: (e?: any) => void, href?: string }) => {
  const content = (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10px 16px', 
        cursor: 'pointer',
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        transition: 'background 0.2s ease',
        textDecoration: 'none'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-body)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      onClick={onClick}
    >
      <div style={{ color: 'var(--text-muted)', marginRight: '12px', display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>{text}</div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );

  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content;
};

const MenuDivider = () => (
  <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
);

export default function TopHeader() {
  const { showAlert } = useDialog();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Just a visual toggle for now
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="top-header">
      <div className="top-header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image
            src="/images/logo.svg"
            alt="Tak Serwis"
            width={130}
            height={34}
            priority
            style={{ objectFit: 'contain' }}
          />
        </Link>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} className="top-header-sep-title" />
        <div style={{ fontSize: '15px', color: '#666', fontWeight: '500' }} className="top-header-title">Panel zarządzania serwisem</div>
      </div>

      <div className="top-header-right">
        {/* Active orders badge */}
        <div className="top-header-badge red">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          <span>0</span>
        </div>

        {/* Messages count */}
        <div className="top-header-badge default">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>134</span>
        </div>

        {/* Separator */}
        <div className="top-header-sep" />

        {/* Notifications bell */}
        <button className="top-header-icon-btn" title="Powiadomienia" onClick={async () => await showAlert('Brak nowych powiadomień')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* User avatar & dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button 
            className="top-header-avatar" 
            title="Profil"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{ 
              background: isUserMenuOpen ? 'var(--bg-body)' : 'transparent',
              outline: isUserMenuOpen ? '2px solid var(--border)' : 'none'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          {isUserMenuOpen && (
            <div 
              onClick={() => setIsUserMenuOpen(false)} // Close menu when item clicked
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                width: '280px',
                background: 'var(--bg-white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '8px 0',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <MenuItem href="/settings/account" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} text="Moje konto" />
              <MenuItem href="/settings/general" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>} text="Ustawienia ogólne" />
              <MenuItem href="/settings/jpk" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} text="Konfiguracja JPK" />
              <MenuItem href="/settings/sms" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg>} text="Bramka SMS" />
              <MenuItem href="/settings/email" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} text="E-mail" />
              <MenuItem href="/settings/reminders" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} text="Planowane przypomnienia" />
              <MenuItem href="/settings/tags" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>} text="Zarządzanie tagami" />
              
              <MenuDivider />
              
              <MenuItem href="/settings/history" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>} text="Historia zmian" />
              <MenuItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>} text="Ukryj czat" onClick={async () => await showAlert('Moduł czatu został ukryty')} />
              <MenuItem href="/settings/display" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>} text="Ustawienia ekranu" />
              
              {/* Toggle switch for Dark Mode */}
              <MenuItem 
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>} 
                text="Tryb ciemny" 
                onClick={(e) => {
                  e?.stopPropagation();
                  setIsDarkMode(!isDarkMode);
                  if (!isDarkMode) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }}
                rightElement={
                  <div style={{
                    width: '36px',
                    height: '20px',
                    background: isDarkMode ? 'var(--orange)' : 'var(--border)',
                    borderRadius: '10px',
                    position: 'relative',
                    transition: 'background 0.3s'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: isDarkMode ? '18px' : '2px',
                      width: '16px',
                      height: '16px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                }
              />
              
              <MenuItem 
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>} 
                text="Język" 
                onClick={async (e) => { e?.stopPropagation(); await showAlert('Wybór języka (wkrótce więcej opcji)'); }}
                rightElement={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>PL</span>
                    <div style={{ width: '20px', height: '14px', background: '#fff', border: '1px solid #eee', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '50%', width: '100%', height: '50%', background: '#dc143c' }} />
                    </div>
                  </div>
                }
              />
              
              <MenuItem href="/settings/workshops" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} text="Przełącz warsztat" />
              
              <MenuDivider />
              <MenuItem 
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} 
                text="Wyloguj się" 
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
