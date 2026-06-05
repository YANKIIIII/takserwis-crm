'use client';

import React, { useState, useRef, useEffect } from 'react';


export interface CustomMultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface CustomMultiSelectProps {
  options: CustomMultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  searchable?: boolean;
}

export function CustomMultiSelect({
  options,
  values,
  onChange,
  disabled = false,
  className = 'form-select',
  placeholder = '-- Wybierz --',
  searchable = true
}: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(''); // Clear search on close
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearch('');
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, searchable]);

  const toggleOption = (optionValue: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (values.includes(optionValue)) {
      onChange(values.filter(v => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter(v => v !== optionValue));
  };

  const wrapperClass = (className || '').replace('form-select', '').trim();

  const filteredOptions = searchable && search
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedOptions = options.filter(opt => values.includes(opt.value));

  return (
    <div 
      className={`custom-select-wrapper ${wrapperClass}`} 
      ref={containerRef}
    >
      <div 
        className={`custom-select-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        style={{ height: 'auto', minHeight: '42px', flexWrap: 'wrap', gap: '4px', padding: '4px 8px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, alignItems: 'center' }}>
          {selectedOptions.length === 0 ? (
            <span className="custom-select-label" style={{ padding: '4px' }}>{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span key={opt.value} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 500,
                backgroundColor: opt.color ? `${opt.color}15` : 'var(--bg-hover)',
                color: opt.color || 'var(--text-primary)',
                border: `1px solid ${opt.color ? opt.color + '40' : 'var(--border)'}`,
              }}>
                {opt.color && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: opt.color }}></span>}
                {opt.label}
                <button 
                  onClick={(e) => removeOption(opt.value, e)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'inherit' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>
        <span className="custom-select-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="custom-select-menu">
          {searchable && (
            <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'inherit', zIndex: 2 }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Szukaj..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="custom-select-empty">Brak opcji</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = values.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => toggleOption(opt.value, e)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: 'var(--primary-color)' }} />
                  {opt.color && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: opt.color }}></span>}
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
