"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/lib/translations"
import { useToast } from "@/components/ui/use-toast"
import { AtSign, Lock, User, Mail, KeyRound, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const { t } = useTranslation()
  const { signIn, signUp, resetPassword, checkUserExists } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // Register form state
  const [registerUsername, setRegisterUsername] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [usernameExists, setUsernameExists] = useState(false)
  const [emailExists, setEmailExists] = useState(false)

  // Reset password state
  const [resetEmail, setResetEmail] = useState("")

  // Check username and email availability as user types
  useEffect(() => {
    const checkUsername = async () => {
      if (registerUsername.length >= 3) {
        const result = await checkUserExists(registerUsername, "")
        setUsernameExists(result.exists)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [registerUsername, checkUserExists])

  useEffect(() => {
    const checkEmail = async () => {
      if (registerEmail && registerEmail.includes("@") && registerEmail.includes(".")) {
        const result = await checkUserExists("", registerEmail)
        setEmailExists(result.exists)
      }
    }

    const timeoutId = setTimeout(checkEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [registerEmail, checkUserExists])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(loginEmail, loginPassword)
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password match
    if (registerPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      })
      return
    }

    // Validate password length
    if (registerPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      })
      return
    }

    // Validate username
    if (!registerUsername.trim()) {
      toast({
        variant: "destructive",
        title: "Username required",
        description: "Please enter a username.",
      })
      return
    }

    // Validate name
    if (!registerName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your name.",
      })
      return
    }

    // Check if username or email already exists
    if (usernameExists) {
      toast({
        variant: "destructive",
        title: "Username already taken",
        description: "Please choose a different username.",
      })
      return
    }

    if (emailExists) {
      toast({
        variant: "destructive",
        title: "Email already registered",
        description: "Please use a different email or sign in.",
      })
      return
    }

    setIsLoading(true)
    try {
      await signUp(registerUsername, registerEmail, registerPassword, confirmPassword, registerName)
    } catch (error) {
      console.error("Registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await resetPassword(resetEmail)
      // Reset form and go back to login
      setResetEmail("")
      setActiveTab("login")
    } catch (error) {
      console.error("Password reset error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <div className="auth-page-container py-16 md:py-24">
        <div className="max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="auth-tab">
                {t("signIn")}
              </TabsTrigger>
              <TabsTrigger value="register" className="auth-tab">
                {t("signUp")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="auth-card">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">{t("loginTitle")}</CardTitle>
                  <CardDescription className="text-center">{t("loginSubtitle")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="auth-label">
                        {t("email")}
                      </Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10 auth-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="auth-label">
                          {t("password")}
                        </Label>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm auth-link"
                          onClick={() => setActiveTab("reset")}
                          type="button"
                        >
                          {t("forgotPassword")}
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 auth-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="auth-checkbox"
                      />
                      <Label htmlFor="remember" className="text-sm font-normal">
                        {t("rememberMe")}
                      </Label>
                    </div>
                    <Button type="submit" className="w-full auth-button" disabled={isLoading}>
                      {isLoading ? t("loading") : t("signIn")}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    {t("dontHaveAccount")}{" "}
                    <Button variant="link" className="p-0 h-auto auth-link" onClick={() => setActiveTab("register")}>
                      {t("signUp")}
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="auth-card">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">{t("registerTitle")}</CardTitle>
                  <CardDescription className="text-center">{t("registerSubtitle")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="auth-label">
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="register-username"
                          type="text"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          className={`pl-10 auth-input ${usernameExists ? "border-red-500" : ""}`}
                          required
                        />
                        {usernameExists && (
                          <div className="flex items-center mt-1 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>Username already taken</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="auth-label">
                        {t("name")}
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="register-name"
                          type="text"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          className="pl-10 auth-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="auth-label">
                        {t("email")}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="name@example.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className={`pl-10 auth-input ${emailExists ? "border-red-500" : ""}`}
                          required
                        />
                        {emailExists && (
                          <div className="flex items-center mt-1 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>Email already registered</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="auth-label">
                        {t("password")}
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="register-password"
                          type="password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="pl-10 auth-input"
                          required
                          minLength={8}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="auth-label">
                        {t("confirmPassword")}
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`pl-10 auth-input ${confirmPassword && confirmPassword !== registerPassword ? "border-red-500" : ""}`}
                          required
                        />
                        {confirmPassword && confirmPassword !== registerPassword && (
                          <div className="flex items-center mt-1 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>Passwords don't match</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full auth-button"
                      disabled={
                        isLoading ||
                        usernameExists ||
                        emailExists ||
                        (confirmPassword && confirmPassword !== registerPassword)
                      }
                    >
                      {isLoading ? t("loading") : t("signUp")}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    {t("alreadyHaveAccount")}{" "}
                    <Button variant="link" className="p-0 h-auto auth-link" onClick={() => setActiveTab("login")}>
                      {t("signIn")}
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="reset">
              <Card className="auth-card">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">{t("resetPassword")}</CardTitle>
                  <CardDescription className="text-center">{t("resetPasswordSubtitle")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="auth-label">
                        {t("email")}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="name@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="pl-10 auth-input"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full auth-button" disabled={isLoading}>
                      {isLoading ? t("loading") : t("resetPassword")}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="link" className="p-0 h-auto auth-link" onClick={() => setActiveTab("login")}>
                    {t("signIn")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </>
  )
}

