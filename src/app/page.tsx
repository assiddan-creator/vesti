"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AppNav } from "../components/AppNav";

const primaryActionBgStyle = {
  backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
  backgroundSize: "cover" as const,
  backgroundPosition: "center" as const,
};

const features = [
  {
    href: "/try-on",
    title: "Virtual Try-On",
    description:
      "Drop in your photo and a garment—see a photorealistic fit before you spend a cent.",
    icon: "👗",
  },
  {
    href: "/street",
    title: "Shop The Look",
    description:
      "Snap street style and let AI surface similar pieces so you can own the look in one flow.",
    icon: "🔍",
  },
  {
    href: "/size",
    title: "Find My Size",
    description:
      "Match your measurements and fit preference to the right size across stores and charts.",
    icon: "📏",
  },
] as const;

const testimonials = [
  {
    quote:
      "The virtual try-on sold me on a coat I was about to skip. Seeing it on my own photo felt shockingly real—I ordered with confidence.",
    name: "Maya K.",
    role: "Virtual Try-On",
  },
  {
    quote:
      "Size Finder nailed my ASOS order. I used Slim fit preference and skipped the usual return dance—first time in years.",
    name: "Jordan T.",
    role: "Find My Size",
  },
  {
    quote:
      "I ran both try-on and size check before a big haul. Fewer surprises, less guilt returns. This is how I shop now.",
    name: "Elena R.",
    role: "Try-On + Size",
  },
] as const;

const faqItems = [
  {
    q: "How accurate is the size finder?",
    a: "We combine your height, fit preference (Slim / Regular / Oversize), and any body notes you provide with the store’s published size chart. It’s guidance—not tailoring—but most users find it close enough to pick confidently on the first order.",
  },
  {
    q: "Is my data secure?",
    a: "Photos and measurements are used to run the experience you asked for and are not sold to advertisers. Follow best practices: use trusted networks, and avoid sharing sensitive IDs in free-text fields.",
  },
  {
    q: "Which stores do you support?",
    a: "Paste a product URL from major fashion retailers (AliExpress, Shein, ASOS, Zara-style stores, and many others). If the page exposes a size chart, we can reason about it; obscure or gated pages may limit what we can read.",
  },
  {
    q: "How does virtual try-on work?",
    a: "You upload a clear photo of yourself and a reference image of the garment. Our models preserve pose and lighting as much as possible and render a new image so you can preview the look before you buy.",
  },
] as const;

