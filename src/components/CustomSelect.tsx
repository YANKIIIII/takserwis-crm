'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  name: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (e: any) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  searchable?: boolean;
}

export function CustomSelect({
  name,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  className = 'form-select',
  placeholder = '-- Wybierz --',
  style,
  searchable = false
}: CustomSelectProps) {
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
      // focus search input if searchable
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

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue: string) => {
    onChange({
      target: { name, value: optionValue }
    });
    setIsOpen(false);
    setSearch('');
  };

  // Filter out form-select from wrapper as it adds unwanted padding/borders to the container
  const wrapperClass = (className || '').replace('form-select', '').trim();

  const filteredOptions = searchable && search
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div 
      className={`custom-select-wrapper ${wrapperClass}`} 
      style={style} 
      ref={containerRef}
    >
      <div 
        className={`custom-select-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
      >
        <span className="custom-select-label">{displayLabel}</span>
        <span className="custom-select-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="custom-select-menu">
          {searchable && (
            <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'inherit', zIndex: 2 }}>
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
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input, rgba(255,255,255,0.8))',
                  color: 'var(--text-color)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="custom-select-empty">Brak opcji</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`custom-select-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Hidden native input for required validation if needed, though form validation will be tricky. */}
      {required && (
        <input 
          type="text" 
          name={name} 
          value={value || ''} 
          readOnly 
          required 
          style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} 
        />
      )}
    </div>
  );
}
