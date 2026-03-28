"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export const PASSWORD_RULES = [
  { id: "length",    label: "At least 8 characters",    test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "number",    label: "One number (0–9)",           test: (p: string) => /[0-9]/.test(p) },
  { id: "special",   label: "One special character (!@#…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

/** Returns true only when every rule passes */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password))
}

const STRENGTH_LABELS = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"]
const STRENGTH_COLORS = [
  "",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
]

interface PasswordStrengthProps {
  /** The password being typed */
  password: string
  /** Optional confirm value — shows a match/mismatch row when provided */
  confirmPassword?: string
  /** Extra class for the wrapping div */
  className?: string
}

/**
 * Renders a 5-segment strength bar + per-rule checklist.
 * Optionally checks whether password === confirmPassword.
 * Only shown when `password` is non-empty.
 */
export function PasswordStrength({ password, confirmPassword, className }: PasswordStrengthProps) {
  if (!password) return null

  const score = PASSWORD_RULES.filter((r) => r.test(password)).length
  const showMatch = confirmPassword !== undefined

  return (
    <div className={cn("space-y-2 mt-2", className)}>
      {/* Strength bar */}
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              score >= level ? STRENGTH_COLORS[score] : "bg-muted"
            )}
          />
        ))}
        <span className={cn("text-xs font-medium ml-1 w-20 shrink-0", score < 3 ? "text-muted-foreground" : score < 5 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400")}>
          {STRENGTH_LABELS[score]}
        </span>
      </div>

      {/* Per-rule checklist */}
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const passes = rule.test(password)
          return (
            <li key={rule.id} className="flex items-center gap-1.5 text-xs">
              {passes
                ? <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                : <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              <span className={passes ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                {rule.label}
              </span>
            </li>
          )
        })}

        {/* Match row */}
        {showMatch && (
          <li className="flex items-center gap-1.5 text-xs">
            {confirmPassword && password === confirmPassword
              ? <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              : <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className={
              confirmPassword && password === confirmPassword
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }>
              Passwords match
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}
