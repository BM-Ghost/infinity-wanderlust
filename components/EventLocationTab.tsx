"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

type Attraction = {
  name: string
  distance: number
  type: string
}

type Props = {
  location: {
    address: string
    latitude: number
    longitude: number
  }
  setLocation: (loc: any) => void
  destination: string
  setDestination: (val: string) => void
  formErrors: Record<string, string>
  toast: (args: { title: string; description?: string }) => void
  setActiveTab: (tab: string) => void
  nearbyAttractions: Attraction[]
  setNearbyAttractions: (attractions: Attraction[]) => void
  setWeather: (weather: any) => void
}

export default function EventLocationTab({
  location,
  setLocation,
  destination,
  setDestination,
  formErrors,
  toast,
  setActiveTab,
  nearbyAttractions,
  setNearbyAttractions,
  setWeather
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleLocationInput = async () => {
    if (!location.address) {
      toast({ title: "Error", description: "Please enter a valid address." })
      return
    }

    try {
      setLoading(true)

      // 1. Geocode location using OpenCage or Nominatim
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.address)}`)
      const geoData = await geoRes.json()
      if (!geoData || geoData.length === 0) throw new Error("No location found.")

      const { lat, lon } = geoData[0]
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lon)

      setLocation({
        ...location,
        latitude,
        longitude,
      })
      setDestination(location.address.split(",")[0])

      // 2. Fetch weather (OpenWeatherMap)
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`)
      const weatherData = await weatherRes.json()
      setWeather(weatherData)

      // 3. Fetch nearby attractions (OpenTripMap or Foursquare)
      const attractionsRes = await fetch(
        `https://api.opentripmap.com/0.1/en/places/radius?radius=2000&lon=${longitude}&lat=${latitude}&apikey=${process.env.NEXT_PUBLIC_OPENTRIPMAP_API_KEY}&limit=5`
      )
      const attractionsData = await attractionsRes.json()
      const attractions: Attraction[] = attractionsData.features.map((item: any) => ({
        name: item.properties.name,
        distance: Math.round(item.properties.dist / 100) / 10, // in km
        type: item.properties.kinds.split(",")[0] || "unknown",
      }))
      setNearbyAttractions(attractions)

      toast({ title: "Location updated", description: "Weather and nearby attractions fetched." })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Error", description: error.message || "Failed to fetch location data." })
    } finally {
      setLoading(false)
    }
  }

  return (
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
              <Button type="button" onClick={handleLocationInput} disabled={loading}>
                {loading ? "Loading..." : "Set Location"}
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
          </div>

          {location.latitude && location.longitude && (
            <div className="p-4 border rounded-md bg-muted/30">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <p className="text-center font-medium">{location.address}</p>
              <p className="text-center text-sm text-muted-foreground">
                Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </p>
            </div>
          )}

          {nearbyAttractions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Nearby Attractions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nearbyAttractions.map((attraction, index) => (
                  <div key={index} className="flex items-start p-3 border rounded-md">
                    <div className="mr-3 mt-1 text-xl">📍</div>
                    <div>
                      <h4 className="font-medium">{attraction.name}</h4>
                      <p className="text-sm text-muted-foreground">{attraction.distance} km away</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
