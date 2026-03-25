"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Audience, Category, PresetLook } from "../lib/preset-looks";

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
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#111111] p-2.5 sm:p-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[#f5f0eb]">{label}</span>
        <span className="text-xs leading-relaxed text-[#666]">{helperText}</span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-[#141414] hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/30 sm:min-h-52"
      >
        {preview ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#0a0a0a] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] ring-1 ring-white/10 group-hover:shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#666]"
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
            <span className="text-sm font-medium text-[#555] group-hover:text-[#aaa]">
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

      <p className="text-xs text-[#666]">Preview only. Full file uploads.</p>

      {preview && (
        <button
          type="button"
          onClick={() => {
            onClear();
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="self-start rounded-md border border-white/10 bg-[#1a1a1a] px-2.5 py-1 text-xs font-semibold text-[#888] hover:border-white/20 hover:text-[#aaa]"
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
  image:
    | { type: "data_url"; value: string }
    | { type: "url"; value: string };
};

type ApiError = {
  success: false;
  requestId?: string;
  error: {
    message: string;
    details?: Record<string, unknown>;
  };
};

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type ModelKey = "gpt" | "flux" | "seedream" | "nano";

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
];

export default function Home() {
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
  const [downloadName, setDownloadName] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);
  const isLoading = isSubmitting;
  const lookPickerSectionRef = useRef<HTMLElement | null>(null);
  const resultSectionRef = useRef<HTMLDivElement | null>(null);
  const [isResultPreviewOpen, setIsResultPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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
      const filename = downloadName ?? "vesti-result.png";

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
    if (!isResultPreviewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsResultPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isResultPreviewOpen]);

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
    setDownloadName(null);

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

      setApiSuccess(data as ApiSuccess);
      setDownloadName(
        `vesti_${selected.key}_${new Date().toISOString().replaceAll(":", "-")}.${selected.downloadExt}`,
      );
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-3.5 py-10 sm:px-4 sm:py-14 md:py-16 text-[#f5f0eb]">
      <main className="flex w-full max-w-4xl flex-col items-center gap-8 sm:gap-10 md:gap-12">
        {/* Step Indicator */}
        <div className="w-full flex items-center gap-0 mb-8">
          <div className="flex flex-col items-center">
            <div
              className={
                currentStep === 1
                  ? "bg-[#c9a96e] text-[#0a0a0a] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  : currentStep > 1
                    ? "bg-[#c9a96e]/20 text-[#c9a96e] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    : "bg-[#1a1a1a] text-[#555] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              }
            >
              1
            </div>
            <div
              className={
                currentStep >= 1
                  ? "mt-2 text-[10px] tracking-widest uppercase text-[#f5f0eb]"
                  : "mt-2 text-[10px] tracking-widest uppercase text-[#444]"
              }
            >
              Upload
            </div>
          </div>
          <div
            className={`flex-1 h-px ${currentStep > 1 ? "bg-[#c9a96e]/40" : "bg-white/[0.06]"}`}
          />
          <div className="flex flex-col items-center">
            <div
              className={
                currentStep === 2
                  ? "bg-[#c9a96e] text-[#0a0a0a] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  : currentStep > 2
                    ? "bg-[#c9a96e]/20 text-[#c9a96e] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    : "bg-[#1a1a1a] text-[#555] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              }
            >
              2
            </div>
            <div
              className={
                currentStep >= 2
                  ? "mt-2 text-[10px] tracking-widest uppercase text-[#f5f0eb]"
                  : "mt-2 text-[10px] tracking-widest uppercase text-[#444]"
              }
            >
              Choose Look
            </div>
          </div>
          <div
            className={`flex-1 h-px ${currentStep > 2 ? "bg-[#c9a96e]/40" : "bg-white/[0.06]"}`}
          />
          <div className="flex flex-col items-center">
            <div
              className={
                currentStep === 3
                  ? "bg-[#c9a96e] text-[#0a0a0a] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  : "bg-[#1a1a1a] text-[#555] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              }
            >
              3
            </div>
            <div
              className={
                currentStep >= 3
                  ? "mt-2 text-[10px] tracking-widest uppercase text-[#f5f0eb]"
                  : "mt-2 text-[10px] tracking-widest uppercase text-[#444]"
              }
            >
              Generate
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
          <h1 className="text-[#f5f0eb] font-light tracking-widest text-5xl">
            Vesti
          </h1>
          <p className="text-[#555] italic text-base">Try before you buy.</p>
        </div>

        {/* Slider Container */}
        <div className="w-full overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
          >
            {/* Step 1 Panel */}
            <div className="w-full shrink-0">
              <div className="w-full rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
        {/* Upload Cards */}
        <section className="w-full">
          <div className="flex w-full flex-col gap-3 sm:gap-4 sm:flex-row">
            <UploadCard
              label="Target Person"
              helperText="Portrait to keep pose and framing"
              preview={personPreview}
              onFileChange={handlePersonFile}
              onClear={() => setPersonFile(null)}
            />
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
          </div>
        </section>

        {/* Refine instruction (optional) - compact, top-of-flow */}
        <div className="w-full rounded-2xl border border-white/[0.06] bg-[#111111] p-3.5 sm:p-4">
          <label className="mb-2 block text-sm font-semibold text-[#f5f0eb]">
            Refinement (optional)
          </label>
          <textarea
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            placeholder="Keep pose, preserve face, match light"
            rows={2}
            className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#0d0d0d] px-3.5 py-2.5 text-sm text-[#f5f0eb] outline-none focus:border-white/20 focus:ring-2 focus:ring-[#c9a96e]/30"
          />
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          disabled={!personFile || !garmentFile}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9a96e] px-6 py-3.5 text-sm font-bold text-[#0a0a0a] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next — Choose Look
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    {/* Step 2 Panel */}
    <div className="w-full shrink-0">
      <div className="w-full rounded-2xl border border-white/[0.06] bg-[#111111] p-4">

          {/* Look picker (focused step, still same page) */}
          <section
            ref={lookPickerSectionRef}
            className="w-full"
          >
          <div className="mb-3 flex flex-col gap-1 sm:mb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 text-left text-sm font-semibold text-[#f5f0eb] sm:text-left">
                Choose a look{" "}
                <span className="font-medium text-[#666]">
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
                  className="text-xs font-semibold text-[#666] underline-offset-2 hover:text-[#aaa] hover:underline disabled:opacity-60"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="text-xs leading-relaxed text-[#666]">
              Presets fill the garment slot. Upload your own anytime.
            </div>
          </div>

          {/* Audience */}
          <div className="mb-3 sm:mb-4">
            <label className="mb-2 block text-xs font-semibold tracking-wide text-[#666] uppercase">
              For
            </label>
            <div className="inline-flex w-full rounded-full border border-white/[0.06] bg-[#111] p-1 sm:w-auto">
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
                    ? "min-h-11 flex-1 rounded-full bg-[#c9a96e] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] sm:flex-none sm:py-2"
                    : "min-h-11 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-[#666] hover:text-[#aaa] disabled:opacity-60 sm:flex-none sm:py-2"
                }
              >
                Women
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
                    ? "min-h-11 flex-1 rounded-full bg-[#c9a96e] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] sm:flex-none sm:py-2"
                    : "min-h-11 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-[#666] hover:text-[#aaa] disabled:opacity-60 sm:flex-none sm:py-2"
                }
              >
                Men
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="mb-4 sm:mb-5">
            <label className="mb-2 block text-xs font-semibold tracking-wide text-[#666] uppercase">
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
                      ? "min-h-11 rounded-xl bg-[#c9a96e] px-2.5 py-2 text-xs font-semibold text-[#0a0a0a] sm:px-4 sm:py-2.5 sm:text-sm"
                      : "min-h-11 rounded-xl bg-[#141414] px-2.5 py-2 text-xs font-semibold text-[#666] border border-white/[0.06] hover:border-white/15 disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-sm"
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery */}
          {!isPresetGalleryOpen ? (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.06] bg-[#0d0d0d] px-3 py-3 text-xs text-[#666] ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
              <span className="min-w-0 font-semibold text-[#f5f0eb] sm:truncate">
                {selectedLookId ? (selectedPresetLook?.title ?? "Selected look") : "No preset"}
              </span>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsPresetGalleryOpen(true)}
                className="min-h-10 w-full shrink-0 rounded-lg bg-[#1a1a1a] border border-white/[0.08] px-3 py-2 text-xs font-semibold text-[#888] hover:border-white/20 disabled:opacity-60 sm:w-auto sm:py-1.5"
              >
                Browse
              </button>
            </div>
          ) : presetLooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#141414] px-3 py-4 sm:px-4">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#444] uppercase">
                Empty folder
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#666]">
                Add files to
                <span className="font-semibold text-[#f5f0eb]">
                  {" "}
                  public/looks/{audience}/{category.toLowerCase().replaceAll(" ", "")}/
                </span>
                . They show up here.
              </p>
            </div>
          ) : (
            <div
              key={`${audience}-${category}`}
              className="animate-fade-in grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"
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
                        ? "group relative overflow-hidden rounded-2xl border border-[#c9a96e]/50 bg-[#111111] ring-1 ring-[#c9a96e]/20"
                        : "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111] hover:border-white/20"
                    }
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#141414]">
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
                      <div className="text-left text-xs font-medium leading-4 text-[#f5f0eb]">
                        {look.title}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#0a0a0a]/95 px-2 py-1 text-[10px] font-semibold text-[#f5f0eb]">
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
            </div>
          )}
        </section>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="bg-[#1a1a1a] border border-white/[0.08] text-[#888] rounded-xl px-5 py-3 text-sm font-semibold flex-1"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            disabled={!garmentFile}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c9a96e] px-6 py-3.5 text-sm font-bold text-[#0a0a0a] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next — Review
          </button>
        </div>
      </div>
    </div>

    {/* Step 3 Panel */}
    <div className="w-full shrink-0">
      <div className="w-full rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="self-start mb-4 text-xs text-[#666] hover:text-[#aaa] underline-offset-2 hover:underline"
        >
          ← Back
        </button>

        {/* Action */}
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
          {/* Pre-generation review (lightweight clarity) */}
          <div className="w-full">
            <div className="mb-2 text-xs font-semibold tracking-wide text-[#444] uppercase">
              Summary
            </div>
            <div
              className={
                personFile && garmentFile
                  ? "rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-4"
                  : "rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-4 ring-1 ring-white/10"
              }
            >
              {!(personFile && garmentFile) && (
                <div className="mb-3 rounded-xl border border-white/[0.06] bg-[#0d0d0d] px-3 py-2.5 text-xs leading-relaxed text-[#666]">
                  <span className="font-semibold text-[#f5f0eb]">Required:</span>{" "}
                  {!personFile && !garmentFile && (
                    <span>Person photo and garment in Step 1.</span>
                  )}
                  {!personFile && garmentFile && <span>Person photo in Step 1.</span>}
                  {personFile && !garmentFile && <span>Garment or preset.</span>}
                </div>
              )}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium tracking-wide text-[#666] uppercase">Audience</span>
                  <span className="font-semibold text-[#f5f0eb]">
                    {audience === "women" ? "Women" : "Men"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium tracking-wide text-[#666] uppercase">Category</span>
                  <span className="font-semibold text-[#f5f0eb]">{category}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                  <span className="text-xs font-medium tracking-wide text-[#666] uppercase">Target Person</span>
                  <span
                    className={
                      personFile
                        ? "rounded-full bg-[#c9a96e]/10 px-2.5 py-1 text-xs font-semibold text-[#c9a96e] ring-1 ring-[#c9a96e]/20"
                        : "rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#555] ring-1 ring-white/[0.06]"
                    }
                  >
                    {personFile ? "Ready" : "Missing"}
                  </span>
                </div>
                {personFile && (
                  <div className="text-xs text-[#666]">{personFile.name}</div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium tracking-wide text-[#666] uppercase">
                    Clothing Reference
                  </span>
                  <span
                    className={
                      garmentFile
                        ? "rounded-full bg-[#c9a96e]/10 px-2.5 py-1 text-xs font-semibold text-[#c9a96e] ring-1 ring-[#c9a96e]/20"
                        : "rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[#555] ring-1 ring-white/[0.06]"
                    }
                  >
                    {garmentFile ? "Ready" : "Missing"}
                  </span>
                </div>
                {garmentFile && (
                  <div className="text-xs text-[#666]">
                    {selectedPresetLook?.title ?? garmentFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {garmentPreview && (
            <div className="w-full">
              <div className="mb-2 text-xs font-semibold text-[#f5f0eb]/70">
                Look
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:p-3.5">
                <div className="flex min-w-0 items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={garmentPreview}
                    alt="Garment preview"
                    className="h-16 w-16 rounded-lg border border-white/[0.06] bg-[#111111] object-contain"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#f5f0eb]">
                      {selectedPresetLook?.title ?? "Custom upload"}
                    </div>
                    <div className="mt-0.5 text-xs text-[#666]">
                      Garment for this run
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={clearGarmentReference}
                  className="min-h-10 w-full shrink-0 rounded-md border border-white/[0.08] bg-[#1a1a1a] px-2.5 py-2 text-xs font-semibold text-[#888] hover:border-white/20 hover:text-[#aaa] disabled:opacity-60 sm:w-auto sm:py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:min-w-[26rem]">
            <div className="flex w-full min-w-0 flex-col gap-2">
              <label className="text-sm font-semibold text-[#f5f0eb]">Model</label>
              <div className="relative w-full min-w-0">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
                  disabled={isSubmitting}
                  className="min-h-11 w-full min-w-0 appearance-none rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 pr-10 text-sm font-medium text-[#f5f0eb] outline-none focus:ring-2 focus:ring-[#c9a96e]/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#666]">
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
              className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#c9a96e] px-5 py-3.5 text-sm font-bold text-[#0a0a0a] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:px-6"
            >
              {isSubmitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a]" />
              )}
              {isSubmitting ? "Generating…" : selected.buttonLabel}
            </button>
            {!isSubmitting && (!personFile || !garmentFile) && (
              <p className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] px-3 py-2.5 text-center text-xs leading-relaxed text-[#666] ring-1 ring-white/10">
                {!personFile && !garmentFile
                  ? "Add both uploads in Step 1 to continue."
                  : !personFile
                    ? "Add a person photo in Step 1."
                    : "Add a garment or choose a preset."}
              </p>
            )}
            {isSubmitting && (
              <div className="w-full rounded-2xl border border-white/[0.06] bg-[#0d0d0d] px-3 py-2.5 text-center ring-1 ring-white/10">
                <p className="text-xs font-medium text-[#f5f0eb]">Processing…</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#666]">
                  May take a moment.
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-[#666]">Vesti · AI-powered virtual try-on</p>
          </form>
        </section>

        {/* Status + Result */}
        <div ref={resultSectionRef} className="w-full">
          {apiError && (
            <div className="rounded-2xl border border-red-500/20 bg-[#111] px-3 py-3.5 text-sm text-red-300/80 sm:px-4">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-[#888] ring-1 ring-white/10"
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
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-red-300/80 uppercase">
                    Could not generate
                  </div>
                  <div className="mt-1.5 text-sm leading-relaxed text-red-300/80">
                    {apiError.error.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {apiSuccess && (
            <div className="rounded-3xl border border-[#c9a96e]/25 bg-[#111] p-4 text-sm sm:p-5 md:p-6">
              <div className="text-sm font-semibold leading-snug tracking-tight text-[#f5f0eb]">
                {apiSuccess.message}
              </div>
              <div className="mt-5 sm:mt-6">
                <div className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#c9a96e]/90 uppercase sm:mb-3">
                  Result
                </div>
                <div className="overflow-hidden rounded-xl bg-[#0a0a0a] ring-1 ring-white/10">
                  <div className="bg-[#0a0a0a] p-2 sm:p-2.5 md:p-3.5">
                    <button
                      type="button"
                      onClick={() => setIsResultPreviewOpen(true)}
                      className="relative w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/30"
                      aria-label="View full size"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={apiSuccess.image.value}
                        alt="Swap result"
                        className="max-h-[min(65vh,32rem)] w-full rounded-xl bg-[#0a0a0a] object-contain ring-1 ring-white/10 sm:max-h-[70vh]"
                      />
                    </button>
                  </div>
                  <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] bg-[#0d0d0d] px-3 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5 sm:px-4 sm:py-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPresetGalleryOpen(true);
                        // Scroll back to the look picker for user confidence.
                        lookPickerSectionRef.current?.scrollIntoView({
                          behavior: "auto",
                          block: "start",
                        });
                      }}
                      disabled={isSubmitting}
                      className="min-h-11 w-full shrink-0 rounded-lg bg-transparent border border-white/15 px-3.5 py-2.5 text-xs font-semibold text-[#aaa] hover:border-white/30 disabled:opacity-60 sm:w-auto sm:py-2"
                    >
                      Change look
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownloadResult()}
                      className="min-h-11 w-full shrink-0 rounded-lg bg-[#c9a96e] px-3.5 py-2.5 text-xs font-bold text-[#0a0a0a] hover:brightness-110 sm:w-auto sm:py-2"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  </div>

      </main>

      {isResultPreviewOpen && apiSuccess?.image && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]/85 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Full-size result"
          onClick={() => setIsResultPreviewOpen(false)}
        >
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 p-2.5 text-white shadow-lg backdrop-blur-md hover:bg-white/20 sm:right-4 sm:top-4"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
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
              src={apiSuccess.image.value}
              alt="Swap result, full size"
              className="max-h-[92vh] w-auto max-w-full rounded-xl object-contain shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
