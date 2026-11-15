import { ArrowUpRight, Radio, ShieldCheck } from "lucide-react";
import { CREW_ROSTER } from "../scenes/crewRoster";

interface Props {
  visible: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export default function WelcomeScreen({ visible, onStart, onSkip }: Props) {
  return (
    <section
      data-screen-obstacle="true"
      aria-hidden={!visible}
      className={`absolute inset-0 z-30 overflow-hidden transition-opacity duration-700 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#07111e]/95 via-[#07111e]/64 to-[#07111e]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07111e]/70 via-transparent to-[#07111e]/45" />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/[0.08] px-6 py-5 sm:px-10 lg:px-14">
        <div>
          <div className="text-xl font-semibold tracking-[0.32em] text-white sm:text-2xl">
            LUNARA
          </div>
          <div className="mt-1 text-[9px] tracking-[0.28em] text-cyan-200/75">
            LUNAR RESEARCH OUTPOST
          </div>
        </div>
        <div className="hidden items-center gap-6 text-[9px] tracking-[0.18em] text-slate-300/75 sm:flex">
          <span>MISSION 04 / SHACKLETON RIM</span>
          <span className="flex items-center gap-2 text-cyan-100">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
            SYSTEMS NOMINAL
          </span>
        </div>
      </header>

      <div className="relative flex h-full items-center px-6 pb-8 pt-24 sm:px-10 lg:px-14">
        <div className="max-w-2xl">
          <div className="mb-6 flex items-center gap-3 text-[10px] tracking-[0.25em] text-cyan-200/80">
            <span className="h-px w-9 bg-cyan-300/70" />
            FIELD BRIEFING / 01
          </div>
          <h1 className="max-w-xl text-4xl font-light leading-[1.12] tracking-[0.08em] text-white sm:text-5xl lg:text-6xl">
            WELCOME TO
            <span className="mt-2 block font-semibold tracking-[0.14em]">
              LUNARA
            </span>
          </h1>
          <div className="mt-6 max-w-xl border-l border-cyan-200/35 pl-4">
            <p className="text-[9px] tracking-[0.18em] text-cyan-200">JUNIOR ASTRONAUT MISSION TRAINER</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-300 sm:text-base">Tour the lunar research outpost, identify its critical systems, and coordinate the crew through mission events.</p>
          </div>
          <div className="mt-6 grid max-w-xl grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">
            {CREW_ROSTER.map((member) => <div key={member.id} className="border-t border-white/10 pt-2"><strong className="block text-[9px] tracking-wide text-white">{member.name.toUpperCase()}</strong><span className="mt-1 block text-[7px] tracking-[0.12em] text-cyan-200">{member.role.toUpperCase()}</span></div>)}
          </div>

          <button
            type="button"
            onClick={onStart}
            tabIndex={visible ? 0 : -1}
            className="group mt-10 inline-flex items-center gap-4 border border-cyan-200/50 bg-cyan-300/10 px-6 py-4 text-[11px] font-semibold tracking-[0.2em] text-cyan-50 shadow-[0_0_34px_rgba(34,211,238,0.12)] backdrop-blur-md transition duration-300 hover:border-cyan-100 hover:bg-cyan-200/20 hover:shadow-[0_0_42px_rgba(34,211,238,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200"
          >
            BEGIN CINEMATIC ORIENTATION
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
          <button type="button" onClick={onSkip} tabIndex={visible ? 0 : -1} className="ml-4 mt-10 border border-white/20 px-5 py-4 text-[10px] tracking-[0.18em] text-slate-300 transition hover:border-cyan-100/50 hover:text-white">SKIP INTRO</button>

          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-[9px] tracking-[0.16em] text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-cyan-200/80" />
              OUTPOST SYSTEMS ONLINE
            </span>
            <span className="flex items-center gap-2">
              <Radio size={14} className="text-cyan-200/80" />
              EARTH LINK STANDBY
            </span>
            <span>MISSION DAY 001</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-7 right-8 hidden text-right text-[9px] tracking-[0.2em] text-slate-400/75 md:block">
        <div>SHACKLETON RIM</div>
        <div className="mt-1 text-cyan-100/70">LUNAR SOUTH POLE · SITE 04</div>
      </div>
    </section>
  );
}
