'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';

interface ReportTableProps {
  columns: string[];
  dataList: any[];
}

export default function ReportTable({ columns, dataList }: ReportTableProps) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const observerTarget = useRef<HTMLDivElement>(null);

  const filteredData = useMemo(() => {
    if (!search.trim()) return dataList;
    const term = search.toLowerCase();
    
    return dataList.filter(row => {
      // Szukaj we wszystkich kolumnach
      return columns.some(col => {
        const val = row[col];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [dataList, columns, search]);

  // Zresetuj licznik widocznych elementów przy zmianie wyszukiwania
  useEffect(() => {
    setVisibleCount(50);
  }, [search]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 50, filteredData.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [filteredData.length]);

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div>
      <div className="no-print" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Szukaj w raporcie..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', background: 'var(--bg-body)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Znaleziono: <strong>{filteredData.length}</strong> {filteredData.length === 1 ? 'wpis' : 'wpisów'}
          </div>
          
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Drukuj
          </button>

          <button onClick={() => {
            import('xlsx').then((XLSX) => {
              const ws = XLSX.utils.json_to_sheet(filteredData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Raport");
              XLSX.writeFile(wb, "raport.xlsx");
            });
          }} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Excel
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>Brak danych</div>
                    <div style={{ fontSize: '0.85rem' }}>Nie znaleziono wpisów pasujących do kryteriów wyszukiwania.</div>
                  </div>
                </td>
              </tr>
            ) : (
              visibleData.map((row, idx) => (
                <tr key={idx} className="hover-row">
                  {columns.map(col => (
                    <td key={col} style={typeof row[col] === 'string' && row[col].includes(' zł') ? { textAlign: 'right', fontWeight: 600, color: 'var(--orange-high)' } : {}}>
                      {row[col] !== undefined && row[col] !== null ? String(row[col]) : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Infinite Scroll target */}
        {visibleCount < filteredData.length && (
          <div ref={observerTarget} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto', border: '2px solid var(--border)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
