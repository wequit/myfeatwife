import { useState } from "react";
import { motion } from "framer-motion";
import { buildShareUrl } from "../utils/encoding";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay },
});

export default function LinkScreen({ answers }) {
  const [copied, setCopied] = useState(false);

  const url = buildShareUrl(answers);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback: select text
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Адиль & Диана — опросник 💜",
          text: "Ответь на вопросы, и посмотрим нашу совместимость 😊",
          url,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="screen">
      <div className="link-screen-wrap">
        <motion.span className="link-icon" {...fadeUp(0)}>
          🔗
        </motion.span>

        <motion.h2 className="link-title" {...fadeUp(0.1)}>
          Твои ответы готовы!
        </motion.h2>

        <motion.p className="link-desc" {...fadeUp(0.15)}>
          Отправь Диане эту ссылку. Она ответит на те же вопросы — и вы увидите
          сравнение.
        </motion.p>

        <motion.div className="link-box" {...fadeUp(0.2)}>
          {url}
        </motion.div>

        <motion.div {...fadeUp(0.25)} style={{ width: "100%" }}>
          <div className="copy-feedback">
            {copied && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                ✓ Скопировано!
              </motion.span>
            )}
          </div>
        </motion.div>

        <motion.div className="btn-wrap" {...fadeUp(0.3)}>
          <button className="btn btn-primary" onClick={handleShare}>
            {navigator.share ? "Поделиться с Дианой 🩷" : "Скопировать ссылку"}
          </button>
          {navigator.share && (
            <button className="btn btn-secondary" onClick={handleCopy}>
              Скопировать в буфер
            </button>
          )}
        </motion.div>

        <motion.p
          style={{
            fontSize: 12,
            color: "var(--text-dim)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
          {...fadeUp(0.35)}
        >
          🔒 Ответы зашифрованы прямо в ссылке — никакой сервер их не хранит
        </motion.p>
      </div>
    </div>
  );
}
