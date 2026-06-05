'use client';
import { useState, useMemo, useEffect } from 'react';
import type { CalendarEvent } from '@prisma/client';
import { IconX } from '@/components/Icons';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];

const hours = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const colors = ['#4A7BF7', '#22C55E', '#F59E0B', '#E8384F', '#9333EA'];

export default function CalendarPage() {
  const { showAlert } = useDialog();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [startOfWeek]);

  // Generate some default events relative to the current week so the calendar isn't empty
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Fetch events when the week changes
  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => setEvents(data));
  }, [startOfWeek]);

  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string, hour: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<{ id: number, date: string, hour: string, title: string, mechanic: string, color: string } | null>(null);
  const [modalHour, setModalHour] = useState("08:00");

  const handleCellClick = (date: string, hour: string) => {
    setSelectedSlot({ date, hour });
    setModalHour(hour);
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (e: React.MouseEvent, ev: any) => {
    e.stopPropagation();
    setEditingEvent(ev);
    setModalHour(ev.hour);
    setSelectedSlot(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = form.get('title') as string;
    const mechanic = form.get('mechanic') as string;

    if (editingEvent) {
      const date = form.get('date') as string || editingEvent.date;
      const hour = form.get('hour') as string || editingEvent.hour;
      
      const res = await fetch(`/api/calendar/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, mechanic, date, hour, color: editingEvent.color })
      });
      if (res.ok) {
        const updatedEvent = await res.json();
        setEvents(events.map(ev => ev.id === editingEvent.id ? updatedEvent : ev));
      } else {
        await showAlert('Błąd aktualizacji');
      }
    } else {
      const date = selectedSlot?.date ?? (form.get('date') as string);
      const hour = selectedSlot?.hour ?? (modalHour);
      
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, mechanic, date, hour, color: colors[Math.floor(Math.random() * colors.length)] })
      });
      if (res.ok) {
        const newEvent = await res.json();
        setEvents([...events, newEvent]);
      } else {
        await showAlert('Błąd tworzenia');
      }
    }
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (editingEvent) {
      const res = await fetch(`/api/calendar/${editingEvent.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(events.filter(ev => ev.id !== editingEvent.id));
        setShowModal(false);
      } else {
        await showAlert('Błąd usuwania');
      }
    }
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Terminarz</h1>
          <p className="page-subtitle">Harmonogram pracy serwisu</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={handlePrevWeek} style={{ padding: '8px 12px' }}>&lt;</button>
          <input 
            type="date" 
            className="form-input" 
            value={formatDate(currentDate)}
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            style={{ width: 'auto' }}
          />
          <button className="btn btn-secondary" onClick={handleNextWeek} style={{ padding: '8px 12px' }}>&gt;</button>
          <button className="btn btn-primary" onClick={() => { setSelectedSlot(null); setModalHour("08:00"); setShowModal(true); }} style={{ marginLeft: 'var(--space-sm)' }}>+ Nowe wydarzenie</button>
        </div>
      </div>
      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 70, padding: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>Czas</th>
              {weekDates.map((d, i) => {
                const dateStr = formatDate(d);
                const isToday = dateStr === formatDate(new Date());
                return (
                  <th key={dateStr} style={{ padding: '10px', fontSize: '0.78rem', fontWeight: 600, color: i >= 5 ? 'var(--text-muted)' : 'var(--text-primary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>{dayNames[i]}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--orange)' : 'var(--text-secondary)' }}>
                        {d.toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hours.map(h => (
              <tr key={h}>
                <td style={{ padding: '8px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', fontFamily: 'var(--font-mono)' }}>{h}</td>
                {weekDates.map((d, i) => {
                  const dateStr = formatDate(d);
                  const evs = events.filter(e => e.date === dateStr && e.hour === h);
                  return (
                    <td 
                      key={dateStr} 
                      onClick={() => handleCellClick(dateStr, h)}
                      style={{ padding: '4px', borderBottom: '1px solid var(--border-light)', borderLeft: '1px solid var(--border-light)', height: 48, verticalAlign: 'top', cursor: 'pointer', transition: 'background 0.2s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {evs.map((ev) => (
                        <div key={ev.id} onClick={(e) => handleEventClick(e, ev)} style={{ background: ev.color + '15', borderLeft: `3px solid ${ev.color}`, borderRadius: 4, padding: '4px 8px', fontSize: '0.72rem', marginBottom: 2 }}>
                          <div style={{ fontWeight: 600, color: ev.color }}>{ev.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{ev.mechanic}</div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingEvent ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><IconX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {selectedSlot && !editingEvent && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--surface-hover)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                    Wybrany termin: <strong>{new Date(selectedSlot.date).toLocaleDateString('pl-PL')}, {selectedSlot.hour}</strong>
                  </div>
                )}
                {(!selectedSlot || editingEvent) && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Data *</label>
                      <input className="form-input" name="date" type="date" required defaultValue={editingEvent ? editingEvent.date : formatDate(new Date())} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Godzina *</label>
                      <CustomSelect 
                        name="hour" 
                        className="form-input" 
                        value={modalHour}
                        onChange={(e) => setModalHour(e.target.value)}
                        options={hours.map(h => ({ value: h, label: h }))}
                      />
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Tytuł wizyty / Pojazd *</label>
                  <input className="form-input" name="title" required placeholder="np. BMW 320d - wymiana oleju" defaultValue={editingEvent?.title || ''} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Mechanik</label>
                  <input className="form-input" name="mechanic" placeholder="np. Jan Kowalski" defaultValue={editingEvent?.mechanic || ''} />
                </div>
                <div className="modal-actions" style={{ marginTop: 'var(--space-md)', justifyContent: editingEvent ? 'space-between' : 'flex-end' }}>
                  {editingEvent && (
                    <button type="button" className="btn" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }} onClick={handleDelete}>Usuń</button>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Anuluj</button>
                    <button type="submit" className="btn btn-primary">Zapisz</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
