'use client';

import { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/CustomSelect';

type Tag = {
  id: number;
  entity: string;
  name: string;
  color: string;
};

interface TagSelectorProps {
  entity: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement> | { target: { name: string; value: string } }) => void;
  className?: string;
  required?: boolean;
}

export function TagSelector({ entity, name, value, onChange, className = 'form-select', required = false }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tags?entity=${entity}`)
      .then(res => res.json())
      .then(data => {
        setTags(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entity]);

  if (loading) {
    return <CustomSelect name={name} value="" options={[]} onChange={() => {}} disabled placeholder="Ładowanie tagów..." className={className} />;
  }

  const options = tags.map(tag => ({ value: tag.name, label: tag.name }));

  return (
    <CustomSelect 
      name={name} 
      className={className} 
      value={value} 
      onChange={onChange}
      required={required}
      options={options}
    />
  );
}
