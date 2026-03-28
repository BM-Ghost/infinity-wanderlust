"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { MapPin, Mail, Phone, Clock, Send, Loader2, Plane } from "lucide-react"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all fields before sending." })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/email/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Something went wrong")
      }

      toast({ title: "Message sent!", description: "Thank you for reaching out. We will get back to you shortly." })
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send failed", description: err?.message || "Could not send your message. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[url('/images/explore.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="relative z-10 container mx-auto px-4 py-14 md:py-20 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm mb-5">
            <Plane className="h-3.5 w-3.5" /> Get In Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg mb-4">
            Let&apos;s Start a Conversation
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Have questions, want to collaborate, or just want to say hello? I&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pt-6 pb-12 md:pt-8 md:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Send Me a Message
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the form below and I&apos;ll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Write your name here" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is this regarding?" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your thoughts, questions, or travel plans..." rows={6} required className="resize-none" />
                  </div>

                  <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" /> Send Message</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="shadow-md border-0 bg-primary/5 dark:bg-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Infinity Wanderlust Travels<br />
                  Nairobi CBD<br />
                  Kenya
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-primary/5 dark:bg-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href="mailto:infinitywanderlusttravels@gmail.com" className="text-sm text-primary font-medium hover:underline">
                  infinitywanderlusttravels@gmail.com
                </a>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-primary/5 dark:bg-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mon &ndash; Fri: 9 am &ndash; 5 pm<br />
                  Saturday: 10 am &ndash; 2 pm<br />
                  Sunday: Closed
                </p>
              </CardContent>
            </Card>

            {/* Map */}
            <div className="rounded-xl overflow-hidden shadow-md border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.277444357053!2d36.81992678715822!3d-1.2833562999999908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d0f3c0e1e7%3A0xdfdee749e3b4e18a!2sNairobi%20CBD%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1683900149525!5m2!1sen!2ske"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Nairobi location map"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
