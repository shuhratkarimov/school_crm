import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const TypewriterText = ({ text, speed = 100 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText(""); // har safar text yangilanganda reset bo‘lsin

    if (!text) return;

    let interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          return prev + text[prev.length]; // har doim keyingi harfni qo‘shadi
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <motion.p
      className={`text-xl sm:text-2xl md:text-3xl font-semibold transition-all duration-1000 ${
        displayedText.length === text.length
          ? "text-indigo-600 drop-shadow-lg scale-105"
          : "text-slate-600"
      }`}
      animate={{
        scale: displayedText.length === text.length ? 1.08 : 1,
        textShadow:
          displayedText.length === text.length
            ? "0 0 20px rgba(99, 102, 241, 0.5)"
            : "none",
      }}
    >
      {displayedText}
    </motion.p>
  );
};
