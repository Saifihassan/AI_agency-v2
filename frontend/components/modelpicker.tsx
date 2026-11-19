"use client";

import { useProvider } from "./provider";

type Props = { module: string; compact?: boolean };

export function ModelPicker({ module }: Props) {
  const { ready, configured, models, modelFor, setModel } = useProvider();

  if (!ready || !configured || models.length === 0) return null;

  const current = modelFor(module);

  return (
    <label className="model-picker" title="Model used for this module — must support tool calling and structured output">
      <span className="model-picker-label">model</span>
      <select
        value={current}
        onChange={(e) => void setModel(module, e.target.value)}
      >
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </label>
  );
}
