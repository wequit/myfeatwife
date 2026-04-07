import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { questions, SCALE_OPTIONS } from "../data/questions";
import { buildResultsUrl } from "../utils/encoding";

const CUSTOM_PREFIX = "custom:";

function isScaleAnswer(answer) {
  return ["1", "2", "3", "4", "5"].includes(answer);
}

function getAnswerLabel(question, answerId) {
  if (Array.isArray(answerId)) {
    if (answerId.length === 0) return "—";
    const optionsMap = new Map((question.options ?? []).map((o) => [o.id, o.text]));
    return answerId.map((id) => optionsMap.get(id) ?? id).join(", ");
  }
  if (!answerId) return "—";
  if (typeof answerId === "string" && answerId.startsWith(CUSTOM_PREFIX)) {
    const text = answerId.slice(CUSTOM_PREFIX.length).trim();
    return text ? `✍️ ${text}` : "✍️ Свой вариант";
  }
  const opt = SCALE_OPTIONS.find((o) => o.id === answerId);
  return opt ? `${opt.emoji} ${opt.text}` : "—";
}

function renderAnswer(question, answerId) {
  if (Array.isArray(answerId)) {
    if (answerId.length === 0) return "—";
    const optionsMap = new Map((question.options ?? []).map((o) => [o.id, o.text]));
    return (
      <div className="multi-answer-list">
        {answerId.map((id) => (
          <div key={id} className="multi-answer-item">
            • {optionsMap.get(id) ?? id}
          </div>
        ))}
      </div>
    );
  }
  return getAnswerLabel(question, answerId);
}

function scoreForPair(a, b) {
  if (!a || !b) return null;
  if (Array.isArray(a) && Array.isArray(b)) {
    const sa = new Set(a);
    const sb = new Set(b);
    const union = new Set([...sa, ...sb]).size;
    if (union === 0) return null;
    let inter = 0;
    for (const item of sa) {
      if (sb.has(item)) inter += 1;
    }
    return inter / union;
  }
  if (isScaleAnswer(a) && isScaleAnswer(b)) {
    return 1 - Math.abs(parseInt(a, 10) - parseInt(b, 10)) / 4;
  }
  return a === b ? 1 : 0;
}

function overlapForMulti(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  const sa = new Set(a);
  const sb = new Set(b);
  const union = new Set([...sa, ...sb]).size;
  if (union === 0) return null;
  let inter = 0;
  for (const item of sa) if (sb.has(item)) inter += 1;
  return { inter, union, ratio: inter / union };
}

function getCompatibilityComment(pct) {
  if (pct >= 90)
    return "Вы невероятно совпадаете! Желания и вкусы почти идентичны — редкая гармония. 💜";
  if (pct >= 75)
    return "Очень высокая совместимость. Есть пара нюансов, но это лишь добавляет интереса. 🔥";
  if (pct >= 55)
    return "Хорошая база. Небольшие различия — отличный повод для открытого разговора. ✨";
  if (pct >= 35)
    return "Есть заметные расхождения — и это нормально. Важно говорить и слышать друг друга. 🌙";
  return "У вас разные предпочтения — это возможность узнать друг друга с новой стороны. 💫";
}

function AnimatedCounter({ target }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  return value;
}

function groupByBlock(qs) {
  const map = new Map();
  for (const q of qs) {
    if (!map.has(q.block)) map.set(q.block, { name: q.block, emoji: q.blockEmoji, questions: [] });
    map.get(q.block).questions.push(q);
  }
  return [...map.values()];
}

