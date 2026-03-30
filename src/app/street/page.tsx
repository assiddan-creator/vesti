"use client";

import Image from "next/image";
import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { useCallback, useRef, useState, type CSSProperties } from "react";

type FlowState = "upload" | "analyzing" | "results";

type AnalysisResult = {
  item: string;
  style: string;
  color: string;
  material: string;
  occasion: string;
  searchQuery: string;
  asosQuery: string;
};

const primaryActionBgStyle: CSSProperties = {
  backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

function fileToBase64Image(file: File): Promise<{ mediaType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(result);
      if (!match) {
        reject(new Error("Could not read image."));
        return;
      }
      let mediaType = match[1];
      if (mediaType === "image/jpg") mediaType = "image/jpeg";
      resolve({ mediaType, data: match[2] });
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function parseAnalysisJson(text: string): AnalysisResult {
  let raw = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(raw);
  if (fence) raw = fence[1].trim();
  const parsed = JSON.parse(raw) as Partial<AnalysisResult>;
  const keys: (keyof AnalysisResult)[] = [
    "item",
    "style",
    "color",
    "material",
    "occasion",
    "searchQuery",
    "asosQuery",
  ];
  for (const k of keys) {
    if (typeof parsed[k] !== "string" || !parsed[k]?.trim()) {
      throw new Error(`Invalid response: missing or invalid field "${k}"`);
    }
  }
  return parsed as AnalysisResult;
}

function PrimaryTextureButton({
  type = "button",
  onClick,
  disabled,
  className = "",
  children,
}: {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={primaryActionBgStyle}
      className={`relative inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,40,0,0.4)] transition-shadow hover:shadow-[0_4px_28px_rgba(255,40,0,0.6)] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <span className="absolute inset-0 bg-black/40" aria-hidden />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

export default function StreetFinderPage() {
  const [flow, setFlow] = useState<FlowState>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [shoppingResults, setShoppingResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const step1Complete = flow === "analyzing" || flow === "results";
  const stepActive = flow === "upload" ? 1 : 2;
  const step2Complete = flow === "results";

  const clearFile = useCallback(() => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setShoppingResults([]);
    setError(null);
    setFlow("upload");
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }, [previewUrl]);

  const onFileChosen = useCallback((f: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    setError(null);
    setResult(null);
    setShoppingResults([]);
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setFlow("upload");
  }, []);

  const analyze = useCallback(async () => {
    if (!file) return;

    setFlow("analyzing");
    setError(null);

    try {
      const { data: imageBase64 } = await fileToBase64Image(file);
      const rawType = file.type || "image/jpeg";
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const mediaType = allowedTypes.includes(rawType) ? rawType : "image/jpeg";

      const res = await fetch("/api/analyze-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType }),
      });

      const body = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
        error?: { message?: string; type?: string };
      };

      if (!res.ok) {
        const msg = body.error?.message ?? `Request failed (${res.status})`;
        throw new Error(msg);
      }
      if (body.error) {
        throw new Error(body.error.message ?? "Analysis request failed.");
      }

      const textBlock = body.content?.find((c) => c.type === "text");
      const text = textBlock?.text?.trim();
      if (!text) throw new Error("Empty response from model.");

      const parsed = parseAnalysisJson(text);
      setResult(parsed);

      const visualRes = await fetch("/api/visual-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const visualData = await visualRes.json();
      // eslint-disable-next-line no-console -- debug: verify visual-search payload from backend
      console.log("[Shop The Look] /api/visual-search response:", visualData);
      setShoppingResults(visualData.shoppingResults || []);

      setFlow("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setFlow("upload");
    }
  }, [file]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center pt-0 pb-10 sm:pb-14 md:pb-16 px-3.5 sm:px-4">
      <div className="fixed inset-0 bg-black/70 z-0" />
      <AppNav />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 text-white sm:px-6">
        <div className="relative w-full h-[180px] sm:h-[220px] overflow-hidden">
          <Image
            src="/hero-banner.jpg"
            alt="Street Finder"
            fill
            className="object-cover"
            style={{ objectPosition: "center 30%" }}
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
            <h1 className="relative inline-block text-4xl font-extralight tracking-[0.25em] text-white sm:text-5xl md:text-6xl">
              Street Finder
              <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-[#FF2800]" />
            </h1>
            <p className="text-center text-sm tracking-wide text-[rgba(255,255,255,0.6)] sm:text-base">
              Spot it. Snap it. Shop it.
            </p>
          </div>
        </div>

        <main className="flex w-full max-w-4xl flex-col items-center gap-6 sm:gap-8">
          <div className="relative z-10 mx-auto flex w-full max-w-lg items-center border-b border-white/10 px-4 py-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={
                  stepActive === 1
                    ? "relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-black before:absolute before:inset-0 before:bg-[url('/bg-texture.jpg')] before:bg-cover before:bg-center before:opacity-50 after:absolute after:inset-0 after:bg-[#FF2800]/70 [&>*]:relative [&>*]:z-10"
                    : step1Complete
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#FF2800]/20 text-xs font-bold text-[#FF2800]"
                      : "flex h-7 w-7 items-center justify-center rounded-full bg-black border border-white/10 text-xs font-bold text-white/60"
                }
              >
                <span className="relative z-10">{step1Complete ? "✓" : "1"}</span>
              </div>
              <span
                className={
                  stepActive === 1
                    ? "text-[10px] uppercase tracking-widest text-white"
                    : "text-[10px] uppercase tracking-widest text-white/60"
                }
              >
                Snap
              </span>
            </div>
            <div
              className={`mx-3 mb-5 h-px min-w-[2rem] flex-1 ${step1Complete ? "bg-[#FF2800]/40" : "bg-white/[0.06]"}`}
            />
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={
                  stepActive === 2
                    ? "relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-black before:absolute before:inset-0 before:bg-[url('/bg-texture.jpg')] before:bg-cover before:bg-center before:opacity-50 after:absolute after:inset-0 after:bg-[#FF2800]/70 [&>*]:relative [&>*]:z-10"
                    : step2Complete
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#FF2800]/20 text-xs font-bold text-[#FF2800]"
                      : "flex h-7 w-7 items-center justify-center rounded-full bg-black border border-white/10 text-xs font-bold text-white/60"
                }
              >
                <span className="relative z-10">{step2Complete ? "✓" : "2"}</span>
              </div>
              <span
                className={
                  stepActive === 2
                    ? "text-[10px] uppercase tracking-widest text-white"
                    : "text-[10px] uppercase tracking-widest text-white/60"
                }
              >
                Find
              </span>
            </div>
          </div>

          <div className="w-full px-1 sm:px-0">
            {error && (
              <div className="mb-4 rounded-2xl border border-[#FF2800]/30 bg-black/40 px-3 py-3.5 text-sm text-white backdrop-blur-sm sm:px-4">
                {error}
              </div>
            )}

            {flow === "upload" && (
              <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-6">
                <h2 className="mb-5 text-center text-base font-semibold text-white/90">What did you spot?</h2>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={primaryActionBgStyle}
                    className="relative flex flex-1 min-h-12 items-center justify-center overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,40,0,0.4)] transition-shadow hover:shadow-[0_4px_28px_rgba(255,40,0,0.6)]"
                  >
                    <span className="absolute inset-0 bg-black/40" aria-hidden />
                    <span className="relative z-10">📷 Take Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    style={primaryActionBgStyle}
                    className="relative flex flex-1 min-h-12 items-center justify-center overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,40,0,0.4)] transition-shadow hover:shadow-[0_4px_28px_rgba(255,40,0,0.6)]"
                  >
                    <span className="absolute inset-0 bg-black/40" aria-hidden />
                    <span className="relative z-10">🖼️ Upload from Gallery</span>
                  </button>
                </div>

                {previewUrl && (
                  <div className="mt-6 flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Your photo"
                      width={200}
                      height={200}
                      className="h-[200px] w-[200px] rounded-xl border border-white/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="mt-3 text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
                    >
                      Clear photo
                    </button>
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  <PrimaryTextureButton
                    onClick={() => void analyze()}
                    disabled={!file}
                    className="w-full max-w-xs sm:min-h-0"
                  >
                    Analyze →
                  </PrimaryTextureButton>
                </div>
              </div>
            )}

            {flow === "analyzing" && (
              <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-black/40 px-6 py-16 backdrop-blur-md">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#FF2800]" />
                <p className="text-center text-sm text-white/70">Analyzing your find…</p>
              </div>
            )}

            {flow === "results" && result && (
              <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-6">
                <h2 className="mb-6 text-center text-2xl font-bold text-white">{result.item}</h2>

                <dl className="mb-8 space-y-3 text-sm">
                  {(
                    [
                      ["Style", result.style],
                      ["Color", result.color],
                      ["Material", result.material],
                      ["Occasion", result.occasion],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[#FF2800]">{label}</dt>
                      <dd className="mt-0.5 text-white">{value}</dd>
                    </div>
                  ))}
                </dl>

                {shoppingResults.length > 0 && (
                  <div className="mb-6">
                    <p className="mb-3 text-xs uppercase tracking-widest text-[#FF2800]">Shop Similar</p>
                    <div className="grid grid-cols-2 gap-3">
                      {shoppingResults.map((item: any, i: number) => (
                        <a
                          key={i}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-sm transition-all hover:border-[#FF2800]/50"
                        >
                          {item.thumbnail && (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="mb-2 h-32 w-full rounded-lg object-cover"
                              />
                            </>
                          )}
                          <p className="line-clamp-2 text-xs text-white/80">{item.title}</p>
                          {item.price && (
                            <p className="mt-1 text-xs font-semibold text-[#FF2800]">{item.price}</p>
                          )}
                          {item.source && <p className="mt-1 text-xs text-white/40">{item.source}</p>}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(result.searchQuery)}&tbm=shop`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/10"
                  >
                    🛍️ Find on Google Shopping
                  </a>
                  <a
                    href={`https://www.asos.com/search/?q=${encodeURIComponent(result.asosQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/10"
                  >
                    🛒 Search on ASOS
                  </a>
                  <Link
                    href="/try-on"
                    className="flex min-h-12 items-center justify-center rounded-xl border border-[#FF2800]/40 bg-[#FF2800]/10 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#FF2800]/20"
                  >
                    👗 Try it on me
                  </Link>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
                  >
                    Start over
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
