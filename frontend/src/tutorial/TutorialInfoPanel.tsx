import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ChevronDown } from "lucide-react";

import type { TutorialStep } from "../scenes/TutorialConfiguration";

interface Props {
  step: TutorialStep;
  index: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
}

export default function TutorialInfoPanel({
  step,
  index,
  total,
  onBack,
  onNext,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section data-screen-obstacle="true" className="tutorial-info-card" aria-label="Outpost orientation">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[8px] font-medium tracking-[0.19em] text-cyan-200/80">
          {step.category}
        </div>
        <div className="shrink-0 font-mono text-[9px] tracking-[0.1em] text-slate-400">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <h2 className="min-w-0 text-[13px] font-semibold tracking-[0.06em] text-white">
          {step.title}
        </h2>
        <button
          type="button"
          className="tutorial-info-card__expand"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse details" : "Expand details"}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronDown
            size={14}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      <p className="mt-1 truncate text-[10px] leading-4 text-slate-300">
        {step.description}
      </p>
      {expanded && (
        <p className="mt-2 border-l border-cyan-300/45 pl-2.5 text-[10px] leading-4 text-cyan-50/80">
          {step.purpose}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 py-1 text-[9px] tracking-[0.13em] text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft size={12} />
          BACK
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 border border-cyan-200/35 bg-cyan-200/10 px-3 py-1.5 text-[9px] font-semibold tracking-[0.14em] text-cyan-50 transition hover:border-cyan-100 hover:bg-cyan-200/20"
        >
          NEXT
          <ArrowRight size={12} />
        </button>
      </div>
    </section>
  );
}
