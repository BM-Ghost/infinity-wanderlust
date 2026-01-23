"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function PasswordResetSuccess() {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Trigger animations on mount
    setIsVisible(true)
    setTimeout(() => setShowConfetti(true), 600)
  }, [])

  // Simple confetti effect
  const confettiPieces = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 1,
    x: Math.random() * 100 - 50,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="forest-bg min-h-screen flex items-center justify-center p-4">
      {/* Confetti pieces */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                y: -100,
                x: piece.x,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                y: typeof window !== "undefined" ? window.innerHeight + 100 : 500,
                x: piece.x + (Math.random() * 40 - 20),
                opacity: 0,
                rotate: piece.rotation,
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: "easeIn",
              }}
              className="fixed w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              style={{
                left: `calc(50% + ${piece.x}px)`,
                top: "-10px",
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-8">
              {/* Animated success icon */}
              <motion.div
                className="flex justify-center mb-6"
                animate={isVisible ? { scale: 1 } : { scale: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                }}
              >
                <motion.div
                  animate={isVisible ? { rotate: [0, 360] } : {}}
                  transition={{
                    duration: 0.8,
                    delay: 0.3,
                    ease: "easeOut",
                  }}
                >
                  <div className="relative">
                    {/* Outer glow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-green-400 blur-xl opacity-30"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                    {/* Icon */}
                    <CheckCircle className="w-20 h-20 text-green-500 relative z-10" strokeWidth={1.5} />
                  </div>
                </motion.div>
              </motion.div>

              {/* Main heading */}
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                  Password Reset Successful!
                </h1>
                <p className="text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Your password has been updated securely
                </p>
              </motion.div>

              {/* Subtext */}
              <motion.p
                className="text-center text-sm text-green-600 dark:text-green-400 mb-8"
                initial={{ opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                You can now log in with your new password. Your account is secure and ready to use.
              </motion.p>

              {/* Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => {
                      try {
                        localStorage.removeItem("pocketbase_auth")
                      } catch {}
                      router.push("/login?secure=1")
                    }}
                  >
                    Sign out everywhere
                  </Button>
                  <Link href="/login?secure=1">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold group"
                    >
                      Go to Login
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Back link */}
        <motion.p
          className="text-center mt-6 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Didn't reset your password?{" "}
          <Link href="/forgot-password" className="text-primary hover:underline font-medium">
            Try again
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
