"use client";

import { useLocation, useOutlet } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TeacherSidebar from "../components/TeacherSidebar";
import TeacherBottomNav from "../components/TeacherBottomNav";
import FeedBackModal from "../components/FeedBackModal";

function TeacherLayout() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();

  const prevPathRef = useRef(location.pathname);
  const [direction, setDirection] = useState(1);

  const getRouteRank = useMemo(() => {
    return (pathname) => {
      if (
        pathname === "/teacher/dashboard" ||
        pathname.startsWith("/teacher/attendance/")
      ) {
        return 0;
      }

      if (pathname === "/teacher/test-results") {
        return 1;
      }

      if (pathname === "/teacher/payments") {
        return 2;
      }

      return 0;
    };
  }, []);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const prevRank = getRouteRank(prevPath);
    const currentRank = getRouteRank(location.pathname);

    if (currentRank > prevRank) {
      setDirection(1);
    } else if (currentRank < prevRank) {
      setDirection(-1);
    }

    prevPathRef.current = location.pathname;
  }, [location.pathname, getRouteRank]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      <TeacherSidebar />

      <div className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 overflow-x-hidden overflow-y-auto relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.key}
            initial={{
              opacity: 0,
              x: direction > 0 ? 50 : -50,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: direction > 0 ? -50 : 50,
              scale: 0.985,
            }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </div>

      <TeacherBottomNav onSupportClick={() => setFeedbackOpen(true)} />

      <FeedBackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        senderType="teacher"
      />
    </div>
  );
}

export default TeacherLayout;