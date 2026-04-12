import type { OutputConfig, OutputType } from "../types";
import { OUTPUT_TYPE_META, OUTPUT_OPTIONS, OPTION_FIELD_MAP } from "../types";

interface Props {
  selected: Map<OutputType, OutputConfig>;
  onChange: (selected: Map<OutputType, OutputConfig>) => void;
}

const ALL_TYPES = Object.keys(OUTPUT_TYPE_META) as OutputType[];

export default function OutputTypeSelector({ selected, onChange }: Props) {
  const toggle = (ot: OutputType) => {
    const next = new Map(selected);
    if (next.has(ot)) {
      next.delete(ot);
    } else {
      next.set(ot, { output_type: ot, language: "en" });
    }
    onChange(next);
  };

  const updateOption = (ot: OutputType, field: string, value: string) => {
    const next = new Map(selected);
    const cfg = { ...next.get(ot)!, [field]: value || undefined };
    next.set(ot, cfg);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Output Types</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {ALL_TYPES.map((ot) => {
          const meta = OUTPUT_TYPE_META[ot];
          const isSelected = selected.has(ot);
          return (
            <button
              key={ot}
              onClick={() => toggle(ot)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition text-sm
                ${isSelected
                  ? "border-blue-500 bg-blue-950/40 text-blue-300"
                  : "border-gray-700 hover:border-gray-500 text-gray-400"
                }`}
            >
              <span className="text-2xl">{meta.icon}</span>
              <span className="font-medium">{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Options for selected types */}
      {Array.from(selected.entries()).map(([ot, cfg]) => {
        const options = OUTPUT_OPTIONS[ot];
        const fieldMap = OPTION_FIELD_MAP[ot];
        if (!options && ot !== "cinematic_video") return null;

        return (
          <div key={ot} className="bg-gray-900 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">
              {OUTPUT_TYPE_META[ot].icon} {OUTPUT_TYPE_META[ot].label} options
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {options?.map((opt) => {
                const field = fieldMap?.[opt.label];
                if (!field) return null;
                return (
                  <div key={opt.label}>
                    <label className="text-xs text-gray-500 block mb-1">{opt.label}</label>
                    <select
                      value={(cfg as Record<string, string | undefined>)[field] || ""}
                      onChange={(e) => updateOption(ot, field, e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Default</option>
                      {opt.options.map((v) => (
                        <option key={v} value={v}>
                          {v.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Language</label>
                <input
                  type="text"
                  value={cfg.language}
                  onChange={(e) => updateOption(ot, "language", e.target.value)}
                  placeholder="en"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Instructions</label>
              <input
                type="text"
                value={cfg.instructions || ""}
                onChange={(e) => updateOption(ot, "instructions", e.target.value)}
                placeholder="Optional custom instructions..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
              />
            </div>
            {ot === "report" && cfg.report_format === "custom" && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Custom prompt</label>
                <textarea
                  value={cfg.custom_prompt || ""}
                  onChange={(e) => updateOption(ot, "custom_prompt", e.target.value)}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm resize-y"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
