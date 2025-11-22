'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '../styles/report.css';

type StoredResults = {
  clientName: string;
  overall_ssi: number;
  loop_scores: { Pipeline: number; Conversion: number; Expansion: number };
  priority_recommendations?: { name: string; description: string; loop: string; score: number }[];
  detected_patterns?: { pattern: string; description: string; priority: string }[];
  timestamp: string;
};

export default function ReportPage() {
  const [data, setData] = useState<StoredResults | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('wizardResults');
    if (raw) setData(JSON.parse(raw));
  }, []);

  const downloadPdf = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const payload = await res.json();
      const url = payload.downloadUrl.startsWith('http')
        ? payload.downloadUrl
        : `${window.location.origin}${payload.downloadUrl}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!data) {
    return (
      <main className="report-shell">
        <div className="report-card">
          <h1>Report</h1>
          <p style={{ color: 'var(--muted)' }}>No results found. Complete the wizard first.</p>
          <Link href="/wizard" className="btn-ghost">
            Take Assessment
          </Link>
        </div>
      </main>
    );
  }

  const overall = Math.round(data.overall_ssi * 100);
  const pipeline = Math.round(data.loop_scores.Pipeline * 100);
  const conversion = Math.round(data.loop_scores.Conversion * 100);
  const expansion = Math.round(data.loop_scores.Expansion * 100);

  return (
    <main className="report-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link href="/" className="btn-ghost">
          ← Home
        </Link>
        <img src="/alpine-logo.png" alt="Alpine" style={{ height: 48 }} />
      </div>

      <div className="report-card" style={{ marginBottom: 18 }}>
        <div className="score-hero">
          <div className="score-block">
            <div className="tag">Overall ASR™</div>
            <p className="score-value">{overall}</p>
            <p style={{ color: 'var(--muted)' }}>
              Generated {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="score-block">
            <div className="tag">Loop Scores</div>
            <p style={{ margin: '6px 0' }}>Pipeline: {pipeline}%</p>
            <p style={{ margin: '6px 0' }}>Conversion: {conversion}%</p>
            <p style={{ margin: '6px 0' }}>Expansion: {expansion}%</p>
          </div>
        </div>
      </div>

      <div className="report-card" style={{ marginBottom: 18 }}>
        <h2 className="section-title">Priority Recommendations</h2>
        <div className="recommendations">
          {(data.priority_recommendations || []).map((rec) => (
            <div key={rec.name} className="rec-card">
              <div className="tag">{rec.loop}</div>
              <h4 style={{ margin: '8px 0' }}>{rec.name}</h4>
              <p style={{ color: 'var(--muted)', margin: 0 }}>{rec.description}</p>
            </div>
          ))}
          {(data.priority_recommendations || []).length === 0 && (
            <p style={{ color: 'var(--muted)' }}>No recommendations generated.</p>
          )}
        </div>
      </div>

      <div className="report-card" style={{ marginBottom: 18 }}>
        <h2 className="section-title">Patterns</h2>
        {(data.detected_patterns || []).length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No patterns detected.</p>
        )}
        {(data.detected_patterns || []).map((pat) => (
          <div key={pat.pattern} className="rec-card">
            <div className="tag">{pat.priority}</div>
            <strong>{pat.pattern}</strong>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{pat.description}</p>
          </div>
        ))}
      </div>

      <div className="report-card">
        <h2 className="section-title">Get the full PDF</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="cta" onClick={downloadPdf} disabled={pdfLoading}>
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </button>
          <Link href="/wizard" className="btn-ghost">
            Run Again
          </Link>
        </div>
      </div>
    </main>
  );
}
