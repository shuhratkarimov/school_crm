import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
const STAR_COUNT = 5;

// Yulduzcha komponenti (Yaxshilangan mantiq bilan)
function StarIcon({ fillPercent = 0, active = false }) {
  return (
    <div className="relative h-10 w-10 transition-transform duration-200 active:scale-90">
      {/* Orqa fondagi bo'sh yulduz */}
      <svg viewBox="0 0 24 24" className="h-full w-full fill-slate-200">
        <path d="M12 2.5l2.93 5.94 6.56.95-4.75 4.63 1.12 6.53L12 17.77 6.14 20.55l1.12-6.53-4.75-4.63 6.56-.95L12 2.5z" />
      </svg>

      {/* To'ldirilgan yulduz (Clip-path orqali kesish) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fillPercent}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
          <path d="M12 2.5l2.93 5.94 6.56.95-4.75 4.63 1.12 6.53L12 17.77 6.14 20.55l1.12-6.53-4.75-4.63 6.56-.95L12 2.5z" />
        </svg>
      </div>

      {/* Tanlangan paytdagi nur (Glow effect) */}
      {active && (
        <div className="absolute inset-0 -z-10 rounded-full bg-amber-400/20 blur-xl transition-opacity" />
      )}
    </div>
  );
}

export default function PlatformReviewModal({
  open,
  loading = false,
  onClose,
  onSubmit,
  onDismiss,
}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(null);
  const [comment, setComment] = useState('');

  const displayRating = hoveredRating ?? rating;
  const isLowRating = rating > 0 && rating <= 3;

  // Star fill mantiqi
  const getStarFill = (index, value) => {
    const starPos = index + 1;
    if (value >= starPos) return 100;
    if (value >= starPos - 0.5) return 50;
    return 0;
  };

  const handleInteraction = (e, index, type) => {
    if (loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const value = x < rect.width / 2 ? index + 0.5 : index + 1;

    if (type === 'move') setHoveredRating(value);
    if (type === 'click') setRating(value);
  };

  const handleSubmit = async () => {
    if (!rating) return;
    if (isLowRating && !comment.trim()) return;

    await onSubmit(Number(rating.toFixed(1)), comment.trim());
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/45">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sizga yoqdimi?
            </h2>
            <p className="mt-2 text-slate-500">
              Platformani baholang va fikringizni qoldiring
            </p>
          </div>

          {/* Stars Container */}
          <div
            className="my-8 flex items-center justify-center gap-2"
            onMouseLeave={() => setHoveredRating(null)}
          >
            {[...Array(STAR_COUNT)].map((_, i) => (
              <button
                key={i}
                type="button"
                onMouseMove={(e) => handleInteraction(e, i, 'move')}
                onClick={(e) => handleInteraction(e, i, 'click')}
                className="relative cursor-pointer transition-transform hover:scale-110 active:scale-95"
              >
                <StarIcon
                  fillPercent={getStarFill(i, displayRating)}
                  active={rating > i}
                />
              </button>
            ))}
          </div>

          {/* Rating Badge */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600">
              {rating > 0 ? `${rating.toFixed(1)} / 5.0` : 'Baholang'}
            </div>
          </div>

          {/* Textarea Section */}
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isLowRating ? "Nima muammo bo'ldi? Ayting, tuzatamiz..." : "Fikringizni yozing..."}
              className={`min-h-[110px] w-full resize-none rounded-2xl border bg-slate-50 p-4 text-sm transition-all focus:bg-white focus:ring-4 ${isLowRating && !comment.trim() ? 'border-amber-200 focus:ring-amber-100' : 'border-slate-100 focus:ring-blue-100'
                }`}
            />

            {isLowRating && !comment.trim() && (
              <p className="text-center text-xs font-medium text-amber-600">
                Past baho uchun izoh qoldirishingiz muhim...
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading || !rating || (isLowRating && !comment.trim())}
              className="h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 disabled:opacity-40"
            >
              {loading ? 'Yuborilmoqda...' : 'Baholash'}
            </button>

            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="h-12 flex-1 rounded-xl text-sm font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                Keyinroq
              </button>
              <button
                onClick={onClose}
                className="h-12 flex-1 rounded-xl text-sm font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                Yopish
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}