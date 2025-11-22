'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WizardResponse } from '../../app_shared/types';
import '../styles/wizard.css';

type Question = {
  question: string;
  category?: string;
  descriptors?: Record<string, string>;
  options?: { value: string; label: string; category?: string }[];
};

type WizardConfig = {
  questions: Record<string, Question>;
  qualifiers?: Record<string, Question>;
};

const steps: { key: keyof WizardResponse | string; label: string }[] = [
  { key: 'question_1_pipeline_health', label: 'Pipeline Health' },
  { key: 'question_2_sales_conversion', label: 'Sales Conversion' },
  { key: 'arr', label: 'ARR' },
  { key: 'question_3_customer_success', label: 'Customer Success' },
  { key: 'sector', label: 'Sector' },
  { key: 'question_4_economics_and_efficiency', label: 'Economics & Efficiency' },
  { key: 'employees', label: 'Team Size' },
  { key: 'question_5_top_challenge', label: 'Top Challenge' },
  { key: 'final', label: 'Contact' }
];

export default function WizardPage() {
  const router = useRouter();
  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const lastAdvanceRef = useRef<string | null>(null);

  useEffect(() => {
    fetch('/wizard_questions.json')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => setError('Failed to load questions'));
  }, []);

  const currentStep = steps[stepIndex];
  const fallbackQuestions: Record<string, any> = {
    arr: {
      question: "What's your approximate ARR?",
      options: [
        { value: 'Cohort_1', label: '<$5M' },
        { value: 'Cohort_2', label: '$5M-$25M' },
        { value: 'Cohort_3', label: '$25M-$75M' },
        { value: 'Cohort_4', label: '$75M-$250M' }
      ]
    },
    sector: {
      question: 'What sector/industry are you in?',
      options: [
        { value: 'b2b_saas', label: 'B2B SaaS' },
        { value: 'enterprise_software', label: 'Enterprise Software' },
        { value: 'marketplace', label: 'Marketplace / Platform' },
        { value: 'services', label: 'Professional Services' },
        { value: 'other', label: 'Other' }
      ]
    },
    employees: {
      question: 'How many employees does your company have?',
      options: [
        { value: '1-50', label: '1-50 employees' },
        { value: '51-200', label: '51-200 employees' },
        { value: '201-500', label: '201-500 employees' },
        { value: '500+', label: '500+ employees' }
      ]
    }
  };

  const question =
    config?.questions?.[currentStep.key as string] ||
    config?.qualifiers?.[currentStep.key as string] ||
    fallbackQuestions[currentStep.key as string];

  const updateAnswer = (key: string, value: string, autoNext = false) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (autoNext) {
      if (lastAdvanceRef.current === key && answers[key] === value) return;
      lastAdvanceRef.current = key;
      setStepIndex((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  useEffect(() => {
    lastAdvanceRef.current = null;
  }, [stepIndex]);

  const next = () => setStepIndex((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStepIndex((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          client_name: answers.company_name,
          email: answers.user_email
        })
      });
      if (!response.ok) throw new Error('Submission failed');
      const data: WizardResponse = await response.json();
      const payload = {
        clientName: answers.company_name || 'Your Company',
        overall_ssi: data.overall_ssi,
        loop_scores: data.loop_scores,
        priority_recommendations: data.priority_recommendations,
        detected_patterns: data.detected_patterns,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('wizardResults', JSON.stringify(payload));
      router.push('/report');
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const isLast = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const isDropdownStep = ['arr', 'sector', 'employees'].includes(currentStep.key as string);
  const shouldAutoAdvanceRadios = !isDropdownStep && currentStep.key !== 'question_1_pipeline_health';

  return (
    <div className="wizard-page">
      <div className="wizard-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--cyan)' }}>
            ← Back to Home
          </Link>
          <img src="/alpine-logo.png" alt="Alpine" style={{ height: 48 }} />
        </div>
        <div className="wizard-card">
          <div className="wizard-header">
            <span className="tag">GTM Infrastructure Signal Rating</span>
            <h1>Alpine Signal Rating (ASR™)</h1>
            <p>Answer 5 core signals + 3 context qualifiers → get your GTM score and roadmap.</p>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            Step {stepIndex + 1} of {steps.length} — {currentStep.label}
          </div>

          {error && <div style={{ color: '#ff6b6b', marginBottom: 12 }}>{error}</div>}
          {!config && !error && <div>Loading questions...</div>}

          <>
              <div className={`question-card active`}>
                <div className="question-number">{currentStep.label}</div>
                <div className="question-text">
                  {question?.question ||
                    (currentStep.key === 'final'
                      ? 'Ready to see your GTM Signal Rating? Add details (optional) and view results.'
                      : 'Provide your answer to continue.')}
                </div>

                {question?.descriptors && (
                  <div className="option-group">
                {Object.entries(question.descriptors).map(([key, desc]) => (
                  <label
                    key={key}
                    className={`option-tile ${
                      answers[currentStep.key] === key ? 'selected' : ''
                    }`}
                    onClick={() => updateAnswer(currentStep.key, key, shouldAutoAdvanceRadios)}
                  >
                    <input
                      type="radio"
                      name={currentStep.key}
                      value={key}
                      checked={answers[currentStep.key] === key}
                      readOnly
                    />
                    <div>
                      <div className="option-label">Level {key}</div>
                      <div className="option-description">{String(desc)}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

                {currentStep.key === 'question_5_top_challenge' && question?.options && (
                  <div className="option-group">
                    {question.options.map((opt: { value: string; label: string; category?: string }) => (
                      <label
                        key={opt.value}
                        className={`option-tile ${
                          answers.question_5_top_challenge === opt.value ? 'selected' : ''
                        }`}
                      onClick={() =>
                        updateAnswer('question_5_top_challenge', opt.value, shouldAutoAdvanceRadios)
                      }
                    >
                        <input
                          type="radio"
                          name="question_5_top_challenge"
                          value={opt.value}
                          checked={answers.question_5_top_challenge === opt.value}
                          readOnly
                        />
                        <div>
                          <div className="option-label">{opt.label}</div>
                          <div className="option-description">{opt.category}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {isDropdownStep && (
                  <select
                    className="dropdown-select"
                    value={answers[currentStep.key] || ''}
                    onChange={(e) => updateAnswer(currentStep.key, e.target.value, false)}
                  >
                    <option value="">Select...</option>
                    {question?.options?.map((opt: { value: string; label: string }) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {currentStep.key === 'final' && (
                  <div className="option-group">
                    <div>
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={answers.company_name || ''}
                        onChange={(e) => updateAnswer('company_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Email</label>
                      <input
                        type="email"
                        value={answers.user_email || ''}
                        onChange={(e) => updateAnswer('user_email', e.target.value)}
                        placeholder="you@example.com"
                      />
                      <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
                        Optional: for sending your PDF report. We do not share your data.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="wizard-nav">
                <button
                  className="wizard-btn secondary"
                  onClick={prev}
                  disabled={stepIndex === 0}
                  type="button"
                >
                  Previous
                </button>
                {isDropdownStep && !isLast && (
                  <button
                    className="wizard-btn"
                    onClick={next}
                    disabled={!answers[currentStep.key]}
                    type="button"
                  >
                    Continue
                  </button>
                )}
                {!isDropdownStep &&
                  currentStep.key === 'question_1_pipeline_health' &&
                  !isLast && (
                    <button
                      className="wizard-btn"
                      onClick={next}
                      disabled={!answers[currentStep.key]}
                      type="button"
                    >
                      Next
                    </button>
                  )}
                {isLast && (
                  <button
                    className="wizard-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                    type="button"
                  >
                    {loading ? 'Submitting…' : 'See Results'}
                  </button>
                )}
              </div>
            </>
        </div>
        <div className="wizard-footer">
          <small>© The Alpine System — Assess. Fix. Scale. Repeat.</small>
        </div>
      </div>
    </div>
  );
}
