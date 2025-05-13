"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { LanguageContext } from "@/lib/translations"

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [language, setLanguageState] = useState("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "en"
    setLanguageState(savedLanguage)
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const supportedLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "zh", name: "中文" },
  ]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  )
}
