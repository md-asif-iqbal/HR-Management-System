import type { Variants, Transition } from 'framer-motion';

// ── Reusable transitions ──────────────────────────────────────────────────
export const springBounce: Transition = { type: 'spring', stiffness: 400, damping: 25 };
export const easeOut: Transition = { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] };
export const snappy: Transition = { duration: 0.2, ease: 'easeOut' };

// ── Variants ──────────────────────────────────────────────────────────────
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Table rows ────────────────────────────────────────────────────────────
export const tableRowStagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const tableRow: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// ── Modal / Dialog ────────────────────────────────────────────────────────
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

// ── Page transition ───────────────────────────────────────────────────────
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// ── Calendar ──────────────────────────────────────────────────────────────
export const calendarSlide = (direction: number): Variants => ({
  enter: { x: direction * 30, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { x: direction * -30, opacity: 0, transition: { duration: 0.2 } },
});

export const calendarCell: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// ── Pulse ring for check-in ───────────────────────────────────────────────
export const pulseRing: Variants = {
  pulse: {
    scale: [1, 1.12],
    opacity: [0.3, 0],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeOut' },
  },
};

// ── Badge pop-in ──────────────────────────────────────────────────────────
export const badgeIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, type: 'spring', stiffness: 300, damping: 20 } },
};

// ── Tab content ───────────────────────────────────────────────────────────
export const tabContent: Variants = {
  enter: { opacity: 0, x: 10 },
  center: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};
