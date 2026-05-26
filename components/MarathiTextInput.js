"use client";

import { useMemo } from "react";
import {
  applyMarathiSuggestion,
  getMarathiSuggestions,
  transliterateMarathiText
} from "@/lib/marathiTransliteration";

const delimiterPattern = /[\s\n.,;:!?)]$/;

function shouldConvertDuringTyping(value, previousValue) {
  return value.length >= previousValue.length && delimiterPattern.test(value);
}

export default function MarathiTextInput({
  value,
  onValueChange,
  className,
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  autoComplete = "off",
  rows = 4,
  multiline = false,
  rightAdornment = null,
  showSuggestions = true,
  onBlur,
  ...props
}) {
  const currentValue = value || "";
  const suggestions = useMemo(
    () => (showSuggestions && !readOnly && !disabled ? getMarathiSuggestions(currentValue, 3) : []),
    [currentValue, disabled, readOnly, showSuggestions]
  );

  function emit(nextValue) {
    onValueChange?.(nextValue);
  }

  function handleChange(event) {
    const nextValue = event.target.value;
    emit(shouldConvertDuringTyping(nextValue, currentValue) ? transliterateMarathiText(nextValue) : nextValue);
  }

  function handleBlur(event) {
    const convertedValue = transliterateMarathiText(event.target.value);

    if (convertedValue !== currentValue) {
      emit(convertedValue);
    }

    onBlur?.(event);
  }

  function chooseSuggestion(suggestion) {
    emit(applyMarathiSuggestion(currentValue, suggestion));
  }

  const field = multiline ? (
    <textarea
      {...props}
      value={currentValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
      rows={rows}
      className={className}
    />
  ) : (
    <input
      {...props}
      type="text"
      value={currentValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
      autoComplete={autoComplete}
      className={className}
    />
  );

  return (
    <div className="w-full">
      {rightAdornment ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          {field}
          {rightAdornment}
        </div>
      ) : (
        field
      )}

      {suggestions.length > 0 ? (
        <div className="mt-2 flex min-h-[36px] flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseSuggestion(suggestion)}
              className="min-h-[34px] rounded-full border border-green-200 bg-green-50 px-3 text-[17px] font-extrabold text-sheti active:bg-green-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
