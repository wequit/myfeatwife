import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { questions } from "./data/questions";
import { isPartnerLink, decodeAnswers, isResultsLink, decodeResults } from "./utils/encoding";
import ProgressBar from "./components/ProgressBar";
import WelcomeScreen from "./components/WelcomeScreen";
import QuestionCard from "./components/QuestionCard";
import LinkScreen from "./components/LinkScreen";
import ResultsScreen from "./components/ResultsScreen";

// Screens
const SCREEN = {
  WELCOME: "welcome",
  QUIZ: "quiz",
  LINK: "link",
  RESULTS: "results",
};

const screenTransition = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
};

function initFromHash() {
  if (isResultsLink()) {
    const decoded = decodeResults(window.location.hash);
    if (decoded) {
      return {
        isDiana: false,
        adilAnswers: decoded.adilAnswers,
        resultsFromLink: decoded,
      };
    }
  }
  if (isPartnerLink()) {
    const decoded = decodeAnswers(window.location.hash);
    if (decoded) return { isDiana: true, adilAnswers: decoded, resultsFromLink: null };
  }
  return { isDiana: false, adilAnswers: null, resultsFromLink: null };
}

const STORAGE_KEY = "adil-diana-quiz-state-v1";
const SHARED_RESULTS_KEY = "adil-diana-quiz-shared-results-v1";

const QUESTIONS_PER_SLIDE = 3;

