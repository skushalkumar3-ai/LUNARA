import { type ElementType } from "react";
import { BatteryCharging, Droplets, Leaf, Shield, Wind } from "lucide-react";
import { useMissionStore, type ResourceLevels } from "../store/missionStore";

function ResourceBar({
  icon: Icon,
  label,
  value,
  color,
  barColor,
  delta,
}: {
  icon: ElementType;
  label: string;
  value: number;
  color: string;
  barColor: string;
  delta?: number;
}) {
  const isLow = value < 30;
  const isCritical = value < 15;

  return (
    <div className={`resource-bar ${isCritical ? "resource-bar--critical" : isLow ? "resource-bar--low" : ""}`}>
      <div className="resource-bar__header">
        <div className={`resource-bar__label ${color}`}>
          <Icon size={11} />
          <span>{label}</span>
        </div>
        <div className="resource-bar__value-row">
          {delta !== undefined && delta !== 0 && (
            <span className={`resource-bar__delta ${delta > 0 ? "resource-bar__delta--pos" : "resource-bar__delta--neg"}`}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
          <span className="resource-bar__value">{value}<span className="resource-bar__pct">%</span></span>
        </div>
      </div>
      <div className="resource-bar__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`resource-bar__fill ${barColor} transition-[width] duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

type ResourceConfig = {
  key: keyof ResourceLevels;
  icon: ElementType;
  label: string;
  color: string;
  barColor: string;
};

const RESOURCE_CONFIG: ResourceConfig[] = [
  { key: "oxygen",         icon: Wind,           label: "OXYGEN",          color: "text-cyan-400",   barColor: "bg-cyan-400"   },
  { key: "water",          icon: Droplets,        label: "WATER",           color: "text-blue-400",   barColor: "bg-blue-400"   },
  { key: "power",          icon: BatteryCharging, label: "POWER",           color: "text-yellow-400", barColor: "bg-yellow-400" },
  { key: "food",           icon: Leaf,            label: "FOOD",            color: "text-green-400",  barColor: "bg-green-400"  },
  { key: "radiationSafety",icon: Shield,          label: "RAD SAFETY",      color: "text-purple-400", barColor: "bg-purple-400" },
];

interface Props {
  showDeltas?: boolean;
}

export default function ResourceTelemetry({ showDeltas = false }: Props) {
  const resources = useMissionStore((s) => s.resources);
  const appliedDelta = useMissionStore((s) => s.appliedResourceDelta);

  return (
    <div className="resource-telemetry">
      <div className="resource-telemetry__title">RESOURCE TELEMETRY</div>
      <div className="resource-telemetry__grid">
        {RESOURCE_CONFIG.map(({ key, icon, label, color, barColor }) => (
          <ResourceBar
            key={key}
            icon={icon}
            label={label}
            value={resources[key]}
            color={color}
            barColor={barColor}
            delta={showDeltas && appliedDelta ? appliedDelta[key] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
