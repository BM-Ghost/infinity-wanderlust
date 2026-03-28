"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import {
  Share2,
  Twitter,
  Linkedin,
  Copy,
  Instagram,
  Music2,
  CheckCheck,
} from "lucide-react"

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  className?: string
}

export function ShareButton({
  url,
  title,
  description = "",
  className = "",
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setIsOpen(false)
      toast({
        title: "Link copied!",
        description: "Paste it anywhere — Instagram bio, TikTok caption, or a message.",
        duration: 2500,
      })
    } catch {
      toast({ title: "Failed to copy", description: "Please try again", variant: "destructive" })
    }
  }

  const shareTwitter = () => {
    const text = encodeURIComponent(`${title}\n\n${url}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "width=550,height=420")
    setIsOpen(false)
  }

  const shareLinkedIn = () => {
    const u = new URL("https://www.linkedin.com/sharing/share-offsite/")
    u.searchParams.append("url", url)
    window.open(u.toString(), "_blank", "width=550,height=420")
    setIsOpen(false)
  }

  const shareInstagram = async () => {
    await navigator.clipboard.writeText(url).catch(() => {})
    setIsOpen(false)
    toast({
      title: "Ready for Instagram!",
      description: "Link copied — paste it in your Story link or bio.",
      duration: 3000,
    })
  }

  const shareTikTok = async () => {
    await navigator.clipboard.writeText(url).catch(() => {})
    setIsOpen(false)
    toast({
      title: "Ready for TikTok!",
      description: "Link copied — paste it in your video caption or bio.",
      duration: 3000,
    })
  }

  const shareOptions = [
    {
      label: "Twitter / X",
      hint: "Post a tweet",
      icon: Twitter,
      onClick: shareTwitter,
      iconColor: "text-sky-500",
      hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-950/50",
      border: "border-sky-100 dark:border-sky-900/40",
    },
    {
      label: "LinkedIn",
      hint: "Share professionally",
      icon: Linkedin,
      onClick: shareLinkedIn,
      iconColor: "text-blue-600",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-950/50",
      border: "border-blue-100 dark:border-blue-900/40",
    },
    {
      label: "Instagram",
      hint: "Copy link for Story or bio",
      icon: Instagram,
      onClick: shareInstagram,
      iconColor: "text-pink-500",
      hoverBg: "hover:bg-pink-50 dark:hover:bg-pink-950/50",
      border: "border-pink-100 dark:border-pink-900/40",
    },
    {
      label: "TikTok",
      hint: "Copy link for caption or bio",
      icon: Music2,
      onClick: shareTikTok,
      iconColor: "text-foreground",
      hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
      border: "border-neutral-200 dark:border-neutral-700",
    },
    {
      label: "Copy link",
      hint: url.length > 36 ? url.substring(0, 36) + "…" : url,
      icon: copied ? CheckCheck : Copy,
      onClick: handleCopyToClipboard,
      iconColor: copied ? "text-green-500" : "text-muted-foreground",
      hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
      border: "border-neutral-200 dark:border-neutral-700",
    },
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${className}`}
          title="Share"
        >
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent side="top" align="end" className="w-72 p-0 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-muted/40">
          <p className="text-sm font-semibold">Share this post</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{title}</p>
        </div>

        {/* Options list */}
        <div className="py-1">
          {shareOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                onClick={option.onClick}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${option.hoverBg}`}
              >
                {/* Icon badge */}
                <span className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full border ${option.border} bg-background`}>
                  <Icon className={`h-4 w-4 ${option.iconColor}`} />
                </span>

                {/* Text */}
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-medium leading-none">{option.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 truncate">{option.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
