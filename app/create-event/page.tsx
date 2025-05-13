"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  CalendarIcon,
  Upload,
  MapPin,
  Info,
  Users,
  DollarSign,
  Clock,
  Tag,
  Compass,
  Thermometer,
  Backpack,
  Share2,
  AlertCircle,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { createEvent } from "@/lib/travel-events"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Activity options for the event
const ACTIVITY_OPTIONS = [
  { id: "hiking", label: "Hiking" },
  { id: "sightseeing", label: "Sightseeing" },
  { id: "photography", label: "Photography" },
  { id: "food", label: "Food & Cuisine" },
  { id: "beach", label: "Beach" },
  { id: "cultural", label: "Cultural" },
  { id: "adventure", label: "Adventure" },
  { id: "relaxation", label: "Relaxation" },
]

// Difficulty levels
const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy - Suitable for all fitness levels" },
  { value: "moderate", label: "Moderate - Some physical activity required" },
  { value: "challenging", label: "Challenging - Good fitness level recommended" },
  { value: "difficult", label: "Difficult - Advanced fitness level required" },
]

export default function CreateEventPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [destination, setDestination] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [price, setPrice] = useState("")
  const [totalSpots, setTotalSpots] = useState("")
  const [duration, setDuration] = useState("")
  const [location, setLocation] = useState<{
    address: string
    latitude: number
    longitude: number
  }>({
    address: "",
    latitude: 0,
    longitude: 0,
  })

  // Wanderlog-inspired additional fields
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [difficultyLevel, setDifficultyLevel] = useState("moderate")
  const [weatherInfo, setWeatherInfo] = useState<any>(null)
  const [packingList, setPackingList] = useState<string[]>([])
  const [nearbyAttractions, setNearbyAttractions] = useState<any[]>([])
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to create an event.",
        variant: "destructive",
      })
      router.push("/login?redirect=/create-event")
    }
  }, [user, isAuthLoading, router, toast])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle manual location input
  const handleLocationInput = () => {
    // For demo purposes, set a default location if none is provided
    if (!location.address) {
      const defaultLocation = {
        address: "Nairobi, Kenya",
        latitude: -1.2921,
        longitude: 36.8219,
      }
      setLocation(defaultLocation)
      setDestination("Nairobi") // Make sure this is set

      // Simulate fetching weather and attractions for the location
      simulateWeatherForecast(defaultLocation.latitude, defaultLocation.longitude)
      simulateNearbyAttractions(defaultLocation.latitude, defaultLocation.longitude)

      toast({
        title: "Location set",
        description: "Default location set to Nairobi, Kenya.",
      })
    } else {
      // Simulate geocoding the address to get coordinates
      const geocodedLocation = {
        ...location,
        latitude: location.latitude || (Math.random() * 180 - 90) % 90, // Ensure within -90 to 90
        longitude: location.longitude || Math.random() * 360 - 180, // Ensure within -180 to 180
      }
      setLocation(geocodedLocation)

      // Extract destination from address - use the first part of the address
      const destinationPart = location.address.split(",")[0].trim()
      setDestination(destinationPart)

      // Simulate fetching weather and attractions for the location
      simulateWeatherForecast(geocodedLocation.latitude, geocodedLocation.longitude)
      simulateNearbyAttractions(geocodedLocation.latitude, geocodedLocation.longitude)

      toast({
        title: "Location set",
        description: `Location set to ${location.address}.`,
      })
    }
  }

  // Simulate getting weather forecast
  const simulateWeatherForecast = (lat: number, lng: number) => {
    // In a real app, this would call a weather API
    setTimeout(() => {
      const month = startDate ? startDate.getMonth() : new Date().getMonth()
      let forecast

      // Generate seasonal weather based on month
      if (month >= 2 && month <= 4) {
        // Spring
        forecast = { condition: "Partly Cloudy", high: 75, low: 55, precipitation: 20 }
      } else if (month >= 5 && month <= 7) {
        // Summer
        forecast = { condition: "Sunny", high: 85, low: 65, precipitation: 10 }
      } else if (month >= 8 && month <= 10) {
        // Fall
        forecast = { condition: "Cloudy", high: 65, low: 45, precipitation: 30 }
      } else {
        // Winter
        forecast = { condition: "Rainy", high: 55, low: 35, precipitation: 60 }
      }

      setWeatherInfo(forecast)

      // Update packing list based on weather and activities
      updatePackingList(forecast, selectedActivities)
    }, 500)
  }

  // Simulate getting nearby attractions
  const simulateNearbyAttractions = (lat: number, lng: number) => {
    // In a real app, this would call a places API
    setTimeout(() => {
      const attractions = [
        { name: "Local Museum", type: "museum", distance: 1.2 },
        { name: "City Park", type: "park", distance: 0.8 },
        { name: "Historic Building", type: "landmark", distance: 1.5 },
        { name: "Popular Restaurant", type: "food", distance: 0.5 },
      ]
      setNearbyAttractions(attractions)
    }, 700)
  }

  // Update packing list based on weather and activities
  const updatePackingList = (weather: any, activities: string[]) => {
    const suggestions = ["Passport", "Travel insurance", "Comfortable shoes", "Phone charger"]

    // Add weather-specific items
    if (weather.condition === "Sunny") {
      suggestions.push("Sunscreen", "Sunglasses", "Hat")
    } else if (weather.condition === "Rainy") {
      suggestions.push("Umbrella", "Raincoat", "Waterproof shoes")
    }

    // Add activity-specific items
    if (activities.includes("hiking")) {
      suggestions.push("Hiking boots", "Backpack", "Water bottle", "First aid kit")
    }
    if (activities.includes("beach")) {
      suggestions.push("Beach towel", "Swimwear", "Flip flops")
    }
    if (activities.includes("photography")) {
      suggestions.push("Camera", "Extra memory cards", "Camera charger")
    }

    setPackingList(suggestions)
  }

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag("")
    }
  }

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // Handle activity selection
  const handleActivityToggle = (activityId: string) => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(selectedActivities.filter((id) => id !== activityId))
    } else {
      setSelectedActivities([...selectedActivities, activityId])
    }

    // Update packing list when activities change
    if (weatherInfo) {
      const newActivities = selectedActivities.includes(activityId)
        ? selectedActivities.filter((id) => id !== activityId)
        : [...selectedActivities, activityId]
      updatePackingList(weatherInfo, newActivities)
    }
  }

  // Validate form fields
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!title) errors.title = "Title is required"
    if (!description) errors.description = "Description is required"
    if (!destination) errors.destination = "Destination is required"
    if (!startDate) errors.startDate = "Start date is required"
    if (!endDate) errors.endDate = "End date is required"
    if (!price) errors.price = "Price is required"
    if (!totalSpots) errors.totalSpots = "Total spots is required"
    if (!location.address) errors.location = "Location is required"

    // Validate latitude and longitude
    if (location.latitude < -90 || location.latitude > 90) {
      errors.latitude = "Latitude must be between -90 and 90 degrees"
    }

    if (location.longitude < -180 || location.longitude > 180) {
      errors.longitude = "Longitude must be between -180 and 180 degrees"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to create an event.",
        variant: "destructive",
      })
      return
    }

    // Validate form
    if (!validateForm()) {
      // If destination is missing but location is set, automatically set destination
      if (!destination && location.address) {
        const destinationPart = location.address.split(",")[0].trim()
        setDestination(destinationPart)
        console.log("🔄 Automatically setting destination to:", destinationPart)
      }

      toast({
        title: "Missing or invalid information",
        description: "Please correct the highlighted fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.group("📝 EVENT SUBMISSION")
    console.log("🔍 Starting event submission process")
    console.log("👤 User authentication status:", user ? "Authenticated" : "Not authenticated")

    try {
      // Prepare event data
      const eventData = {
        title,
        description,
        destination,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        price: Number.parseFloat(price),
        total_spots: Number.parseInt(totalSpots),
        duration: duration || `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
        location_address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        tags,
        activities: selectedActivities,
        difficulty_level: difficultyLevel,
      }

      console.log("📋 Event data prepared:", eventData)
      console.log(
        "🖼️ Image:",
        selectedFile
          ? {
              name: selectedFile.name,
              type: selectedFile.type,
              size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
            }
          : "None",
      )

      // Create the event
      console.log("🔄 Calling createEvent function...")
      const result = await createEvent(eventData, selectedFile ? [selectedFile] : undefined)

      if (result) {
        console.log("✅ Event created successfully:", result)
        toast({
          title: "Event created",
          description: "Your event has been created successfully.",
        })
        router.push(`/events`)
      } else {
        console.error("❌ Event creation failed: No result returned")
        toast({
          title: "Error creating event",
          description: "No response from server. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("❌ Error in event submission:", error)
      console.error("  Error message:", error.message)
      console.error("  Error stack:", error.stack)

      toast({
        title: "Error creating event",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log("🏁 Event submission process completed")
      console.groupEnd()
      setIsSubmitting(false)
    }
  }

  // Handle location selection
  const handleLocationSelect = (selectedLocation: {
    address: string
    latitude: number
    longitude: number
  }) => {
    // Ensure latitude is within valid range
    const validLatitude = Math.max(-90, Math.min(90, selectedLocation.latitude))

    setLocation({
      ...selectedLocation,
      latitude: validLatitude,
    })
    setDestination(selectedLocation.address.split(",")[0]) // Use the first part of the address as destination

    // Simulate fetching weather and attractions for the location
    simulateWeatherForecast(validLatitude, selectedLocation.longitude)
    simulateNearbyAttractions(validLatitude, selectedLocation.longitude)
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create a New Event</h1>
          <p className="text-muted-foreground mb-8">
            Share your travel plans and invite others to join your adventure.
          </p>

          <div className="mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4" />
              {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
            </Button>

            {showDebugInfo && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Debug Information</AlertTitle>
                <AlertDescription>
                  <div className="text-xs mt-2 font-mono">
                    <p>
                      Required fields: title, subtitle, description, destination, start_date, end_date, duration_days,
                      spots_left, price, currency, latitude, longitude, creator
                    </p>
                    <p>Latitude must be between -90 and 90 degrees</p>
                    <p>Longitude must be between -180 and 180 degrees</p>
                    <p>Current latitude: {location.latitude}</p>
                    <p>Current longitude: {location.longitude}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  <span>Activities</span>
                </TabsTrigger>
                <TabsTrigger value="planning" className="flex items-center gap-2">
                  <Backpack className="h-4 w-4" />
                  <span>Planning</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Preview</span>
                </TabsTrigger>
              </TabsList>

              {/* Event Details Tab */}
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                    <CardDescription>Provide the basic information about your event.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className={formErrors.title ? "text-destructive" : ""}>
                        Event Title *
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g., Weekend Hiking Trip to Mt. Kenya"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={formErrors.title ? "border-destructive" : ""}
                      />
                      {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className={formErrors.description ? "text-destructive" : ""}>
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your event, what to expect, what to bring, etc."
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={formErrors.description ? "border-destructive" : ""}
                      />
                      {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={formErrors.startDate ? "text-destructive" : ""}>Start Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground",
                                formErrors.startDate && "border-destructive text-destructive",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.startDate && <p className="text-xs text-destructive">{formErrors.startDate}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className={formErrors.endDate ? "text-destructive" : ""}>End Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground",
                                formErrors.endDate && "border-destructive text-destructive",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              disabled={(date) => date < (startDate || new Date())}
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.endDate && <p className="text-xs text-destructive">{formErrors.endDate}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="price"
                          className={cn("flex items-center", formErrors.price && "text-destructive")}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Price per Person *
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className={formErrors.price ? "border-destructive" : ""}
                        />
                        {formErrors.price && <p className="text-xs text-destructive">{formErrors.price}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="totalSpots"
                          className={cn("flex items-center", formErrors.totalSpots && "text-destructive")}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Total Spots *
                        </Label>
                        <Input
                          id="totalSpots"
                          type="number"
                          min="1"
                          placeholder="10"
                          value={totalSpots}
                          onChange={(e) => setTotalSpots(e.target.value)}
                          className={formErrors.totalSpots ? "border-destructive" : ""}
                        />
                        {formErrors.totalSpots && <p className="text-xs text-destructive">{formErrors.totalSpots}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration" className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Duration (optional)
                        </Label>
                        <Input
                          id="duration"
                          placeholder="e.g., 3 days, 2 nights"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to calculate from dates</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Event Image</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                            </div>
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </Label>
                        </div>
                        {previewImage && (
                          <div className="relative h-32 rounded-md overflow-hidden">
                            <img
                              src={previewImage || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div className="space-y-2">
                      <Label htmlFor="tags" className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        Tags
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="tags"
                          placeholder="Add tags (e.g., family-friendly, weekend)"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddTag} variant="secondary">
                          Add
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="rounded-full h-4 w-4 inline-flex items-center justify-center text-xs hover:bg-muted"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => setActiveTab("location")}>
                      Next: Location
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Location</CardTitle>
                    <CardDescription>Enter the location for your event.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location-address" className={formErrors.location ? "text-destructive" : ""}>
                        Location Address *
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="location-address"
                          placeholder="e.g., Nairobi, Kenya"
                          value={location.address}
                          onChange={(e) => setLocation({ ...location, address: e.target.value })}
                          className={cn("flex-1", formErrors.location && "border-destructive")}
                        />
                        <Button type="button" onClick={handleLocationInput}>
                          Set Location
                        </Button>
                      </div>
                      {formErrors.location && <p className="text-xs text-destructive">{formErrors.location}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination" className={formErrors.destination ? "text-destructive" : ""}>
                        Destination *
                      </Label>
                      <Input
                        id="destination"
                        placeholder="e.g., Nairobi"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className={formErrors.destination ? "border-destructive" : ""}
                      />
                      {formErrors.destination && <p className="text-xs text-destructive">{formErrors.destination}</p>}
                      <p className="text-xs text-muted-foreground">
                        This is automatically set from your location, but you can change it if needed.
                      </p>
                    </div>

                    {location.address && (
                      <div className="p-4 border rounded-md bg-muted/30">
                        <div className="flex items-center justify-center mb-4">
                          <MapPin className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-center font-medium">{location.address}</p>
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          {location.latitude !== 0 && location.longitude !== 0 && (
                            <>
                              Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </>
                          )}
                        </p>
                        {(formErrors.latitude || formErrors.longitude) && (
                          <p className="text-center text-xs text-destructive mt-2">
                            {formErrors.latitude || formErrors.longitude}
                          </p>
                        )}
                      </div>
                    )}

                    {nearbyAttractions.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Nearby Attractions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {nearbyAttractions.map((attraction, index) => (
                            <div key={index} className="flex items-start p-3 border rounded-md">
                              <div className="mr-3 mt-1">
                                {attraction.type === "museum" && <span className="text-xl">🏛️</span>}
                                {attraction.type === "park" && <span className="text-xl">🌳</span>}
                                {attraction.type === "landmark" && <span className="text-xl">🗿</span>}
                                {attraction.type === "food" && <span className="text-xl">🍽️</span>}
                              </div>
                              <div>
                                <h4 className="font-medium">{attraction.name}</h4>
                                <p className="text-sm text-muted-foreground">{attraction.distance} km away</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Simulate getting current location
                          const nairobi = {
                            address: "Nairobi, Kenya",
                            latitude: -1.2921,
                            longitude: 36.8219,
                          }
                          setLocation(nairobi)
                          setDestination("Nairobi")

                          // Simulate fetching weather and attractions
                          simulateWeatherForecast(nairobi.latitude, nairobi.longitude)
                          simulateNearbyAttractions(nairobi.latitude, nairobi.longitude)

                          toast({
                            title: "Location set",
                            description: "Current location set to Nairobi, Kenya.",
                          })
                        }}
                        className="mt-2"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Use Current Location
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => setActiveTab("details")}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setActiveTab("activities")}>
                      Next: Activities
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Activities Tab (Wanderlog-inspired) */}
              <TabsContent value="activities">
                <Card>
                  <CardHeader>
                    <CardTitle>Activities & Difficulty</CardTitle>
                    <CardDescription>
                      Select activities included in your event and set the difficulty level.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base">Activities</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {ACTIVITY_OPTIONS.map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`activity-${activity.id}`}
                              checked={selectedActivities.includes(activity.id)}
                              onCheckedChange={() => handleActivityToggle(activity.id)}
                            />
                            <Label htmlFor={`activity-${activity.id}`} className="text-sm font-normal cursor-pointer">
                              {activity.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">Difficulty Level</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {DIFFICULTY_LEVELS.map((level) => (
                          <div key={level.value} className="flex items-start space-x-2">
                            <input
                              type="radio"
                              id={`difficulty-${level.value}`}
                              name="difficulty"
                              value={level.value}
                              checked={difficultyLevel === level.value}
                              onChange={() => setDifficultyLevel(level.value)}
                              className="mt-1"
                            />
                            <Label htmlFor={`difficulty-${level.value}`} className="text-sm font-normal cursor-pointer">
                              <span className="font-medium">{level.label.split(" - ")[0]}</span>
                              <span className="text-muted-foreground"> - {level.label.split(" - ")[1]}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {weatherInfo && (
                      <div className="space-y-3">
                        <Label className="text-base flex items-center">
                          <Thermometer className="h-4 w-4 mr-2" />
                          Expected Weather
                        </Label>
                        <div className="p-4 border rounded-md bg-muted/30">
                          <div className="flex items-center justify-center mb-2">
                            {weatherInfo.condition === "Sunny" && <span className="text-3xl">☀️</span>}
                            {weatherInfo.condition === "Partly Cloudy" && <span className="text-3xl">⛅</span>}
                            {weatherInfo.condition === "Cloudy" && <span className="text-3xl">☁️</span>}
                            {weatherInfo.condition === "Rainy" && <span className="text-3xl">🌧️</span>}
                          </div>
                          <p className="text-center font-medium">{weatherInfo.condition}</p>
                          <div className="flex justify-center gap-4 mt-2">
                            <span className="text-sm">High: {weatherInfo.high}°F</span>
                            <span className="text-sm">Low: {weatherInfo.low}°F</span>
                          </div>
                          <p className="text-center text-sm text-muted-foreground mt-1">
                            {weatherInfo.precipitation}% chance of precipitation
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => setActiveTab("location")}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setActiveTab("planning")}>
                      Next: Planning
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Planning Tab (Wanderlog-inspired) */}
              <TabsContent value="planning">
                <Card>
                  <CardHeader>
                    <CardTitle>Trip Planning</CardTitle>
                    <CardDescription>Helpful information for planning this trip.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {packingList.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-base flex items-center">
                          <Backpack className="h-4 w-4 mr-2" />
                          Suggested Packing List
                        </Label>
                        <div className="p-4 border rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {packingList.map((item, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox id={`pack-${index}`} />
                                <Label htmlFor={`pack-${index}`} className="text-sm font-normal cursor-pointer">
                                  {item}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-base flex items-center">
                        <Share2 className="h-4 w-4 mr-2" />
                        Sharing Options
                      </Label>
                      <div className="p-4 border rounded-md">
                        <p className="text-sm mb-3">After creating your event, you'll be able to share it via:</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <span className="text-lg">📧</span> Email
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <span className="text-lg">📱</span> SMS
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <span className="text-lg">🔗</span> Direct Link
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <span className="text-lg">📝</span> Calendar Invite
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">Travel Tips</Label>
                      <div className="p-4 border rounded-md">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start">
                            <span className="text-lg mr-2">💡</span>
                            <span>Book accommodations early to secure the best rates.</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-lg mr-2">💡</span>
                            <span>Check visa requirements for international travelers.</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-lg mr-2">💡</span>
                            <span>Consider travel insurance for unexpected changes.</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-lg mr-2">💡</span>
                            <span>Research local customs and etiquette before your trip.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => setActiveTab("activities")}>
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span> Creating...
                        </>
                      ) : (
                        "Publish Event"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
