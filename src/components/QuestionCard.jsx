import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SCALE_OPTIONS } from "../data/questions";
import { useRef } from "react";

const CUSTOM_PREFIX = "custom:";

function isAnswerFilled(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (!value) return false;
  if (value.startsWith(CUSTOM_PREFIX)) {
    return value.slice(CUSTOM_PREFIX.length).trim().length > 0;
  }
  return true;
}

function getCustomText(value) {
  if (!value || !value.startsWith(CUSTOM_PREFIX)) return "";
  return value.slice(CUSTOM_PREFIX.length);
}

function MultiSelectRating({ options, value, onToggle }) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div className="options-list">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            className={`option-btn ${isSelected ? "selected" : ""}`}
            onClick={() => onToggle(opt.id)}
          >
            <span className="option-check">
              <span className="option-check-inner" />
            </span>
            <span>{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScaleRating({ value, onChange, onCustomChange, onCustomCancel }) {
  const [hovered, setHovered] = useState(null);
  const customInputRef = useRef(null);
  const normalizedValue = value?.startsWith(CUSTOM_PREFIX) ? null : value;
  const active = hovered ?? normalizedValue;
  const customSelected = value?.startsWith(CUSTOM_PREFIX);
  const customText = getCustomText(value);

  useEffect(() => {
    if (!customSelected) return;
    // Ставим фокус сразу после переключения в режим "свой ответ"
    requestAnimationFrame(() => {
      customInputRef.current?.focus();
      const len = customInputRef.current?.value?.length ?? 0;
      customInputRef.current?.setSelectionRange(len, len);
    });
  }, [customSelected]);

  return (
    <div className="question-rating-wrap">
      <div className="scale-wrap">
        {SCALE_OPTIONS.map((opt) => {
          const isActive = active === opt.id;
          const isSelected = normalizedValue === opt.id;
          return (
            <button
              key={opt.id}
              className={`scale-btn ${isActive ? "scale-active" : ""} ${isSelected ? "scale-selected" : ""}`}
              onClick={() => onChange(opt.id)}
              onMouseEnter={() => setHovered(opt.id)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(opt.id)}
              onTouchEnd={() => setHovered(null)}
            >
              <span className="scale-emoji">{opt.emoji}</span>
              <span className="scale-label">{opt.text}</span>
              {opt.sub && <span className="scale-sub">{opt.sub}</span>}
            </button>
          );
        })}
      </div>

      <div className={`custom-answer-row ${customSelected ? "custom-active" : ""}`}>
        {!customSelected ? (
          <button
            className="custom-answer-btn"
            onClick={() => onCustomChange(customText)}
          >
            Свой вариант ответа
          </button>
        ) : (
          <>
            <input
              ref={customInputRef}
              className="custom-answer-input"
              value={customText}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="Впиши свой вариант..."
            />
            <button
              className="custom-answer-cancel"
              onClick={onCustomCancel}
              aria-label="Отменить свой ответ"
              title="Отменить"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function QuestionCard({
  questions,
  answers,
  onAnswer,
  onNext,
  onPrev,
  isFirst,
  isLast,
  direction,
}) {
  const [localAnswers, setLocalAnswers] = useState({});

  useEffect(() => {
    const nextState = {};
    for (const q of questions) {
      nextState[q.id] = answers[q.id] ?? "";
    }
    setLocalAnswers(nextState);
  }, [questions, answers]);

  const handleSelect = (questionId, id) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: id }));
    onAnswer(questionId, id);
  };

  const handleCustomChange = (questionId, text) => {
    const value = `${CUSTOM_PREFIX}${text}`;
    setLocalAnswers((prev) => ({ ...prev, [questionId]: value }));
    onAnswer(questionId, value);
  };

  const handleCustomCancel = (questionId) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: "" }));
    onAnswer(questionId, "");
  };

  const handleNext = () => {
    const filled = questions.every((q) => isAnswerFilled(localAnswers[q.id] ?? ""));
    if (filled) onNext();
  };

  const canProceed = questions.every((q) => isAnswerFilled(localAnswers[q.id] ?? ""));

  const handleToggleMulti = (questionId, optionId) => {
    const current = Array.isArray(localAnswers[questionId]) ? localAnswers[questionId] : [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    setLocalAnswers((prev) => ({ ...prev, [questionId]: next }));
    onAnswer(questionId, next);
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={questions[0]?.id}
        className="screen quiz-screen"
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="question-screen">
          <div className="q-top-nav">
            <button className="btn btn-top-back" onClick={onPrev} disabled={isFirst}>
              ← Назад
            </button>
          </div>

          <div className="questions-list">
            {questions.map((question) => (
              <div key={question.id} className="question-item">
                <div className="block-badge">
                  <span>{question.blockEmoji}</span>
                  <span>{question.block}</span>
                </div>
                <h2 className="question-text">{question.text}</h2>
                {question.type === "multi" ? (
                  <MultiSelectRating
                    options={question.options}
                    value={localAnswers[question.id] ?? []}
                    onToggle={(id) => handleToggleMulti(question.id, id)}
                  />
                ) : (
                  <ScaleRating
                    value={localAnswers[question.id] ?? ""}
                    onChange={(id) => handleSelect(question.id, id)}
                    onCustomChange={(text) => handleCustomChange(question.id, text)}
                    onCustomCancel={() => handleCustomCancel(question.id)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="q-nav">
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed}
              style={{ opacity: canProceed ? 1 : 0.45 }}
            >
              {isLast ? "Завершить ✓" : "Далее →"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
