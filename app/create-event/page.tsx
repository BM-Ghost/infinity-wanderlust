"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { useUsers } from "@/hooks/useUsers"
import { Avatar, AvatarImage } from "@/components/ui/avatar"; // Assuming you have these
import { useDebounce } from "use-debounce"; // Install via: npm install use-debounce
import axios from 'axios';
import { addDays } from "date-fns"; // ensure this is imported
import type Fuse from "fuse.js";

// Initialize Fuse.js with SSR fallback
let fuseInstance: any = null;

if (typeof window !== 'undefined') {
  fuseInstance = require('fuse.js').default;
}

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
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [currencyName, setCurrencyName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [isEditing, setIsEditing] = useState(true);

  // Users state
  const [userQuery, setUserQuery] = useState("");
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);

  const { data, isLoading: isUsersLoading } = useUsers(1);
  const users = data?.users ?? [];

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const OPENWEATHER_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;

  const handleTagUser = (username: string) => {
    if (!taggedUsers.includes(username)) {
      setTaggedUsers([...taggedUsers, username]);
    }
    setUserQuery(""); // Reset input
  };

  // Inside your component
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const tomorrow = addDays(new Date(), 1);

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [destination, setDestination] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  // Helper function to format date for PocketBase
  const formatDateForPocketBase = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString();
  }

  const [startTime, setStartTime] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState<Date | undefined>(undefined)
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

  type Country = {
    name: { common: string };
    currencies?: {
      [code: string]: {
        name: string;
        symbol?: string;
      };
    };
  };

  type CurrencyOption = {
    label: string;
    code: string;
    symbol: string;
    countryName: string;
    currencyName: string;
  };

  // Fetch countries & currencies from API
  const [fuse, setFuse] = useState<Fuse<CurrencyOption> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchByDemonym = async (demonym: string) => {
    const res = await fetch(`https://restcountries.com/v3.1/demonym/${demonym}`);
    const data = await res.json();
    console.log(data);
  };

  useEffect(() => {
    if (startDate && startTime && endDate && endTime) {
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();

      const start = new Date(startDate);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(endDate);
      end.setHours(endHour, endMinute, 0, 0);

      const diffMs = end.getTime() - start.getTime();
      if (diffMs <= 0) {
        setDuration("Invalid time range");
        return;
      }

      const totalMinutes = Math.floor(diffMs / 60000);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      let formatted = "";
      if (days > 0) formatted += `${days} day${days > 1 ? "s" : ""}`;
      if (hours > 0) formatted += `${formatted ? ", " : ""}${hours} hour${hours > 1 ? "s" : ""}`;
      if (minutes > 0) formatted += `${formatted ? ", " : ""}${minutes} minute${minutes > 1 ? "s" : ""}`;

      setDuration(formatted || "Less than 1 minute");
    } else {
      setDuration(""); // Clear if inputs are incomplete
    }
  }, [startDate, startTime, endDate, endTime]);

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = currencyOptions.find(opt => opt.countryName === e.target.value);
    console.log("Selected country:", selected);

    if (selected) {
      setSelectedCurrency(selected.countryName);
      setCurrencySymbol(selected.symbol);
      setCurrencyName(selected.currencyName);
      setCurrencyCode(selected.code);
      setIsEditing(false);
    }
  };


  const fetchCountriesByCurrency = async (currencyCode: string) => {
    if (!currencyCode) return;

    setLoading(true);
    setError("");
    setCountries([]);
    setCurrencyOptions([]);
    setSelectedCurrency("");
    setCurrencySymbol("");

    try {
      const res = await fetch(`https://restcountries.com/v3.1/currency/${currencyCode}`);
      if (!res.ok) {
        throw new Error("Currency not found");
      }

      const data: Country[] = await res.json();
      setCountries(data);
      console.log("Fetched countries:", data);

      const upperCurrencyCode = currencyCode.toUpperCase();

      const options: CurrencyOption[] = data.map((country) => {
        const currencies = country.currencies || {};

        // Prefer the exact code, fallback to first currency
        const currencyEntry =
          currencies[upperCurrencyCode] || Object.values(currencies)[0];

        const symbol = currencyEntry?.symbol || "";
        const currencyName = currencyEntry?.name || "";

        return {
          label: `${country.name.common} (${currencyName})`,
          code: country.ccn3 || "",
          symbol,
          countryName: country.name.common,
          currencyName,
        };
      });

      setCurrencyOptions(options);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      console.log("📂 Selected file:", file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
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
        destination,
        description,
        start_date: formatDateForPocketBase(startDate),
        end_date: formatDateForPocketBase(endDate),
        spots_left: Number.parseInt(totalSpots, 10),
        currency: selectedCurrency,
        status: activeTab === "upcoming" ? "upcoming" : "past",
        slug: title.toLowerCase().replace(/\s+/g, "-"),
        event_url: "https://example.com/events/" + title.toLowerCase().replace(/\s+/g, "-"),
        latitude: location.latitude,
        longitude: location.longitude,
        creator: user.id,
        collaborators: taggedUsers,
        location_address: location.address,
        location_name: destination,
        tags,
        activities: selectedActivities,
        difficulty_level: difficultyLevel,
        packing_list: packingList,
        images: selectedFile instanceof File ? [selectedFile] : [],
      }
      // Create the event
      const result = await createEvent(eventData)
      if (result) {
        toast({
          title: "Event created",
          description: "Your event has been created successfully.",
        })
        router.push(`/events`)
      } else {
        toast({
          title: "Error creating event",
          description: "No response from server. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("❌ Error in event submission:", error)

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

  const [weather, setWeather] = useState<WeatherData | null>(null);

  const handleLocationInput = async () => {
    if (!location.address) {
      setFormErrors({ location: 'Please enter an address.' });
      return;
    }

    try {
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location.address)}.json?access_token=${MAPBOX_TOKEN}`;
      const geocodeRes = await axios.get(geocodeUrl);
      const [lon, lat] = geocodeRes.data.features[0].center;

      setLocation((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
      }));

      const placeName = geocodeRes.data.features[0].place_name;
      setDestination(placeName);

      fetchWeather(lat, lon);
      fetchNearbyAttractions(lat, lon);
    } catch (error) {
      console.error('Error fetching location data:', error);
      setFormErrors({ location: 'Unable to fetch location data.' });
    }
  };

  interface WeatherMain {
    temp: number;
    humidity: number;
  }

  interface WeatherWeather {
    description: string;
    icon: string;
  }

  interface WeatherWind {
    speed: number;
  }

  interface WeatherData {
    main: WeatherMain;
    weather: WeatherWeather[];
    wind: WeatherWind;
    [key: string]: any; // For any additional fields
  }

  const fetchWeather = async (lat: number, lon: number): Promise<void> => {
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
      const weatherRes = await axios.get<WeatherData>(weatherUrl);
      setWeather(weatherRes.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  interface AttractionFeatureProperties {
    category?: string;
    distance?: number;
    [key: string]: any;
  }

  interface AttractionFeature {
    text: string;
    properties: AttractionFeatureProperties;
    [key: string]: any;
  }

  interface AttractionsResponse {
    features: AttractionFeature[];
    [key: string]: any;
  }

  interface NearbyAttraction {
    name: string;
    type: string;
    distance: string;
  }

  const fetchNearbyAttractions = async (lat: number, lon: number): Promise<void> => {
    try {
      const attractionsUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/poi.json?proximity=${lon},${lat}&access_token=${MAPBOX_TOKEN}`;
      const attractionsRes = await axios.get<AttractionsResponse>(attractionsUrl);
      const attractions: NearbyAttraction[] = attractionsRes.data.features.map((feature) => ({
        name: feature.text,
        type: feature.properties.category || 'landmark',
        distance: (feature.properties.distance || 0).toFixed(2),
      }));
      setNearbyAttractions(attractions);
    } catch (error) {
      console.error('Error fetching nearby attractions:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`;
          const reverseGeocodeRes = await axios.get(reverseGeocodeUrl);
          const address = reverseGeocodeRes.data.features[0].place_name;

          setLocation({
            address,
            latitude,
            longitude,
          });
          setDestination(address);

          fetchWeather(latitude, longitude);
          fetchNearbyAttractions(latitude, longitude);

          toast({
            title: 'Location set',
            description: `Current location set to ${address}.`,
          });
        } catch (error) {
          console.error('Error fetching current location:', error);
          toast({
            title: 'Error',
            description: 'Unable to fetch current location.',
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Error',
          description: 'Unable to retrieve your location.',
        });
      }
    );
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create a New Event</h1>
          <p className="text-muted-foreground mb-8">
            Share your travel plans and invite others to join your adventure.
          </p>

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
                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label className={formErrors.startDate ? "text-destructive" : ""}>Start Date *</Label>
                        <Popover open={startOpen} onOpenChange={setStartOpen}>
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
                              onSelect={(date) => {
                                setStartDate(date);
                                setStartOpen(false);
                              }}
                              initialFocus
                              disabled={(date) => date < new Date()}
                              month={tomorrow}
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.startDate && <p className="text-xs text-destructive">{formErrors.startDate}</p>}

                        {/* Start Time */}
                        <Label>Start Time *</Label>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          asChild
                        >
                          <input
                            type="time"
                            className={cn(
                              "w-full bg-transparent cursor-pointer outline-none appearance-none",
                              "border-none px-3 py-2 rounded-md"
                            )}
                            value={
                              startTime
                                ? `${String(startTime.getHours()).padStart(2, '0')}:${String(
                                  startTime.getMinutes()
                                ).padStart(2, '0')}`
                                : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":").map(Number);
                              if (!isNaN(hours) && !isNaN(minutes)) {
                                const date = startDate ? new Date(startDate) : new Date();
                                date.setHours(hours, minutes, 0, 0);
                                setStartTime(date);
                              } else {
                                setStartTime(undefined);
                              }
                            }}
                          />
                        </Button>
                      </div>

                      {/* End Date */}
                      <div className="space-y-2">
                        <Label className={formErrors.endDate ? "text-destructive" : ""}>End Date *</Label>
                        <Popover open={endOpen} onOpenChange={setEndOpen}>
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
                              onSelect={(date) => {
                                setEndDate(date);
                                setEndOpen(false);
                              }}
                              initialFocus
                              disabled={(date) => date < (startDate || new Date())}
                              month={startDate || tomorrow}
                            />
                          </PopoverContent>
                        </Popover>
                        {formErrors.endDate && <p className="text-xs text-destructive">{formErrors.endDate}</p>}

                        {/* End Time */}
                        <Label>End Time *</Label>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          asChild
                        >
                          <input
                            type="time"
                            className={cn(
                              "w-full bg-transparent cursor-pointer outline-none appearance-none",
                              "border-none px-3 py-2 rounded-md"
                            )}
                            value={
                              endTime
                                ? `${String(endTime.getHours()).padStart(2, '0')}:${String(
                                  endTime.getMinutes()
                                ).padStart(2, '0')}`
                                : ""
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":").map(Number);
                              if (!isNaN(hours) && !isNaN(minutes)) {
                                const date = endDate ? new Date(endDate) : new Date();
                                date.setHours(hours, minutes, 0, 0);
                                setEndTime(date);
                              } else {
                                setEndTime(undefined);
                              }
                            }}
                          />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      {/* Currency Selector with Search or Result */}
                      <div className="flex flex-col justify-end">
                        <Label htmlFor="currency" className="block mb-1">Select Currency</Label>

                        <div className="flex gap-2 items-center">
                          <div className="w-full">
                            {isEditing && currencyOptions.length > 0 && !selectedCurrency ? (
                              <select
                                id="country-select"
                                className="w-full border px-2 py-2 rounded-md bg-background text-foreground"
                                onChange={handleCountrySelect}
                                value={selectedCurrency}
                              >
                                <option value="">-- Choose a country using {searchTerm} --</option>
                                {currencyOptions.map((opt) => (
                                  <option key={opt.countryName} value={opt.countryName}>
                                    {opt.countryName}
                                  </option>
                                ))}
                              </select>
                            ) : isEditing ? (
                              <div className="flex gap-2">
                                <Input
                                  id="currency"
                                  type="text"
                                  placeholder="e.g. usd, cop, eur..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value.trim().toLowerCase())}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") fetchCountriesByCurrency(searchTerm);
                                  }}
                                  className="w-full border px-2 py-2 rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => fetchCountriesByCurrency(searchTerm)}
                                  disabled={!searchTerm}
                                  className="px-4 py-2 bg-muted text-foreground border rounded-md hover:bg-green-600 hover:text-white text-sm"
                                >
                                  Search
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <div className="flex-1 border px-2 py-2 rounded-md bg-background text-foreground truncate text-sm font-medium">
                                  {currencyName || "No currency selected"}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEditing(true);
                                    setSelectedCurrency("");
                                    setCurrencySymbol("");
                                    setCurrencyName("");
                                    setSearchTerm("");
                                    setCurrencyOptions([]);
                                    setError("");
                                  }}
                                  className="px-4 py-2 bg-muted text-foreground border rounded-md hover:bg-green-600 hover:text-white text-sm"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {loading && <p className="text-sm mt-1 text-gray-600">Loading...</p>}
                        {error && <p className="text-sm mt-1 text-red-600">❌ {error}</p>}
                      </div>

                      {/* Price per Person */}
                      <div className="flex flex-col justify-end">
                        <Label
                          htmlFor="price"
                          className={cn("flex items-center mb-1", formErrors.price && "text-destructive")}
                        >
                          <span className="mr-1">{currencySymbol}</span>
                          Price per Person *
                        </Label>
                        <Input
                          id="price"
                          type="text"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => {
                            const input = e.target.value.replace(/[^0-9.]/g, "");
                            setPrice(input);
                          }}
                          onBlur={() => {
                            const number = parseFloat(price.replace(/,/g, ""));
                            if (!isNaN(number)) {
                              const formatted = number.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                              setPrice(formatted);
                            }
                          }}
                          className={formErrors.price ? "border-destructive" : ""}
                        />
                        {formErrors.price && (
                          <p className="text-xs text-destructive mt-1">{formErrors.price}</p>
                        )}
                      </div>

                      {/* Total Spots */}
                      <div className="flex flex-col justify-end">
                        <Label
                          htmlFor="totalSpots"
                          className={cn("flex items-center mb-1", formErrors.totalSpots && "text-destructive")}
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
                        {formErrors.totalSpots && (
                          <p className="text-xs text-destructive mt-1">{formErrors.totalSpots}</p>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    {startDate && startTime && endDate && endTime && (
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Duration
                        </Label>
                        <Input
                          id="duration"
                          placeholder="e.g., 3 days, 2 nights"
                          value={duration}
                          readOnly
                        />
                        <p className="text-xs text-muted-foreground">
                          Automatically calculated from selected start and end time
                        </p>
                      </div>
                    )}


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

                    {/* User Tagging Autocomplete */}
                    <div className="space-y-1">
                      <Label htmlFor="user-search" className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        Tag Users
                      </Label>
                      <Input
                        id="user-search"
                        placeholder="Search users to tag"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        className="flex-1"
                      />

                      {/* Suggestions dropdown */}
                      {userQuery && users.length > 0 && (
                        <div className="border bg-white shadow rounded-md max-h-48 overflow-y-auto mt-1 z-10 relative">
                          {users.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer"
                              onClick={() => handleTagUser(user.username)}
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={user.avatar ?? "/default-avatar.png"} alt={user.username} />
                              </Avatar>
                              <span className="text-sm">{user.username}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Display tagged users as badges */}
                    {taggedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {taggedUsers.map((username) => (
                          <Badge key={username} variant="secondary" className="flex items-center gap-1">
                            @{username}
                            <button
                              type="button"
                              onClick={() =>
                                setTaggedUsers(taggedUsers.filter((u) => u !== username))
                              }
                              className="rounded-full h-4 w-4 inline-flex items-center justify-center text-xs hover:bg-muted"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}


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
                      <Label htmlFor="location-address" className={formErrors.location ? 'text-destructive' : ''}>
                        Location Address *
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="location-address"
                          placeholder="e.g., Nairobi, Kenya"
                          value={location.address}
                          onChange={(e) => setLocation({ ...location, address: e.target.value })}
                          className={cn('flex-1', formErrors.location && 'border-destructive')}
                        />
                        <Button type="button" onClick={handleLocationInput}>
                          Set Location
                        </Button>
                      </div>
                      {formErrors.location && <p className="text-xs text-destructive">{formErrors.location}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination" className={formErrors.destination ? 'text-destructive' : ''}>
                        Destination *
                      </Label>
                      <Input
                        id="destination"
                        placeholder="e.g., Nairobi"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className={formErrors.destination ? 'border-destructive' : ''}
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

                    {weather && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Current Weather</h3>
                        <div className="p-4 border rounded-md bg-muted/30">
                          <p className="text-sm">Temperature: {weather.main.temp}°C</p>
                          <p className="text-sm">Weather: {weather.weather[0].description}</p>
                          <p className="text-sm">Humidity: {weather.main.humidity}%</p>
                          <p className="text-sm">Wind Speed: {weather.wind.speed} m/s</p>
                        </div>
                      </div>
                    )}

                    {nearbyAttractions.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Nearby Attractions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {nearbyAttractions.map((attraction, index) => (
                            <div key={index} className="flex items-start p-3 border rounded-md">
                              <div className="mr-3 mt-1">
                                {attraction.type.includes('museum') && <span className="text-xl">🏛️</span>}
                                {attraction.type.includes('park') && <span className="text-xl">🌳</span>}
                                {attraction.type.includes('landmark') && <span className="text-xl">🗿</span>}
                                {attraction.type.includes('food') && <span className="text-xl">🍽️</span>}
                                {!['museum', 'park', 'landmark', 'food'].some((type) => attraction.type.includes(type)) && (
                                  <span className="text-xl">📍</span>
                                )}
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
                      <Button type="button" variant="outline" onClick={handleUseCurrentLocation} className="mt-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        Use Current Location
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-4">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Location
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
    </div>
  )
}