function chunkQuestions(list, size) {
  const chunks = [];
  if (list.length === 0) return chunks;

  // Первый слайд всегда отдельный (вопрос "Что ей больше всего нравится")
  chunks.push([list[0]]);

  for (let i = 1; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}

function getSharedResults() {
  try {
    const raw = window.localStorage.getItem(SHARED_RESULTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.adilAnswers || !parsed?.dianaAnswers) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const sharedFromStorage = typeof window !== "undefined" ? getSharedResults() : null;
  const [session, setSession] = useState(() => {
    const fromHash = initFromHash();
    if (fromHash.resultsFromLink) {
      return { isDiana: false, adilAnswers: fromHash.resultsFromLink.adilAnswers };
    }
    if (!fromHash.isDiana && sharedFromStorage?.adilAnswers) {
      return { isDiana: false, adilAnswers: sharedFromStorage.adilAnswers };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return fromHash;
      const saved = JSON.parse(raw);
      const currentHash = window.location.hash || "";
      const savedHash = saved?.hash ?? "";
      // Восстанавливаем только если это тот же URL-сценарий (тот же hash)
      if (currentHash !== savedHash) return fromHash;
      return saved?.session ?? fromHash;
    } catch {
      return fromHash;
    }
  });
  const { isDiana, adilAnswers } = session;
  const [screen, setScreen] = useState(() => {
    const fromHash = initFromHash();
    if (fromHash.resultsFromLink) return SCREEN.RESULTS;
    if (!fromHash.isDiana && sharedFromStorage?.dianaAnswers) return SCREEN.RESULTS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return SCREEN.WELCOME;
      const saved = JSON.parse(raw);
      if ((saved?.hash ?? "") !== (window.location.hash || "")) return SCREEN.WELCOME;
      return saved?.screen ?? SCREEN.WELCOME;
    } catch {
      return SCREEN.WELCOME;
    }
  });
  const [answers, setAnswers] = useState(() => {
    const fromHash = initFromHash();
    if (fromHash.resultsFromLink?.dianaAnswers) return fromHash.resultsFromLink.dianaAnswers;
    if (!fromHash.isDiana && sharedFromStorage?.adilAnswers) return sharedFromStorage.adilAnswers;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const saved = JSON.parse(raw);
      if ((saved?.hash ?? "") !== (window.location.hash || "")) return {};
      return saved?.answers ?? {};
    } catch {
      return {};
    }
  });
  const [qIndex, setQIndex] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const saved = JSON.parse(raw);
      if ((saved?.hash ?? "") !== (window.location.hash || "")) return 0;
      return saved?.qIndex ?? 0;
    } catch {
      return 0;
    }
  });
  const [direction, setDirection] = useState(1);
  const [sharedResults, setSharedResults] = useState(sharedFromStorage);
  const [showAskAdilHint, setShowAskAdilHint] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if ((saved?.hash ?? "") !== (window.location.hash || "")) return false;
      return saved?.showAskAdilHint ?? false;
    } catch {
      return false;
    }
  });
  const questionSlides = chunkQuestions(questions, QUESTIONS_PER_SLIDE);

  useEffect(() => {
    if (qIndex > questionSlides.length - 1) {
      setQIndex(Math.max(0, questionSlides.length - 1));
    }
  }, [qIndex, questionSlides.length]);

  useEffect(() => {
    const payload = {
      hash: window.location.hash || "",
      session,
      screen,
      answers,
      qIndex,
      showAskAdilHint,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [session, screen, answers, qIndex, showAskAdilHint]);

  const handleAnswer = (questionId, answerId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleNext = () => {
    if (qIndex < questionSlides.length - 1) {
      setDirection(1);
      setQIndex((i) => i + 1);
    } else {
      // Finished quiz
      if (isDiana) {
        const payload = {
          adilAnswers: adilAnswers ?? {},
          dianaAnswers: answers,
          completedAt: Date.now(),
        };
        setSharedResults(payload);
        try {
          window.localStorage.setItem(SHARED_RESULTS_KEY, JSON.stringify(payload));
        } catch {
          // ignore storage errors
        }
        setScreen(SCREEN.RESULTS);
      } else {
        setScreen(SCREEN.LINK);
      }
    }
  };

  const handlePrev = () => {
    if (qIndex > 0) {
      setDirection(-1);
      setQIndex((i) => i - 1);
    }
  };

  const showProgress = screen === SCREEN.QUIZ;

  const resetToAdilMode = () => {
    window.history.replaceState({}, "", window.location.pathname + window.location.search);
    setSession({ isDiana: false, adilAnswers: null });
    setQIndex(0);
    setAnswers({});
    setDirection(1);
    setShowAskAdilHint(true);
    setScreen(SCREEN.WELCOME);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="app">
      {showProgress && (
        <ProgressBar current={qIndex + 1} total={questionSlides.length} />
      )}

      <AnimatePresence mode="wait">
        {screen === SCREEN.WELCOME && (
          <motion.div key="welcome" {...screenTransition}>
            <WelcomeScreen
              isDiana={isDiana}
              showAskAdilHint={showAskAdilHint}
              onStart={() => {
                setQIndex(0);
                setAnswers({});
                setShowAskAdilHint(false);
                if (!isDiana) {
                  setSharedResults(null);
                  try {
                    window.localStorage.removeItem(SHARED_RESULTS_KEY);
                  } catch {
                    // ignore storage errors
                  }
                }
                setScreen(SCREEN.QUIZ);
              }}
            />
          </motion.div>
        )}

        {screen === SCREEN.QUIZ && (
          <QuestionCard
            key={`q-${qIndex}`}
            questions={questionSlides[qIndex]}
            answers={answers}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrev={handlePrev}
            isFirst={qIndex === 0}
            isLast={qIndex === questionSlides.length - 1}
            direction={direction}
          />
        )}

        {screen === SCREEN.LINK && (
          <motion.div key="link" {...screenTransition}>
            <LinkScreen answers={answers} />
          </motion.div>
        )}

        {screen === SCREEN.RESULTS && (
          <motion.div key="results" {...screenTransition}>
            <ResultsScreen
              adilAnswers={isDiana ? adilAnswers : (sharedResults?.adilAnswers ?? answers)}
              dianaAnswers={isDiana ? answers : (sharedResults?.dianaAnswers ?? {})}
              onRestart={resetToAdilMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
