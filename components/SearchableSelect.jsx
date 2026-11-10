"use client";

import { useState, useRef, useEffect } from "react";

/**
 * SearchableSelect Component
 * Accessible searchable dropdown with keyboard navigation and mobile support.
 * Styled for the dark cricket tournament theme.
 */
export default function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error,
  icon = "💼",
  hint,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Filter options based on user input
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option-item]");
      const currentItem = items[highlightedIndex];
      if (currentItem) {
        currentItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
      {/* Label */}
      <label
        htmlFor={name}
        className="flex items-center gap-2 text-sm font-medium cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          color: "rgba(232,245,233,0.7)",
          fontFamily: "var(--font-accent)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontSize: "11px",
        }}
      >
        {icon && <span className="text-base">{icon}</span>}
        {label}
        {required && <span style={{ color: "#f59e0b" }}>*</span>}
      </label>

      {/* Trigger Button */}
      <div
        id={name}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${name}-listbox`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between cursor-pointer select-none"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${
            error
              ? "rgba(239,68,68,0.5)"
              : isOpen
                ? "rgba(34,197,94,0.5)"
                : "rgba(255,255,255,0.1)"
          }`,
          boxShadow: isOpen
            ? "0 0 0 3px rgba(34,197,94,0.15)"
            : error
              ? "0 0 0 3px rgba(239,68,68,0.1)"
              : "none",
          color: value ? "var(--color-text)" : "rgba(255,255,255,0.35)",
          fontFamily: "var(--font-body)",
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-xs text-gray-400 hover:text-white px-1 cursor-pointer"
              title="Clear selection"
            >
              ✕
            </span>
          )}
          <span
            className="text-xs transition-transform duration-200"
            style={{
              color: "rgba(232,245,233,0.5)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className="relative w-full mt-1.5 rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
          style={{
            background: "rgba(10, 24, 44)",
            border: "1px solid rgba(0, 170, 255, 0.3)",
            boxShadow:
              "0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,170,255,0.15)",
          }}
        >
          {/* Search Input Box */}
          <div
            className="p-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span className="text-xs text-gray-400">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type to search profession..."
                className="w-full bg-transparent text-sm outline-none text-white placeholder-gray-400"
                style={{ fontFamily: "var(--font-body)" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            id={`${name}-listbox`}
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto bg-black p-1.5 flex flex-col gap-1 custom-scrollbar"
            style={{ scrollbarWidth: "thin" }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-gray-400">
                No matching professions found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = value === opt;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <div
                    key={opt}
                    data-option-item="true"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className="px-3.5 py-2.5 rounded-xl text-sm cursor-pointer flex items-center justify-between transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(34,197,94,1)"
                        : isHighlighted
                          ? "rgba(255,255,255,0.08)"
                          : "transparent",
                      color: isSelected ? "#4ade80" : "#f1f5f9",
                      fontWeight: isSelected ? 600 : 400,
                      border: isSelected
                        ? "1px solid rgba(34,197,94,0.3)"
                        : isHighlighted
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "1px solid transparent",
                    }}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <span className="text-xs font-bold text-green-400 ml-2">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Hint */}
      {hint && !error && (
        <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
          {hint}
        </p>
      )}

      {/* Error */}
      {error && (
        <p
          className="text-xs flex items-center gap-1 animate-fade-in"
          style={{ color: "#f87171" }}
        >
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
