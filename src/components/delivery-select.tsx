"use client";

import { DELIVERY_OPTIONS } from "@/lib/constants";

interface DeliverySelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function DeliverySelect({ selected, onChange }: DeliverySelectProps) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">Способы доставки</label>
      <div className="grid grid-cols-3 gap-2">
        {DELIVERY_OPTIONS.map((option) => {
          const isActive = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                isActive
                  ? `border-current ${option.textColor} ${option.bgLight}`
                  : "border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500"
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="text-xs font-medium">{option.name}</span>
              {isActive ? (
                <div className={`absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full ${option.color}`}>
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-neutral-400">Выберите, какими службами можете отправить</p>
    </div>
  );
}