export default function ResultsScreen({ adilAnswers, dianaAnswers, onRestart }) {
  const fired = useRef(false);
  const [copied, setCopied] = useState(false);

  const details = questions.map((q) => {
    const aAns = adilAnswers[q.id];
    const dAns = dianaAnswers[q.id];
    const score = scoreForPair(aAns, dAns);
    const diff =
      isScaleAnswer(aAns) && isScaleAnswer(dAns)
        ? Math.abs(parseInt(aAns, 10) - parseInt(dAns, 10))
        : null;
    const multi = overlapForMulti(aAns, dAns);
    const exact =
      (Array.isArray(aAns) && Array.isArray(dAns) && multi && multi.ratio === 1) ||
      (typeof aAns === "string" && typeof dAns === "string" && aAns === dAns);
    const close = diff !== null && diff <= 1;
    return { q, aAns, dAns, score, diff, multi, exact, close };
  });

  const scores = questions
    .map((q) => scoreForPair(adilAnswers[q.id], dianaAnswers[q.id]))
    .filter((s) => s !== null);

  const pct =
    scores.length > 0
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100)
      : 0;

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (pct / 100) * circumference;
  const answeredCount = details.filter((d) => d.score !== null).length;
  const exactCount = details.filter((d) => d.exact).length;
  const closeCount = details.filter((d) => !d.exact && (d.close || (d.multi && d.multi.ratio >= 0.5))).length;
  const farCount = Math.max(answeredCount - exactCount - closeCount, 0);
  const scaleDiffs = details.map((d) => d.diff).filter((v) => v !== null);
  const avgDiff = scaleDiffs.length
    ? (scaleDiffs.reduce((s, v) => s + v, 0) / scaleDiffs.length).toFixed(2)
    : "—";

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const timer = setTimeout(() => {
      const end = Date.now() + 3000;
      const colors = ["#c084fc", "#f472b6", "#818cf8", "#fbbf24", "#34d399"];
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay },
  });

  const groups = groupByBlock(questions);
  const groupStats = groups
    .map((group) => {
      const gDetails = details.filter((d) => d.q.block === group.name && d.score !== null);
      const gpct = gDetails.length
        ? Math.round((gDetails.reduce((sum, d) => sum + d.score, 0) / gDetails.length) * 100)
        : 0;
      return { ...group, gpct, total: gDetails.length };
    })
    .sort((a, b) => b.gpct - a.gpct);

  const resultsUrl = buildResultsUrl(adilAnswers, dianaAnswers);

  const handleCopyResultsLink = async () => {
    try {
      await navigator.clipboard.writeText(resultsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="screen"
      style={{ justifyContent: "flex-start", overflowY: "auto", gap: 28 }}
    >
      <motion.div className="results-header" {...fadeUp(0)}>
        <span className="results-emoji">💞</span>
        <h1 className="results-title">Ваша совместимость</h1>
      </motion.div>

      <motion.div {...fadeUp(0.15)}>
        <div className="compatibility-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <circle className="ring-track" cx="70" cy="70" r="54" />
            <motion.circle
              className="ring-fill"
              cx="70"
              cy="70"
              r="54"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            />
          </svg>
          <div className="ring-label">
            <span className="ring-percent">
              <AnimatedCounter target={pct} />%
            </span>
            <span className="ring-sub">совместимость</span>
          </div>
        </div>
      </motion.div>

      <motion.div className="compat-comment" {...fadeUp(0.3)}>
        {getCompatibilityComment(pct)}
      </motion.div>

      <motion.div style={{ width: "100%" }} {...fadeUp(0.32)}>
        <button className="btn btn-primary" onClick={handleCopyResultsLink}>
          Скопировать ссылку с результатами
        </button>
        {onRestart && (
          <button
            className="btn btn-secondary"
            onClick={onRestart}
            style={{ marginTop: 10 }}
          >
            Начать заново
          </button>
        )}
        {copied && (
          <p style={{ fontSize: 13, color: "var(--success)", textAlign: "center", marginTop: 8 }}>
            ✓ Ссылка скопирована
          </p>
        )}
      </motion.div>

      <motion.div className="analytics-grid" {...fadeUp(0.34)}>
        <div className="analytics-card">
          <div className="analytics-title">Совпало 1-в-1</div>
          <div className="analytics-value">{exactCount}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-title">Близко по ответам</div>
          <div className="analytics-value">{closeCount}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-title">Сильно различается</div>
          <div className="analytics-value">{farCount}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-title">Средняя разница</div>
          <div className="analytics-value">{avgDiff}</div>
        </div>
      </motion.div>

      <motion.div className="category-analytics" {...fadeUp(0.36)}>
        <div className="category-analytics-title">Аналитика совместимости </div>
        <div className="category-rows">
          {groupStats.map((g) => (
            <div className="category-row" key={g.name}>
              <div className="category-name">
                <span>{g.emoji}</span>
                <span>{g.name}</span>
              </div>
              <div className="category-score">{g.gpct}%</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div className="answers-header" {...fadeUp(0.35)}>
        <div className="answers-header-item adil">
          <span>💙</span> Адиль
        </div>
        <div className="answers-header-item diana">
          <span>🩷</span> Диана
        </div>
      </motion.div>

      <div className="result-cards" style={{ gap: 24 }}>
        {groups.map((group, gi) => (
          <motion.div
            key={group.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.4 + gi * 0.07 }}
          >
            <div className="result-group-header">
              <span>{group.emoji}</span>
              <span>{group.name}</span>
            </div>

            <div className="result-cards" style={{ gap: 10 }}>
              {group.questions.map((q) => {
                const d = details.find((x) => x.q.id === q.id);
                const aAns = d?.aAns;
                const dAns = d?.dAns;
                const diff = d?.diff ?? null;
                const isClose = diff !== null && diff <= 1;
                const isMultiMatch =
                  Array.isArray(aAns) && Array.isArray(dAns) && scoreForPair(aAns, dAns) >= 0.5;
                const isSameCustom =
                  aAns &&
                  dAns &&
                  typeof aAns === "string" &&
                  typeof dAns === "string" &&
                  aAns.startsWith(CUSTOM_PREFIX) &&
                  dAns.startsWith(CUSTOM_PREFIX) &&
                  aAns === dAns;

                return (
                  <div
                    key={q.id}
                    className={`result-card ${isClose || isSameCustom || isMultiMatch ? "match" : ""}`}
                  >
                    <div className="result-q">
                      {isMultiMatch && (
                        <span className="match-badge close-badge">≈ Похоже</span>
                      )}
                      {isSameCustom && (
                        <span className="match-badge">✓ Совпадает</span>
                      )}
                      {isClose && diff === 0 && (
                        <span className="match-badge">✓ Совпадает</span>
                      )}
                      {isClose && diff === 1 && (
                        <span className="match-badge close-badge">≈ Близко</span>
                      )}
                    </div>
                    <div className="result-q-text">{q.text}</div>
                    <div className="result-answers">
                      <div className="result-answer adil-ans">
                        <div className="result-answer-label">Адиль</div>
                        {renderAnswer(q, aAns)}
                      </div>
                      <div className="result-answer diana-ans">
                        <div className="result-answer-label">Диана</div>
                        {renderAnswer(q, dAns)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div className="results-footer" {...fadeUp(0.5)}>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-dim)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          🔒 Ответы не отправлялись на сервер — всё приватно
        </p>
      </motion.div>
    </div>
  );
}
