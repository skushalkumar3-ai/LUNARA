import type { ElementType } from "react";

import {
  Activity,
  BatteryCharging,
  Droplets,
  Globe2,
  Shield,
  Signal,
  Wind,
  Leaf,
} from "lucide-react";

import LunarBase from "./scenes/LunarBase";

function ResourceCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  barColor,
}: {
  icon: ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
  barColor: string;
}) {
  return (
    <div className="bg-[#101722]/90 border border-white/10 rounded-xl p-3 min-w-0 backdrop-blur-md">
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <Icon size={15} className={color} />
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">
        {value}
        <span className="text-xs text-gray-400 ml-1">{unit}</span>
      </div>

      <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full w-3/4 rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#03050a] text-white">

      {/* 3D Environment */}
      <LunarBase />

      {/* Top Navigation */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">

        <div>
          <h1 className="text-2xl font-bold tracking-[0.3em]">
            LUNARA
          </h1>
          <p className="text-[9px] tracking-[0.25em] text-cyan-400">
            LUNAR RESEARCH OUTPOST
          </p>
        </div>

        <div className="hidden md:flex items-center gap-5 text-xs text-gray-300">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            SYSTEM ONLINE
          </span>

          <span>MISSION DAY 001</span>

          <span className="flex items-center gap-2">
            <Signal size={14} className="text-cyan-400" />
            EARTH LINK
          </span>
        </div>

      </header>

      {/* Left Resource Panel */}
      <aside className="absolute z-10 top-24 left-5 w-64 max-w-[45vw] space-y-3">

        <div className="bg-[#0b111b]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs tracking-widest">
            <Activity size={15} />
            OUTPOST STATUS
          </div>

          <h2 className="text-lg font-semibold mt-2">
            Lunar Base Alpha
          </h2>

          <p className="text-gray-500 text-xs mt-1">
            Artemis Research Sector
          </p>
        </div>

        <ResourceCard
          icon={Wind}
          label="OXYGEN"
          value="82"
          unit="%"
          color="text-cyan-400"
          barColor="bg-cyan-400"
        />

        <ResourceCard
          icon={Droplets}
          label="WATER"
          value="76"
          unit="%"
          color="text-blue-400"
          barColor="bg-blue-400"
        />

        <ResourceCard
          icon={BatteryCharging}
          label="POWER"
          value="91"
          unit="%"
          color="text-yellow-400"
          barColor="bg-yellow-400"
        />

        <ResourceCard
          icon={Leaf}
          label="FOOD"
          value="68"
          unit="%"
          color="text-green-400"
          barColor="bg-green-400"
        />

        <ResourceCard
          icon={Shield}
          label="RADIATION SAFETY"
          value="95"
          unit="%"
          color="text-purple-400"
          barColor="bg-purple-400"
        />

      </aside>

      {/* Bottom Mission Information */}
      <footer className="absolute z-10 bottom-5 left-5 right-5 flex justify-between items-end pointer-events-none">

        <div className="bg-[#0b111b]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 max-w-sm">
          <div className="text-cyan-400 text-[10px] tracking-widest">
            CURRENT MISSION
          </div>
z
          <h3 className="text-sm font-semibold mt-2">
            Establish Lunar Outpost
          </h3>

          <p className="text-xs text-gray-400 mt-1">
            Prepare habitat systems and maintain crew survival resources.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-400">
          <Globe2 size={15} className="text-cyan-400" />
          LUNAR ENVIRONMENT SIMULATION
        </div>

      </footer>

    </main>
  );
}

export default App;
