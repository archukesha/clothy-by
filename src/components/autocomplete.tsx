"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export interface AutocompleteOption {
  value: string;
  label: string;
  swatch?: string;
  hint?: string;
}

interface AutocompleteProps {
  name: string;
  label: string;
  help?: string;
  options: AutocompleteOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  allowCustom?: boolean;
  selectOnly?: boolean;
  onChange?: (value: string) => void;
}

export function Autocomplete({
  name,
  label,
  help,
  options,
  defaultValue = "",
  placeholder = "",
  required,
  allowCustom = false,
  selectOnly = false,
  onChange,
}: AutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const initialLabel = useMemo(() => {
    const option = options.find((item) => item.value === defaultValue);
    return option?.label ?? (allowCustom ? defaultValue : "");
  }, [allowCustom, defaultValue, options]);

  const [query, setQuery] = useState(initialLabel);
  const [committed, setCommitted] = useState(
    allowCustom ? defaultValue : options.find((item) => item.value === defaultValue)?.value ?? ""
  );
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [panelMetrics, setPanelMetrics] = useState({ upward: false, maxHeight: 288 });

  useEffect(() => {
    if (defaultValue && !committed) {
      const option = options.find((item) => item.value === defaultValue);
      if (option) {
        setQuery(option.label);
        setCommitted(option.value);
      }
    }
  }, [committed, defaultValue, options]);

  const filtered = useMemo(() => {
    const preparedQuery = query.trim().toLowerCase();
    if (!preparedQuery) return options.slice(0, 50);

    const starts: AutocompleteOption[] = [];
    const contains: AutocompleteOption[] = [];

    for (const option of options) {
      const labelValue = option.label.toLowerCase();
      if (labelValue.startsWith(preparedQuery)) starts.push(option);
      else if (labelValue.includes(preparedQuery)) contains.push(option);
    }

    return [...starts, ...contains].slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    function measure() {
      const el = inputRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const upward = spaceBelow < 180 && spaceAbove > spaceBelow;

      setPanelMetrics({
        upward,
        maxHeight: Math.max(140, Math.min(288, upward ? spaceAbove : spaceBelow)),
      });
    }

    measure();
    const timeout = setTimeout(measure, 250);
    window.visualViewport?.addEventListener("resize", measure);
    window.addEventListener("resize", measure);

    return () => {
      clearTimeout(timeout);
      window.visualViewport?.removeEventListener("resize", measure);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (!allowCustom) {
          const option = options.find((item) => item.value === committed);
          setQuery(option?.label ?? "");
        }
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [allowCustom, committed, options]);

  function selectOption(option: AutocompleteOption) {
    setQuery(option.label);
    setCommitted(option.value);
    setOpen(false);
    onChange?.(option.value);
  }

  function clear() {
    setQuery("");
    setCommitted("");
    setOpen(false);
    onChange?.("");
    inputRef.current?.focus();
  }

  function handleKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.min(filtered.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter") {
      if (open && filtered[highlight]) {
        event.preventDefault();
        selectOption(filtered[highlight]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function handleInput(value: string) {
    setQuery(value);
    setHighlight(0);
    setOpen(true);

    if (allowCustom) {
      setCommitted(value);
      onChange?.(value);
    } else if (committed) {
      setCommitted("");
      onChange?.("");
    }
  }

  function renderLabel(value: string) {
    const preparedQuery = query.trim();
    if (!preparedQuery) return value;

    const index = value.toLowerCase().indexOf(preparedQuery.toLowerCase());
    if (index < 0) return value;

    return (
      <>
        {value.slice(0, index)}
        <span className="bg-yellow-100 font-medium text-neutral-900">
          {value.slice(index, index + preparedQuery.length)}
        </span>
        {value.slice(index + preparedQuery.length)}
      </>
    );
  }

  const selectedOption = options.find((item) => item.value === committed);

  return (
    <div className="space-y-1.5" ref={wrapRef}>
      <label htmlFor={`${name}-input`} className="block text-sm font-medium text-neutral-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>

      <div className="relative">
        {selectedOption?.swatch ? (
          <span
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-neutral-200"
            style={{ background: selectedOption.swatch }}
            aria-hidden
          />
        ) : null}

        <input
          ref={inputRef}
          id={`${name}-input`}
          type="text"
          value={query}
          onChange={(event) => handleInput(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          readOnly={selectOnly}
          autoComplete="off"
          className={`w-full rounded-xl border border-neutral-200 py-2.5 pr-16 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black ${
            selectedOption?.swatch ? "pl-10" : "pl-4"
          } ${selectOnly ? "cursor-pointer caret-transparent" : ""}`}
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {query ? (
            <button
              type="button"
              onClick={clear}
              className="p-1.5 text-neutral-300 transition-colors hover:text-neutral-600"
              aria-label="Очистить"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setOpen((current) => !current);
              inputRef.current?.focus();
            }}
            className="p-1.5 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label="Открыть список"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>

        <input type="hidden" name={name} value={committed} required={required} />

        {open ? (
          <div
            className={`absolute left-0 right-0 z-30 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg ${
              panelMetrics.upward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
            style={{ maxHeight: panelMetrics.maxHeight }}
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-neutral-400">
                {allowCustom ? `Будет сохранено: "${query}"` : "Ничего не найдено"}
              </div>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === committed;
                const isHighlighted = index === highlight;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => selectOption(option)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                      isHighlighted ? "bg-neutral-50" : "bg-white"
                    }`}
                  >
                    {option.swatch ? (
                      <span
                        className="h-4 w-4 rounded-full border border-neutral-200"
                        style={{ background: option.swatch }}
                        aria-hidden
                      />
                    ) : null}
                    <span className="flex-1">
                      <span className="text-neutral-900">{renderLabel(option.label)}</span>
                      {option.hint ? (
                        <span className="ml-2 text-xs text-neutral-400">{option.hint}</span>
                      ) : null}
                    </span>
                    {isSelected ? <Check className="h-4 w-4 text-black" /> : null}
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      {help ? <p className="text-xs text-neutral-400">{help}</p> : null}
    </div>
  );
}
