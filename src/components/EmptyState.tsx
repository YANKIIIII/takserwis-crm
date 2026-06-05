import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center', 
      padding: 'var(--space-3xl) var(--space-md)', 
      color: 'var(--text-muted)',
      background: 'var(--bg-white)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)'
    }}>
      {icon && <div style={{ marginBottom: 'var(--space-md)', color: 'var(--border)' }}>{icon}</div>}
      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</div>
    </div>
  );
}
