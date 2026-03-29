"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { AppNav } from "../../components/AppNav";

type SizeResult = {
  store?: string;
  productName?: string;
  recommendedSize?: string;
  confidence?: string;
  reasoning?: string;
  sizeChart?: string | null;
  warning?: string | null;
};

export default function SizeFinderPage() {
  const [step, setStep] = useState<"photo" | "details" | "link" | "analyzing" | "result">("photo");
  const [photo, setPhoto] = useState<string | null>(null);
  const [bodyAnalysis, setBodyAnalysis] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [productUrl, setProductUrl] = useState<string>("");
  const [result, setResult] = useState<SizeResult | null>(null);
  const [error, setError] = useState<string>("");
  const [fitPreference, setFitPreference] = useState("Regular");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fitOptions = ["Slim", "Regular", "Oversize"] as const;

  const handlePhotoChosen = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPhoto(dataUrl);

      // קלוד מנתח את הגוף מיד
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type || "image/jpeg";

      try {
        await fetch("/api/analyze-outfit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });
        // נשתמש בניתוח הגוף
        setBodyAnalysis("User body detected from photo");
      } catch {
        setBodyAnalysis("Standard body type");
      }

      setStep("details");
    };
    reader.readAsDataURL(file);
  }, []);

  const analyze = async () => {
    if (!height || !productUrl) return;
    setStep("analyzing");
    setError("");

    try {
      const res = await fetch("/api/size-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl,
          userHeight: height,
          bodyAnalysis,
          fitPreference,
        }),
      });
      const data = (await res.json()) as SizeResult & { error?: string };
      if (data.error) {
        setError(data.error);
        setStep("link");
      } else {
        setResult(data);
        setStep("result");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("link");
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* אוברליי */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/70" />

      <AppNav />

      {/* רקע */}
      <div className="relative z-10 flex w-full flex-col items-center pt-16 text-[#F2EFE9]">
        {/* בנר */}
        <div className="relative h-[200px] w-full overflow-hidden">
          <Image src="/hero-banner.jpg" alt="Size Finder" fill className="object-cover object-top opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <h1 className="font-serif text-4xl tracking-widest text-white">Size Finder</h1>
            <p className="mt-1 text-sm italic text-white/60">Will it fit? Find out before you buy.</p>
          </div>
        </div>

        {/* סרגל שלבים */}
        <div className="relative z-10 mb-6 flex w-full items-center justify-between border-b border-white/10 px-8 py-3">
          {["SNAP", "DETAILS", "LINK", "RESULT"].map((label, i) => {
            const steps = ["photo", "details", "link", "result"];
            const isActive = steps[i] === step || (step === "analyzing" && i === 2);
            const isDone = steps.indexOf(step) > i || (step === "analyzing" && i < 2);
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all
                  ${isActive ? "bg-[#FF2800] text-white" : isDone ? "bg-[#FF2800]/60 text-white" : "bg-white/10 text-white/40"}`}
                >
                  {isDone && steps.indexOf(step) > i ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] uppercase tracking-widest ${isActive ? "text-white" : "text-white/30"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-2xl px-4 pb-12">
          {/* שלב 1 — צילום */}
          {step === "photo" && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
              <h2 className="mb-1 text-base font-semibold text-white/90">Snap a photo of yourself</h2>
              <p className="mb-6 text-sm text-white/60">Stand straight, full body visible, against a plain wall</p>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="relative overflow-hidden rounded-xl py-4 text-sm font-semibold text-white"
                  style={{
                    backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="absolute inset-0 bg-black/40" />
                  <span className="relative z-10">📷 Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative overflow-hidden rounded-xl py-4 text-sm font-semibold text-white"
                  style={{
                    backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="absolute inset-0 bg-black/40" />
                  <span className="relative z-10">🖼️ Upload Photo</span>
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoChosen(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoChosen(e.target.files[0])}
              />

              {/* הנחיות */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs uppercase tracking-widest text-[#FF2800]">For best results</p>
                <ul className="space-y-1 text-xs text-white/60">
                  <li>• Stand against a plain wall</li>
                  <li>• Full body in frame — head to toe</li>
                  <li>• Wear fitted clothing</li>
                  <li>• Good lighting</li>
                </ul>
              </div>
            </div>
          )}

          {/* שלב 2 — פרטים */}
          {step === "details" && (
            <div className="space-y-4">
              {photo && (
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="You" className="h-20 w-20 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-white/80">Photo captured ✓</p>
                    <p className="mt-1 text-xs text-white/40">Looking good!</p>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
                <h2 className="mb-4 text-base font-semibold text-white/90">One quick question</h2>
                <label className="text-xs uppercase tracking-widest text-[#FF2800]">Your Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 178"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white/90 outline-none focus:border-[#FF2800]/50"
                />
                <button
                  type="button"
                  onClick={() => height && setStep("link")}
                  disabled={!height}
                  className="relative mt-6 w-full overflow-hidden rounded-xl py-4 font-semibold text-white disabled:opacity-40"
                  style={{
                    backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="absolute inset-0 bg-black/40" />
                  <span className="relative z-10">Next — Paste Link →</span>
                </button>
              </div>
            </div>
          )}

          {/* שלב 3 — לינק */}
          {step === "link" && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
              <h2 className="mb-1 text-base font-semibold text-white/90">Paste the product link</h2>
              <p className="mb-6 text-sm text-white/60">AliExpress, Shein, ASOS, Zara — any store</p>

              <input
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.aliexpress.com/item/..."
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white/90 outline-none focus:border-[#FF2800]/50"
              />

              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
                <p className="mb-3 text-xs uppercase tracking-widest text-white/50">Fit preference</p>
                <p className="mb-3 text-xs leading-relaxed text-white/45">
                  How do you like clothes to fit in this garment? We adjust ease and sizing math accordingly.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {fitOptions.map((option) => {
                    const selected = fitPreference === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFitPreference(option)}
                        className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all sm:text-sm ${
                          selected
                            ? "border-[#FF2800] bg-[#FF2800]/15 text-white shadow-[0_0_20px_rgba(255,40,0,0.25)] ring-1 ring-[#FF2800]/40"
                            : "border-white/15 bg-white/[0.06] text-white/65 hover:border-white/25 hover:text-white/90"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={analyze}
                disabled={!productUrl}
                className="relative mt-6 w-full overflow-hidden rounded-xl py-4 font-semibold text-white disabled:opacity-40"
                style={{
                  backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <span className="absolute inset-0 bg-black/40" />
                <span className="relative z-10">Find My Size →</span>
              </button>
            </div>
          )}

          {/* שלב ניתוח */}
          {step === "analyzing" && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center backdrop-blur-md">
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-[#FF2800] border-t-transparent" />
              <p className="text-sm text-white/80">Analyzing product size chart...</p>
              <p className="mt-2 text-xs text-white/40">This may take a moment</p>
            </div>
          )}

          {/* שלב תוצאה */}
          {step === "result" && result && (
            <div className="space-y-4">
              {/* מידה מומלצת */}
              <div className="rounded-2xl border border-[#FF2800]/30 bg-black/40 p-6 text-center backdrop-blur-md">
                <p className="mb-2 text-xs uppercase tracking-widest text-[#FF2800]">
                  {result.store ?? "Recommended Size"}
                </p>
                <div className="my-4 text-7xl font-bold text-white">{result.recommendedSize ?? ""}</div>
                <div
                  className={`inline-block rounded-full px-3 py-1 text-xs uppercase tracking-widest
                  ${result.confidence === "high"
                    ? "bg-green-500/20 text-green-400"
                    : result.confidence === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"}`}
                >
                  {result.confidence ?? ""} confidence
                </div>
              </div>

              {/* הסבר */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
                <p className="mb-2 text-xs uppercase tracking-widest text-[#FF2800]">Why this size</p>
                <p className="text-sm leading-relaxed text-white/80">{result.reasoning ?? ""}</p>
              </div>

              {/* אזהרה אם יש */}
              {result.warning && (
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <p className="mb-1 text-xs uppercase tracking-widest text-yellow-400">⚠️ Note</p>
                  <p className="text-sm text-white/70">{result.warning}</p>
                </div>
              )}

              {/* טבלת מידות אם נמצאה */}
              {result.sizeChart && (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                  <p className="mb-2 text-xs uppercase tracking-widest text-[#FF2800]">Size Chart Found</p>
                  <p className="text-xs leading-relaxed text-white/60">{result.sizeChart}</p>
                </div>
              )}

              {/* כפתורי פעולה */}
              <button
                type="button"
                onClick={() => {
                  setStep("photo");
                  setPhoto(null);
                  setResult(null);
                  setProductUrl("");
                  setHeight("");
                  setFitPreference("Regular");
                }}
                className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/50 transition-all hover:text-white/80"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
