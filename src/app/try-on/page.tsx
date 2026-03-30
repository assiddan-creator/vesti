"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { AppNav } from "../../components/AppNav";
import { motion, AnimatePresence } from "framer-motion";
import type { Audience, Category, PresetLook } from "../../lib/preset-looks";

interface UploadCardProps {
  label: string;
  helperText: string;
  preview: string | null;
  onFileChange: (file: File) => void;
  onClear: () => void;
}

function UploadCard({
  label,
  helperText,
  preview,
  onFileChange,
  onClear,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileChange(file);
  }

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-3">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-white/90">{label}</span>
        <span className="text-sm leading-relaxed text-white/60">{helperText}</span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="upload-zone group relative flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2800]/30 sm:min-h-52"
      >
        {preview ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/10 bg-black/50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="h-full w-full object-contain" />
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur-sm group-hover:shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/60 group-hover:text-white/80">
              Add image
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      <p className="text-sm text-white/60">Preview only. Full file uploads.</p>

      {preview && (
        <button
          type="button"
          onClick={() => {
            onClear();
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="self-start rounded-md border border-white/10 bg-black px-2.5 py-1 text-xs font-semibold text-white/60 hover:border-white/20 hover:text-white/80"
        >
          Remove
        </button>
      )}
    </div>
  );
}

type ApiSuccess = {
  success: true;
  message: string;
  requestId?: string;
  output: {
    model: string;
    size: string;
    quality: string;
    format: string;
    background: string;
  };
  image: { type: "data_url"; value: string } | { type: "url"; value: string };
};

type ApiError = {
  success: false;
  requestId?: string;
  error: {
    message: string;
    details?: Record<string, unknown>;
  };
};

const TRYON_HISTORY_KEY = "vesti_tryon_history_v1";
const TRYON_HISTORY_MAX = 20;

type TryOnHistoryItem = {
  id: string;
  url: string;
  createdAt: number;
};

function persistTryOnHistory(items: TryOnHistoryItem[]) {
  if (typeof window === "undefined") return;
  const trimmed = items.slice(0, TRYON_HISTORY_MAX);
  try {
    localStorage.setItem(TRYON_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    try {
      const smaller = trimmed.slice(0, Math.max(1, Math.floor(trimmed.length / 2)));
      localStorage.setItem(TRYON_HISTORY_KEY, JSON.stringify(smaller));
    } catch {
      /* quota or private mode */
    }
  }
}

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type ModelKey = "gpt" | "flux" | "seedream" | "nano" | "imagen" | "nano1";

const MODEL_OPTIONS: Array<{
  key: ModelKey;
  label: string;
  buttonLabel: string;
  endpoint: string;
  downloadExt: "png" | "jpg" | "jpeg";
}> = [
  {
    key: "gpt",
    label: "GPT Image 1.5",
    buttonLabel: "Generate",
    endpoint: "/api/clothes-swap",
    downloadExt: "png",
  },
  {
    key: "flux",
    label: "Flux 2 Pro",
    buttonLabel: "Generate",
    endpoint: "/api/clothes-swap/flux",
    downloadExt: "jpg",
  },
  {
    key: "seedream",
    label: "Seedream 5 Lite",
    buttonLabel: "Generate",
    endpoint: "/api/clothes-swap/seedream",
    downloadExt: "jpeg",
  },
  {
    key: "nano",
    label: "Nano Banana 2",
    buttonLabel: "Generate",
    endpoint: "/api/clothes-swap/nano-banana",
    downloadExt: "jpg",
  },
  {
    key: "nano1",
    label: "Nano Banana 1 (Google)",
    buttonLabel: "Generate",
    endpoint: "/api/clothes-swap/nano1",
    downloadExt: "png",
  },
  {
    key: "imagen",
    label: "Nano Banana 2 (Google)",
    buttonLabel: "Generate",
    endpoint: "/api/clothes-swap/imagen",
    downloadExt: "png",
  },
];

export default function TryOnPage() {
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelKey>("gpt");
  const [audience, setAudience] = useState<Audience>("women");
  const [category, setCategory] = useState<Category>("Recommended");
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [presetLooks, setPresetLooks] = useState<PresetLook[]>([]);
  const [isPresetGalleryOpen, setIsPresetGalleryOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [apiSuccess, setApiSuccess] = useState<ApiSuccess | null>(null);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);
  const isLoading = isSubmitting;
  const lookPickerSectionRef = useRef<HTMLElement | null>(null);
  const resultSectionRef = useRef<HTMLDivElement | null>(null);
  const [isResultPreviewOpen, setIsResultPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [tryOnHistory, setTryOnHistory] = useState<TryOnHistoryItem[]>([]);
  const [historyLightboxUrl, setHistoryLightboxUrl] = useState<string | null>(null);
  /** Used for analytics / DB event payload (defaults until a fit UI is added). */
  const [fitPreference, setFitPreference] = useState("Regular");

  const canSubmit = useMemo(
    () => Boolean(personFile && garmentFile) && !isSubmitting,
    [personFile, garmentFile, isSubmitting],
  );

  const personPreview = useMemo(() => {
    if (!personFile) return null;
    return URL.createObjectURL(personFile);
  }, [personFile]);

  const garmentPreview = useMemo(() => {
    if (!garmentFile) return null;
    return URL.createObjectURL(garmentFile);
  }, [garmentFile]);

  const selectedPresetLook = useMemo(() => {
    if (!selectedLookId) return null;
    return presetLooks.find((l) => l.id === selectedLookId) ?? null;
  }, [presetLooks, selectedLookId]);

  useEffect(() => {
    return () => {
      if (personPreview) URL.revokeObjectURL(personPreview);
    };
  }, [personPreview]);

  useEffect(() => {
    return () => {
      if (garmentPreview) URL.revokeObjectURL(garmentPreview);
    };
  }, [garmentPreview]);

  function handlePersonFile(file: File) {
    setPersonFile(file);
  }

  function handleClothingFile(file: File) {
    setGarmentFile(file);
    setSelectedLookId(null);
    setCategory("Recommended");
    setIsPresetGalleryOpen(false);
  }

  function clearGarmentReference() {
    setGarmentFile(null);
    setSelectedLookId(null);
    setIsPresetGalleryOpen(true);
  }

  async function handleDownloadResult() {
    if (!apiSuccess?.image) return;
    try {
      const filename = "vesti-tryon.jpg";

      // For embedded images, download directly.
      if (apiSuccess.image.type === "data_url") {
        const a = document.createElement("a");
        a.href = apiSuccess.image.value;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // For URL-based images, fetch then download as a blob.
      const res = await fetch(apiSuccess.image.value, { cache: "no-store" });
      if (!res.ok) throw new Error(`Download failed with status ${res.status}`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Download failed:", error);
    }
  }

  const categories = useMemo(() => {
    return audience === "women"
      ? (["Recommended", "Lingerie", "Casual", "Event"] as const)
      : (["Recommended", "Casual", "Event", "Streetwear"] as const);
  }, [audience]);

  useEffect(() => {
    let cancelled = false;
    setPresetLooks([]);

    async function loadPresetLooks() {
      try {
        const params = new URLSearchParams({
          audience,
          category,
        });
        const res = await fetch(`/api/preset-looks?${params.toString()}`);
        if (!res.ok) {
          if (!cancelled) setPresetLooks([]);
          return;
        }
        const data = (await res.json()) as { success: boolean; looks?: PresetLook[] };
        if (!cancelled) {
          setPresetLooks(data.success && Array.isArray(data.looks) ? data.looks : []);
        }
      } catch {
        if (!cancelled) setPresetLooks([]);
      }
    }

    void loadPresetLooks();

    return () => {
      cancelled = true;
    };
  }, [audience, category]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRYON_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const next: TryOnHistoryItem[] = [];
      for (const p of parsed) {
        if (
          p &&
          typeof p === "object" &&
          typeof (p as TryOnHistoryItem).id === "string" &&
          typeof (p as TryOnHistoryItem).url === "string" &&
          typeof (p as TryOnHistoryItem).createdAt === "number"
        ) {
          next.push(p as TryOnHistoryItem);
        }
      }
      setTryOnHistory(next.slice(0, TRYON_HISTORY_MAX));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setIsResultPreviewOpen(false);
    if (!apiSuccess?.image?.value) return;

    let cancelled = false;
    const scrollToResult = () => {
      if (cancelled) return;
      resultSectionRef.current?.scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "nearest",
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToResult);
    });
    const t1 = window.setTimeout(scrollToResult, 120);
    const t2 = window.setTimeout(scrollToResult, 450);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [apiSuccess?.image?.value]);

  useEffect(() => {
    if (!isResultPreviewOpen && !historyLightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsResultPreviewOpen(false);
        setHistoryLightboxUrl(null);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isResultPreviewOpen, historyLightboxUrl]);

  const selected = useMemo(() => {
    return MODEL_OPTIONS.find((m) => m.key === selectedModel) ?? MODEL_OPTIONS[0];
  }, [selectedModel]);

  async function selectPresetLook(look: PresetLook) {
    setSelectedLookId(look.id);
    setIsPresetGalleryOpen(false);
    try {
      const res = await fetch(look.imageSrc);
      const blob = await res.blob();
      const file = new File([blob], `${look.id}.svg`, {
        type: blob.type || "image/svg+xml",
      });
      setGarmentFile(file);
    } catch {
      // If something goes wrong, fall back to clearing selection (manual upload still works).
      setSelectedLookId(null);
      setIsPresetGalleryOpen(true);
    }
  }

  async function handleGenerate() {
    if (!personFile || !garmentFile) return;

    // Strong synchronous guards to prevent double-clicks / double-submits.
    if (isLoading || inFlightRef.current) return;
    inFlightRef.current = true;
    const requestId = createRequestId();
    requestIdRef.current = requestId;

    // Log exactly once per attempt.
    // eslint-disable-next-line no-console
    console.log(`GEN_START ${requestId}`);

    setIsSubmitting(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const formData = new FormData();
      formData.append("targetImage", personFile);
      formData.append("garmentImage", garmentFile);
      formData.append("requestId", requestId);

      const refine = refinePrompt.trim();
      if (refine.length > 0) formData.append("refinePrompt", refine);

      const res = await fetch(selected.endpoint, {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as ApiSuccess | ApiError;
      if (!res.ok) {
        setApiError(
          (data as ApiError) ?? {
            success: false,
            error: { message: "Request failed." },
          },
        );
        return;
      }

      const success = data as ApiSuccess;
      setApiSuccess(success);

      const productIdForTracking = selectedLookId
        ? (selectedPresetLook?.id ?? selectedLookId)
        : "custom_upload";
      const trackingBody: Record<string, unknown> = {
        productId: productIdForTracking,
        userFitPreference: fitPreference,
        matchConfidence: 0.95,
      };
      if (selectedLookId == null && garmentPreview) {
        trackingBody.originalUserImageUrl = garmentPreview;
      }
      void fetch("/api/events/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingBody),
      })
        .then(async (trackRes) => {
          if (trackRes.ok) {
            await trackRes.json();
            // eslint-disable-next-line no-console -- analytics confirmation
            console.log("Event tracked successfully");
          }
        })
        .catch(() => {
          /* fire-and-forget: ignore */
        });

      const imageUrl = success.image?.value;
      if (imageUrl && typeof imageUrl === "string") {
        setTryOnHistory((prev) => {
          const item: TryOnHistoryItem = {
            id: createRequestId(),
            url: imageUrl,
            createdAt: Date.now(),
          };
          const next = [item, ...prev.filter((h) => h.url !== imageUrl)].slice(0, TRYON_HISTORY_MAX);
          persistTryOnHistory(next);
          return next;
        });
      }
    } catch (error) {
      setApiError({
        success: false,
        error: {
          message: "Network error. Please try again.",
          details: { reason: error instanceof Error ? error.message : "Unknown error" },
        },
      });
    } finally {
      setIsSubmitting(false);
      inFlightRef.current = false;
      requestIdRef.current = null;
    }
  }

  const primaryActionBgStyle: CSSProperties = {
    backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 bg-black/70 z-0" />
      <AppNav />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-12 pt-16 text-white sm:px-6 md:pb-16">
      <div className="relative w-full h-[220px] sm:h-[260px] overflow-hidden">
        {/* Hero image */}
        <Image
          src="/hero-banner.jpg"
          alt="Vesti — AI Virtual Try-On"
          fill
          className="object-cover"
          style={{ objectPosition: "center 30%" }}
          sizes="100vw"
          priority
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80" />
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <h1 className="text-white font-extralight tracking-[0.3em] text-5xl sm:text-6xl md:text-7xl relative inline-block">
            Vesti
            <span className="absolute -bottom-2 left-0 right-0 h-px bg-[#FF2800]" />
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm sm:text-base tracking-wider">Try before you buy.</p>
        </div>
      </div>
      <main className="flex w-full max-w-4xl flex-col items-center gap-8 sm:gap-10 md:gap-12">
        <div className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between border-b border-white/10 px-2 py-4 sm:px-4">
          {[
            { n: 1, label: "Your Photo" },
            { n: 2, label: "Garment" },
            { n: 3, label: "Generate" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={
                    currentStep === n
                      ? "relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-black before:absolute before:inset-0 before:bg-[url('/bg-texture.jpg')] before:bg-cover before:bg-center before:opacity-50 after:absolute after:inset-0 after:bg-[#FF2800]/70 [&>*]:relative [&>*]:z-10"
                      : currentStep > n
                        ? "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#FF2800]/20 text-[#FF2800]"
                        : "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-black border border-white/10 text-white/60"
                  }
                >
                  <span className="relative z-10">{currentStep > n ? "✓" : n}</span>
                </div>
                <span
                  className={
                    currentStep === n
                      ? "text-[10px] tracking-widest uppercase text-white"
                      : "text-[10px] tracking-widest uppercase text-white/60"
                  }
                >
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={
                    "h-px flex-1 mx-3 mb-5 " +
                    (currentStep > n ? "bg-[#FF2800]/40" : "bg-white/[0.06]")
                  }
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            {currentStep === 1 && (
              <div className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-5">
                <UploadCard
                  label="Target Person"
                  helperText="Portrait to keep pose and framing"
                  preview={personPreview}
                  onFileChange={handlePersonFile}
                  onClear={() => setPersonFile(null)}
                />

                <div className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-4">
                  <label className="mb-2 block text-base font-semibold text-white/90">
                    Refinement (optional)
                  </label>
                  <textarea
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder="Keep pose, preserve face, match light"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-[#FF2800]/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!personFile}
                  style={primaryActionBgStyle}
                  className="relative mt-5 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,40,0,0.4)] transition-shadow hover:shadow-[0_4px_28px_rgba(255,40,0,0.6)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:px-6"
                >
                  <span className="absolute inset-0 bg-black/40" aria-hidden />
                  <span className="relative z-10">Next — Choose Garment →</span>
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-5">
                <UploadCard
                  label="Clothing Reference"
                  helperText="Garment, flat lay, or product shot"
                  preview={garmentPreview}
                  onFileChange={(file) => {
                    handleClothingFile(file);
                    setIsPresetGalleryOpen(false);
                  }}
                  onClear={() => {
                    setGarmentFile(null);
                    setSelectedLookId(null);
                    setIsPresetGalleryOpen(true);
                  }}
                />

                <section ref={lookPickerSectionRef} className="mt-4 w-full">
                  <div className="mb-3 flex flex-col gap-1 sm:mb-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 text-left text-base font-semibold text-white/90 sm:text-left">
                        Choose a look{" "}
                        <span className="font-medium text-white/60">
                          · {audience === "women" ? "Women" : "Men"} / {category}
                        </span>
                      </div>
                      {selectedLookId && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setSelectedLookId(null);
                            setIsPresetGalleryOpen(true);
                          }}
                          className="text-xs font-semibold text-white/60 underline-offset-2 hover:text-white/80 hover:underline disabled:opacity-60"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed text-white/60">
                      Presets fill the garment slot. Upload your own anytime.
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <label className="mb-2 block text-base font-semibold tracking-wide text-white/90 uppercase">
                      For
                    </label>
                    <div className="inline-flex w-full rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setAudience("women");
                          setCategory("Recommended");
                          setSelectedLookId(null);
                          setIsPresetGalleryOpen(true);
                        }}
                        disabled={isSubmitting}
                        className={
                          audience === "women"
                            ? "relative min-h-11 flex-1 overflow-hidden rounded-full px-4 py-2.5 text-sm font-semibold text-white before:absolute before:inset-0 before:bg-[url('/bg-texture.jpg')] before:bg-cover before:bg-center before:opacity-40 after:absolute after:inset-0 after:bg-[#FF2800]/75 sm:flex-none sm:py-2 [&>*]:relative [&>*]:z-10"
                            : "min-h-11 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white disabled:opacity-60 sm:flex-none sm:py-2"
                        }
                      >
                        <span className="relative z-10">Women</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAudience("men");
                          setCategory("Recommended");
                          setSelectedLookId(null);
                          setIsPresetGalleryOpen(true);
                        }}
                        disabled={isSubmitting}
                        className={
                          audience === "men"
                            ? "relative min-h-11 flex-1 overflow-hidden rounded-full px-4 py-2.5 text-sm font-semibold text-white before:absolute before:inset-0 before:bg-[url('/bg-texture.jpg')] before:bg-cover before:bg-center before:opacity-40 after:absolute after:inset-0 after:bg-[#FF2800]/75 sm:flex-none sm:py-2 [&>*]:relative [&>*]:z-10"
                            : "min-h-11 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white disabled:opacity-60 sm:flex-none sm:py-2"
                        }
                      >
                        <span className="relative z-10">Men</span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 sm:mb-5">
                    <label className="mb-2 block text-base font-semibold tracking-wide text-white/90 uppercase">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                      {categories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setCategory(c);
                            setSelectedLookId(null);
                            setIsPresetGalleryOpen(true);
                          }}
                          className={
                            category === c
                              ? "relative min-h-11 overflow-hidden rounded-xl px-2.5 py-2 text-xs font-semibold text-white before:absolute before:inset-0 before:bg-[url('/bg-texture.jpg')] before:bg-cover before:bg-center before:opacity-40 after:absolute after:inset-0 after:bg-[#FF2800]/75 sm:px-4 sm:py-2.5 sm:text-sm [&>*]:relative [&>*]:z-10"
                              : "min-h-11 rounded-xl border border-white/[0.06] bg-white/10 px-2.5 py-2 text-sm font-medium text-white/80 hover:border-white/15 disabled:opacity-60 sm:px-4 sm:py-2.5"
                          }
                        >
                          <span className="relative z-10">{c}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isPresetGalleryOpen ? (
                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/60 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
                      <span className="min-w-0 font-semibold text-white sm:truncate">
                        {selectedLookId ? (selectedPresetLook?.title ?? "Selected look") : "No preset"}
                      </span>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsPresetGalleryOpen(true)}
                        className="min-h-10 w-full shrink-0 rounded-lg border border-white/10 bg-black px-3 py-2 text-xs font-semibold text-white/60 hover:border-white/20 disabled:opacity-60 sm:w-auto sm:py-1.5"
                      >
                        Browse
                      </button>
                    </div>
                  ) : presetLooks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/50 px-3 py-4 backdrop-blur-sm sm:px-4">
                      <p className="text-sm font-semibold tracking-[0.12em] text-white/60 uppercase">
                        Empty folder
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        Add files to
                        <span className="font-semibold text-white">
                          {" "}
                          public/looks/{audience}/{category.toLowerCase().replaceAll(" ", "")}/
                        </span>
                        . They show up here.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      key={`${audience}-${category}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"
                    >
                      {presetLooks.map((look) => {
                        const isSelected = selectedLookId === look.id;
                        return (
                          <button
                            key={look.id}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void selectPresetLook(look)}
                            className={
                              isSelected
                                ? "group relative overflow-hidden rounded-2xl border border-[#FF2800]/50 bg-white/5 ring-1 ring-[#FF2800]/20 backdrop-blur-sm"
                                : "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 backdrop-blur-sm"
                            }
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={look.imageSrc}
                                alt={look.title}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23f4f4f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2371717a' font-family='Arial,sans-serif' font-size='18'%3EPreview unavailable%3C/text%3E%3C/svg%3E";
                                }}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="px-3 py-2">
                              <div className="text-left text-sm font-medium leading-4 text-white">
                                {look.title}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/95 px-2 py-1 text-[10px] font-semibold text-white">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-3 w-3"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 011.415-1.415l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Selected
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </section>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 rounded-xl border border-white/10 bg-black px-5 py-3 text-sm font-semibold text-white/60"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!garmentFile}
                    style={primaryActionBgStyle}
                    className="relative inline-flex min-h-12 flex-1 touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,40,0,0.4)] transition-shadow hover:shadow-[0_4px_28px_rgba(255,40,0,0.6)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:px-6"
                  >
                    <span className="absolute inset-0 bg-black/40" aria-hidden />
                    <span className="relative z-10">Next — Generate →</span>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-5 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="mb-4 text-xs text-white/60 hover:text-white/80 hover:underline underline-offset-2"
                >
                  ← Back
                </button>

                <section className="w-full">
                  <form
                    className="flex w-full flex-col items-center gap-3"
                    aria-busy={isSubmitting}
                    onKeyDown={(e) => {
                      // Prevent accidental Enter-to-submit from non-textarea elements.
                      if (e.key === "Enter") {
                        const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase?.();
                        if (tag !== "textarea") e.preventDefault();
                      }
                    }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleGenerate();
                    }}
                  >
                    <p className="text-sm text-white/40 uppercase tracking-widest text-center mb-4">
                      {audience} · {category}
                    </p>

                    {garmentPreview && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={garmentPreview}
                          alt="Garment preview"
                          className="w-48 h-48 object-cover rounded-xl mx-auto mb-6 border border-white/10"
                        />
                        <p className="text-sm text-white/30 text-center mb-6">Garment selected</p>
                      </>
                    )}

                    <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:min-w-[26rem]">
                      <div className="flex w-full min-w-0 flex-col gap-2">
                        <label className="text-base font-semibold text-white">Model</label>
                        <div className="relative w-full min-w-0">
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
                            disabled={isSubmitting}
                            className="min-h-11 w-full min-w-0 appearance-none rounded-xl border border-white/[0.08] bg-black px-4 py-3 pr-10 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-[#FF2800]/30 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {MODEL_OPTIONS.map((m) => (
                              <option key={m.key} value={m.key}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-5 w-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!canSubmit}
                        style={primaryActionBgStyle}
                        className="relative inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,40,0,0.4)] hover:shadow-[0_4px_28px_rgba(255,40,0,0.6)] transition-shadow disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:px-6"
                      >
                        <span className="absolute inset-0 bg-black/40" aria-hidden />
                        <span className="relative z-10 inline-flex items-center justify-center gap-2">
                          {isSubmitting && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          )}
                          {isSubmitting ? "Generating…" : selected.buttonLabel}
                        </span>
                      </button>
                      {!isSubmitting && (!personFile || !garmentFile) && (
                        <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-sm leading-relaxed text-white/60 backdrop-blur-sm">
                          {!personFile && !garmentFile
                            ? "Add both uploads in Step 1 to continue."
                            : !personFile
                              ? "Add a person photo in Step 1."
                              : "Add a garment or choose a preset."}
                        </p>
                      )}
                      {isSubmitting && (
                        <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-center backdrop-blur-sm">
                          <p className="text-sm font-medium text-white">Processing…</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-white/60">
                            May take a moment.
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-white/60">Vesti · AI-powered virtual try-on</p>
                  </form>
                </section>

                <div ref={resultSectionRef} className="w-full">
                  {apiError && (
                    <div className="rounded-2xl border border-[#FF2800]/30 bg-black/40 px-3 py-3.5 text-sm text-white backdrop-blur-sm sm:px-4">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black text-white/60 ring-1 ring-white/10"
                          aria-hidden
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tracking-[0.12em] text-[#FF2800] uppercase">
                            Could not generate
                          </div>
                          <div className="mt-1.5 text-sm leading-relaxed text-[rgba(255,255,255,0.6)]">
                            {apiError.error.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {apiSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="rounded-3xl border border-[#FF2800]/25 bg-black p-4 text-sm sm:p-5 md:p-6"
                    >
                      <div className="text-base font-semibold leading-snug tracking-tight text-white">
                        {apiSuccess.message}
                      </div>
                      <div className="mt-5 sm:mt-6">
                        <div className="mb-2 text-sm font-semibold tracking-[0.14em] text-[#FF2800]/90 uppercase sm:mb-3">
                          Result
                        </div>
                        <div className="overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                          <div className="bg-black p-2 sm:p-2.5 md:p-3.5">
                            <button
                              type="button"
                              onClick={() => setIsResultPreviewOpen(true)}
                              className="relative w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2800]/30"
                              aria-label="View full size"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={apiSuccess.image.value}
                                alt="Swap result"
                                className="max-h-[min(65vh,32rem)] w-full rounded-xl bg-black object-contain ring-1 ring-white/10 sm:max-h-[70vh]"
                              />
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                            <a
                              href={apiSuccess.image.value}
                              download="vesti-tryon.jpg"
                              onClick={(e) => {
                                e.preventDefault();
                                void handleDownloadResult();
                              }}
                              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-4 text-sm font-semibold text-white"
                              style={{
                                backgroundImage: "url('/Luxury_fashion_flat_202603252000.jpeg')",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            >
                              <span className="absolute inset-0 bg-black/40" />
                              <span className="relative z-10">⬇️ Save Photo</span>
                            </a>
                            <button
                              type="button"
                              onClick={async () => {
                                if (typeof navigator !== "undefined" && "share" in navigator && navigator.share) {
                                  try {
                                    await navigator.share({
                                      title: "Check my new look on Vesti!",
                                      text: "I tried on this outfit virtually — what do you think?",
                                      url: window.location.href,
                                    });
                                  } catch {
                                    /* user dismissed share sheet */
                                  }
                                } else {
                                  await navigator.clipboard.writeText(window.location.href);
                                  alert("Link copied!");
                                }
                              }}
                              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/20 bg-black/40 py-4 text-sm font-semibold text-white backdrop-blur-sm"
                            >
                              <span className="relative z-10">📤 Share My Look</span>
                            </button>
                          </div>
                          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] bg-[#0a0a0a] px-3 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5 sm:px-4 sm:py-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsPresetGalleryOpen(true);
                                setCurrentStep(2);
                              }}
                              disabled={isSubmitting}
                              className="min-h-11 w-full shrink-0 rounded-lg border border-white/15 bg-transparent px-3.5 py-2.5 text-xs font-semibold text-[#AAAAAA] hover:border-white/30 disabled:opacity-60 sm:w-auto sm:py-2"
                            >
                              Change look
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {tryOnHistory.length > 0 && (
        <section
          className="mt-10 w-full max-w-4xl px-3 sm:mt-12 sm:px-4"
          aria-labelledby="tryon-history-heading"
        >
          <div className="rounded-2xl border border-white/10 bg-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="tryon-history-heading"
                  className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF2800]"
                >
                  Your try-ons
                </h2>
                <p className="mt-1 text-xs text-white/50">Saved on this device only — tap to enlarge.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTryOnHistory([]);
                  persistTryOnHistory([]);
                }}
                className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/70 backdrop-blur-sm transition-colors hover:border-[#FF2800]/50 hover:text-white"
              >
                Clear history
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {tryOnHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHistoryLightboxUrl(item.url)}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md ring-1 ring-[#FF2800]/15 transition-all hover:border-[#FF2800]/50 hover:ring-[#FF2800]/45"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt=""
                    className="aspect-[3/4] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent py-2 text-[10px] font-medium uppercase tracking-wider text-white/80">
                    Tap to view
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>

      {(historyLightboxUrl || (isResultPreviewOpen && apiSuccess?.image)) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Full-size result"
          onClick={() => {
            setHistoryLightboxUrl(null);
            setIsResultPreviewOpen(false);
          }}
        >
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 p-2.5 text-white shadow-lg backdrop-blur-md hover:bg-white/20 sm:right-4 sm:top-4"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setHistoryLightboxUrl(null);
              setIsResultPreviewOpen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="max-h-[min(92vh,100%)] max-w-[min(96vw,96rem)] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={historyLightboxUrl ?? apiSuccess?.image?.value ?? ""}
              alt="Swap result, full size"
              className="max-h-[92vh] w-auto max-w-full rounded-xl object-contain shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
