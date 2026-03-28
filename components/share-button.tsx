"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import {
  Share2,
  Twitter,
  Linkedin,
  Copy,
  Instagram,
  Music2,
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
  const { toast } = useToast()

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Copied to clipboard",
        description: "Share the link on Instagram, TikTok, or anywhere else!",
        duration: 2000,
      })
      setIsOpen(false)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const shareTwitter = () => {
    const tweetText = encodeURIComponent(
      `${title}\n\n${description ? description + "\n\n" : ""}Check out this post on Infinity Wanderlust Travels!\n\n${url}`
    )
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}`,
      "_blank",
      "width=550,height=420"
    )
    setIsOpen(false)
  }

  const shareLinkedIn = () => {
    const linkedInUrl = new URL("https://www.linkedin.com/sharing/share-offsite/")
    linkedInUrl.searchParams.append("url", url)
    window.open(linkedInUrl.toString(), "_blank", "width=550,height=420")
    setIsOpen(false)
  }

  const shareInstagram = () => {
    handleCopyToClipboard()
    toast({
      title: "Ready to share on Instagram!",
      description: "The link is copied. Open Instagram and paste it in your Story or Post.",
    })
  }

  const shareTikTok = () => {
    handleCopyToClipboard()
    toast({
      title: "Ready to share on TikTok!",
      description: "The link is copied. Add it to your TikTok video or share in captions.",
    })
  }

  const shareOptions = [
    {
      label: "Twitter",
      icon: Twitter,
      onClick: shareTwitter,
      color: "text-sky-500",
      bgColor: "hover:bg-sky-50 dark:hover:bg-sky-950",
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      onClick: shareLinkedIn,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-950",
    },
    {
      label: "Instagram",
      icon: Instagram,
      onClick: shareInstagram,
      color: "text-pink-500",
      bgColor: "hover:bg-pink-50 dark:hover:bg-pink-950",
    },
    {
      label: "TikTok",
      icon: Music2,
      onClick: shareTikTok,
      color: "text-neutral-900 dark:text-neutral-100",
      bgColor: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
    },
    {
      label: "Copy Link",
      icon: Copy,
      onClick: handleCopyToClipboard,
      color: "text-neutral-600 dark:text-neutral-400",
      bgColor: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
    },
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${className}`}
          title="Share this content"
        >
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Share this post</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {shareOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={option.onClick}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${option.bgColor}`}
                  title={option.label}
                >
                  <Icon className={`h-5 w-5 ${option.color}`} />
                  <span className="text-xs mt-1 text-center font-medium">
                    {option.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
          <div className="pt-2 mt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Share this amazing travel story with your friends!
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
