"use client";

import dynamic from "next/dynamic";
import { AppNav } from "../../components/AppNav";

const BodyScanner = dynamic(() => import("../../components/BodyScanner").then((m) => m.BodyScanner), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] w-full max-w-2xl items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-6 py-12 text-sm text-white/60 backdrop-blur-md">
      Loading body scanner…
    </div>
  ),
});

export default function BodyScanPage() {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/70" />
      <AppNav />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-4 pb-12 pt-16 text-white sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-light tracking-[0.2em] text-white sm:text-4xl">Body Scan</h1>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.6)]">Pose preview — development build</p>
        </div>
        <BodyScanner />
      </div>
    </div>
  );
}
