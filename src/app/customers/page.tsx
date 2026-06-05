'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/CustomSelect';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  plate: string;
  mileage: number | null;
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  vehicles: Vehicle[];
  _count: { vehicles: number };
  tags?: any[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadCustomers = useCallback(async (pageNum: number, isReset: boolean) => {
    if (loading) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: '50'
    });
    if (search) params.append('search', search);

    try {
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      
      if (data.length < 50) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setCustomers(prev => isReset ? data : [...prev, ...data]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]); // Intentionally omitting loading to avoid re-creations during fetch

  // Reset and load first page on search change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadCustomers(1, true);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadCustomers(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, loading, page, loadCustomers]);

  // handleCreate removed - logic moved to /customers/form

  const sortedCustomers = [...customers].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === 'az') return a.lastName.localeCompare(b.lastName);
    if (sort === 'za') return b.lastName.localeCompare(a.lastName);
    return 0;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Klienci</h1>
          <p className="page-subtitle">Zarządzanie bazą klientów i ich pojazdami</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/customers/form')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Dodaj klienta
        </button>
      </div>

      {/* Search & Sort */}
      <div className="filter-bar">
        <div className="search-bar">
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="form-input"
            placeholder="Szukaj po imieniu, telefonie lub email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <CustomSelect 
          name="sort"
          className="form-select" 
          value={sort} 
          onChange={e => setSort(e.target.value)} 
          style={{ minWidth: 160, width: 160 }}
          options={[
            { value: "newest", label: "Najnowsze" },
            { value: "oldest", label: "Najstarsze" },
            { value: "az", label: "Alfabetycznie A-Z" },
            { value: "za", label: "Alfabetycznie Z-A" }
          ]}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Klient</th>
              <th>Telefon</th>
              <th>Email</th>
              <th>Pojazdy</th>
              <th>Notatki</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((c) => (
              <tr
                key={c.id}
                className="hover-row"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/customers/${c.id}`)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span>
                    {c.tags && c.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {c.tags.map(tag => (
                          <span key={tag.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '100px', fontSize: '0.65rem', fontWeight: 600,
                            backgroundColor: `${tag.color}15`,
                            color: tag.color,
                            border: `1px solid ${tag.color}30`,
                            whiteSpace: 'nowrap',
                            boxShadow: `0 1px 2px ${tag.color}10`
                          }}>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{c.phone}</td>
                <td style={{ color: c.email ? 'var(--text-primary)' : 'var(--text-muted)' }}>{c.email || '—'}</td>
                <td>
                  <span className="badge badge-in-progress">{c._count.vehicles} pojazd(y)</span>
                </td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                  {c.notes || '—'}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {new Date(c.createdAt).toLocaleDateString('pl-PL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedCustomers.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
          Nie znaleziono klientów spełniających kryteria.
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--text-muted)' }}>
          Ładowanie...
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      <div ref={observerTarget} style={{ height: '20px', width: '100%' }} />
    </div>
  );
}
