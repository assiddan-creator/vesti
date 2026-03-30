"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const STORAGE_KEY = "hasSeenVestiOnboarding";

const features = [
  {
    title: "Virtual Try-On",
    description: "Upload your photo and a garment to preview a realistic fit before you buy.",
  },
  {
    title: "Shop The Look",
    description: "Snap inspiration from the street and discover similar pieces in one flow.",
  },
  {
    title: "Body Scanner",
    description: "Use live pose tracking to estimate measurements and power better size picks.",
  },
] as const;

export function OnboardingModal() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) !== "true") {
        setOpen(true);
      }
    } catch {
      /* private mode / quota — skip onboarding to avoid repeat prompts */
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!mounted) return null;

  const enterTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="onboarding-root"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          aria-describedby="onboarding-desc"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
        >
          <motion.div
            role="presentation"
            aria-hidden
            className="absolute inset-0 bg-[#080808]/80 backdrop-blur-md"
            onClick={dismiss}
          />

          <motion.div
            className="relative z-10 w-full max-w-lg rounded-2xl border border-white/12 bg-black/55 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-8"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={enterTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#FF2800]">Welcome to Vesti</p>
            <h2 id="onboarding-title" className="mt-3 text-2xl font-semibold tracking-tight text-[#F2EFE9] sm:text-3xl">
              Your AI fashion studio
            </h2>
            <p id="onboarding-desc" className="mt-3 text-sm leading-relaxed text-white/55">
              Here are three ways we help you shop with confidence—pick any tool from the nav whenever you are ready.
            </p>

            <ul className="mt-6 space-y-4">
              {features.map((f) => (
                <li
                  key={f.title}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{f.description}</p>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={dismiss}
              className="mt-8 w-full rounded-xl bg-[#FF2800] px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(255,40,0,0.35)] transition-[box-shadow,transform] hover:bg-[#e62400] hover:shadow-[0_12px_40px_rgba(255,40,0,0.45)] active:scale-[0.99]"
            >
              Let&apos;s Get Started
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
