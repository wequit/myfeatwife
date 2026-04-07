import { motion } from "framer-motion"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay },
});

export default function WelcomeScreen({ isDiana, onStart, showAskAdilHint }) {
  const steps = isDiana
    ? [
        "Адиль уже ответил — теперь твоя очередь",
        "17 вопросов, честно и без фильтров",
        "В конце увидите сравнение и совместимость",
      ]
    : [
        "17 вопросов о предпочтениях — честно и открыто",
        "Ответы нигде не сохраняются, всё приватно",
        "После — пошлёшь Диане ссылку с её версией",
      ];

  return (
    <div className="screen">
      <div className="welcome-wrap">
        <motion.div {...fadeUp(0)}>
          <div className="welcome-emoji-ring">
            <span className="welcome-emoji">{isDiana ? "🩷" : "💜"}</span>
          </div>
        </motion.div>

        <motion.h1 className="welcome-title" {...fadeUp(0.1)}>
          {isDiana ? "Любимой жинке" : "Привет Адиль"}
        </motion.h1>

        <motion.p className="welcome-subtitle" {...fadeUp(0.15)}>
          {isDiana
            ? "Ахавахх, в общем вопросы надеюсь не слишком странные, просто хочу узнать тебя чуть лучше :)"
            : "Небольшой опросник, чтобы лучше узнать друг друга. Всё останется между вами."}
        </motion.p>

        <motion.div className="welcome-card" {...fadeUp(0.2)}>
          <div className="welcome-card-title">Как это работает</div>
          <div className="welcome-steps">
            {steps.map((step, i) => (
              <div className="welcome-step" key={i}>
                <span className="step-num">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="btn-wrap" {...fadeUp(0.3)}>
          <button className="btn btn-primary" onClick={onStart}>
            {isDiana ? "Ответить на вопросы" : "Начать опрос"} →
          </button>
        </motion.div>

        {showAskAdilHint && (
          <motion.p
            style={{
              fontSize: 14,
              color: "var(--gold)",
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: 340,
            }}
            {...fadeUp(0.35)}
          >
            Сначала попросите Адиля ответить первым, потом отправьте ссылку Диане.
          </motion.p>
        )}
      </div>
    </div>
  );
}
