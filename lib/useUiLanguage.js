"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeUiLanguage } from "@/lib/uiLanguage";

export const UI_LANGUAGE_CHANGE_EVENT = "majhi-ui-language-change";

function readDocumentLanguage() {
  if (typeof document === "undefined") {
    return "mr";
  }

  return normalizeUiLanguage(document.documentElement.dataset.language || document.documentElement.lang || "mr");
}

export function useUiLanguage() {
  const [language, setLanguage] = useState("mr");

  useEffect(() => {
    const updateLanguage = () => setLanguage(readDocumentLanguage());
    updateLanguage();

    const observer = new MutationObserver(updateLanguage);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-language", "lang"]
    });

    window.addEventListener(UI_LANGUAGE_CHANGE_EVENT, updateLanguage);

    return () => {
      observer.disconnect();
      window.removeEventListener(UI_LANGUAGE_CHANGE_EVENT, updateLanguage);
    };
  }, []);

  return language;
}

export function useUiTranslation() {
  const language = useUiLanguage();

  return useCallback((marathi, english) => (language === "en" ? english : marathi), [language]);
}