export default function MarketingHomePage() {
  const reduceMotion = useReducedMotion();
  const faqBaseId = useId();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }, []);

  const heroEase = reduceMotion ? undefined : ([0.22, 1, 0.36, 1] as const);
  const duration = reduceMotion ? 0 : 0.65;
  const stagger = reduceMotion ? 0 : 0.1;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16 pt-0">
      {/* Flatlay atmosphere + depth */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Image
          src="/Luxury_fashion_flat_202603252000.jpeg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/92 via-[#080808]/88 to-[#080808]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,40,0,0.14),transparent_55%)]" />
      </div>

      <AppNav />

      <div className="relative z-10 flex w-full flex-col items-center px-4 pt-24 text-[#F2EFE9] sm:px-6 md:pt-28">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <motion.p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[#FF2800]/95 sm:text-sm"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration * 0.85, ease: heroEase }}
          >
            The AI fashion revolution
          </motion.p>

          <motion.h1
            className="max-w-4xl text-balance text-4xl font-extralight leading-[1.08] tracking-[0.06em] text-[#F2EFE9] sm:text-5xl md:text-6xl lg:text-7xl"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration, ease: heroEase, delay: stagger }}
          >
            See every outfit on{" "}
            <span className="relative inline-block font-light text-white">
              you
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF2800]/80 to-transparent" />
            </span>
            —before you buy.
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/55 sm:text-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration * 0.95, ease: heroEase, delay: stagger * 2 }}
          >
            Vesti turns product shots and real-world inspiration into confident decisions. One suite:
            virtual try-on, visual shopping, and size intelligence—built for conversion, not demos.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration * 0.95, ease: heroEase, delay: stagger * 3 }}
          >
            <Link
              href="/try-on"
              style={primaryActionBgStyle}
              className="relative inline-flex min-h-14 min-w-[220px] touch-manipulation items-center justify-center overflow-hidden rounded-2xl px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_40px_rgba(255,40,0,0.35)] transition-[box-shadow,transform] hover:shadow-[0_12px_48px_rgba(255,40,0,0.5)] active:scale-[0.99]"
            >
              <span className="absolute inset-0 bg-black/40" aria-hidden />
              <span className="relative z-10">Start virtual try-on</span>
            </Link>
            <Link
              href="/size"
              className="rounded-2xl border border-white/20 bg-white/[0.06] px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md transition-colors hover:border-[#FF2800]/45 hover:bg-white/[0.09] hover:text-white"
            >
              Find my size
            </Link>
          </motion.div>
        </section>

        {/* Features */}
        <section
          className="mx-auto mt-20 w-full max-w-6xl sm:mt-24 md:mt-28"
          aria-labelledby="features-heading"
        >
          <motion.h2
            id="features-heading"
            className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2800] sm:mb-12"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: duration * 0.8, ease: heroEase }}
          >
            Three tools. One wardrobe.
          </motion.h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.href}
                initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-24px" }}
                transition={{
                  duration: duration * 0.9,
                  ease: heroEase,
                  delay: reduceMotion ? 0 : 0.08 + i * 0.1,
                }}
              >
                <Link
                  href={f.href}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-[border,box-shadow] hover:border-[#FF2800]/35 hover:shadow-[0_0_40px_rgba(255,40,0,0.12)] sm:p-7"
                >
                  <span
                    className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-2xl backdrop-blur-sm transition-colors group-hover:border-[#FF2800]/30"
                    aria-hidden
                  >
                    {f.icon}
                  </span>
                  <h3 className="text-lg font-semibold tracking-wide text-white sm:text-xl">{f.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-white/55">{f.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF2800]">
                    Open tool
                    <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                      →
                    </span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section
          className="mx-auto mt-20 w-full max-w-6xl sm:mt-24 md:mt-28"
          aria-labelledby="testimonials-heading"
        >
          <motion.h2
            id="testimonials-heading"
            className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2800] sm:mb-12"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: duration * 0.85, ease: heroEase }}
          >
            Loved by early adopters
          </motion.h2>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {testimonials.map((t, i) => (
              <motion.article
                key={t.name}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-32px" }}
                transition={{
                  duration: duration * 0.9,
                  ease: heroEase,
                  delay: reduceMotion ? 0 : 0.06 + i * 0.09,
                }}
                className="flex flex-col rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-7"
              >
                <div className="mb-4 flex items-center gap-1 text-[#FF2800]/90" aria-hidden>
                  {Array.from({ length: 5 }).map((_, star) => (
                    <span key={star} className="text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-white/75">
                  <p className="text-pretty">
                    {"\u201C"}
                    {t.quote}
                    {"\u201D"}
                  </p>
                </blockquote>
                <footer className="mt-6 border-t border-white/[0.08] pt-5">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-[#FF2800]/85">{t.role}</p>
                </footer>
              </motion.article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section
          className="mx-auto mt-20 w-full max-w-3xl pb-8 sm:mt-24 md:mt-28"
          aria-labelledby="faq-heading"
        >
          <motion.h2
            id="faq-heading"
            className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2800] sm:mb-12"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: duration * 0.85, ease: heroEase }}
          >
            Frequently asked questions
          </motion.h2>

          <motion.div
            className="rounded-2xl border border-white/10 bg-black/40 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-3"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-32px" }}
            transition={{ duration: duration * 0.95, ease: heroEase, delay: reduceMotion ? 0 : 0.05 }}
          >
            <div className="divide-y divide-white/[0.06]">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                const panelId = `${faqBaseId}-panel-${index}`;
                const buttonId = `${faqBaseId}-trigger-${index}`;
                return (
                  <div key={item.q} className="px-3 py-1 sm:px-4">
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleFaq(index)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-white"
                    >
                      <span className="text-sm font-semibold leading-snug text-[#F2EFE9] sm:text-base">
                        {item.q}
                      </span>
                      <span
                        className={`shrink-0 text-[#FF2800] transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={
                            reduceMotion
                              ? { opacity: 1 }
                              : { height: "auto", opacity: 1 }
                          }
                          exit={
                            reduceMotion
                              ? { opacity: 0 }
                              : { height: 0, opacity: 0 }
                          }
                          transition={{
                            duration: reduceMotion ? 0 : 0.28,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 pr-2 text-sm leading-relaxed text-white/55">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
