'use client';

import { useEffect, useState } from 'react';

type Submission = {
  client_id: string;
  client_name: string;
  email?: string;
  cohort?: string;
  sector?: string;
  employees?: string;
  timestamp: string;
  overall_ssi?: number;
  scores?: { pipeline: number; conversion: number; expansion: number };
};

export default function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => setItems(data.submissions || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="shell stack">
      <section className="card stack">
        <h1>Admin Dashboard</h1>
        {error && <div style={{ color: '#ff6b6b' }}>{error}</div>}
        <div className="stack">
          {items.map((sub) => (
            <div key={sub.client_id} className="option" style={{ flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <strong>{sub.client_name || 'Unknown'}</strong>
                <span style={{ color: 'var(--muted)' }}>
                  {new Date(sub.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={{ color: 'var(--muted)' }}>
                Sector: {sub.sector || 'n/a'} · ARR: {sub.cohort || 'n/a'} · Employees:{' '}
                {sub.employees || 'n/a'}
              </div>
            </div>
          ))}
          {items.length === 0 && <p style={{ color: 'var(--muted)' }}>No submissions yet.</p>}
        </div>
      </section>
    </main>
  );
}
