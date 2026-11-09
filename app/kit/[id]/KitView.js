'use client';

import { useState } from 'react';

export default function KitView({ content }) {
  const guide = content?.guide || { overview: '', sections: [] };
  const flashcards = content?.flashcards || [];
  const quiz = content?.quiz || [];
  const [tab, setTab] = useState('guide');

  const tabs = [
    ['guide', 'Training guide'],
    ['cards', `Flashcards (${flashcards.length})`],
    ['quiz', `Quiz (${quiz.length})`],
  ];

  return (
    <div>
      <div className="tabs" role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'guide' && <Guide guide={guide} />}
      {tab === 'cards' && <Flashcards cards={flashcards} />}
      {tab === 'quiz' && <Quiz questions={quiz} />}
    </div>
  );
}

function Guide({ guide }) {
  return (
    <div>
      {guide.overview && <p className="guide-overview">{guide.overview}</p>}
      <div className="guide-sections">
        {guide.sections.map((s, i) => (
          <div className="card" key={i}>
            <h3>{s.title}</h3>
            <ul>
              {s.points.map((p, j) => (
                <li key={j}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Flashcards({ cards }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards.length) return <p className="fine">No flashcards in this kit.</p>;
  const card = cards[i];
  const go = (d) => {
    setFlipped(false);
    setI((i + d + cards.length) % cards.length);
  };
  return (
    <div className="flash-wrap">
      <div
        className={`card flashcard ${flipped ? 'back' : ''}`}
        onClick={() => setFlipped(!flipped)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setFlipped(!flipped))}
      >
        <div className="side">{flipped ? 'Answer' : 'Question'} · tap to flip</div>
        <div className="text">{flipped ? card.back : card.front}</div>
      </div>
      <div className="flash-controls">
        <button className="btn ghost small" onClick={() => go(-1)}>← Prev</button>
        <span className="fine">{i + 1} / {cards.length}</span>
        <button className="btn ghost small" onClick={() => go(1)}>Next →</button>
      </div>
    </div>
  );
}

function Quiz({ questions }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  if (!questions.length) return <p className="fine">No quiz questions in this kit.</p>;

  const score = questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  const allAnswered = Object.keys(answers).length === questions.length;

  function reset() {
    setAnswers({});
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      {submitted && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="score">{score} / {questions.length}</div>
          <p className="fine">
            {score === questions.length
              ? 'Perfect — ready for a shift.'
              : score / questions.length >= 0.8
              ? 'Nearly there. Review the misses below, then try again.'
              : 'Not shift-ready yet. Study the flashcards and retake it.'}
          </p>
        </div>
      )}
      {questions.map((q, qi) => (
        <div className="card quiz-q" key={qi}>
          <h3>{qi + 1}. {q.question}</h3>
          {q.options.map((opt, oi) => {
            let cls = 'opt';
            if (submitted && oi === q.answer) cls += ' correct';
            else if (submitted && answers[qi] === oi) cls += ' wrong';
            return (
              <label className={cls} key={oi}>
                <input
                  type="radio"
                  name={`q${qi}`}
                  checked={answers[qi] === oi}
                  disabled={submitted}
                  onChange={() => setAnswers({ ...answers, [qi]: oi })}
                />
                <span>{opt}</span>
              </label>
            );
          })}
          {submitted && answers[qi] !== q.answer && q.explanation && <p className="explain">Why: {q.explanation}</p>}
        </div>
      ))}
      <div className="row">
        {submitted ? (
          <button className="btn" onClick={reset}>Retake quiz</button>
        ) : (
          <button className="btn" onClick={() => setSubmitted(true)} disabled={!allAnswered}>
            {allAnswered ? 'Grade my quiz' : `Answer all ${questions.length} to grade`}
          </button>
        )}
      </div>
    </div>
  );
}
