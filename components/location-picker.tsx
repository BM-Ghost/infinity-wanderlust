"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Navigation, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string
    latitude: number
    longitude: number
  }) => void
  defaultLocation?: {
    address?: string
    latitude?: number
    longitude?: number
  }
}

export function LocationPicker({ onLocationSelect, defaultLocation }: LocationPickerProps) {
  const [address, setAddress] = useState(defaultLocation?.address || "")
  const [latitude, setLatitude] = useState(defaultLocation?.latitude || -1.286389)
  const [longitude, setLongitude] = useState(defaultLocation?.longitude || 36.817223)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const { toast } = useToast()

  // Handle manual address input
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }

  // Handle address submission
  const handleAddressSubmit = () => {
    if (!address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter an address to continue",
        variant: "destructive",
      })
      return
    }

    // Simulate geocoding with random coordinates near Nairobi
    // In a real app, you would use a geocoding service
    const randomLat = -1.286389 + (Math.random() - 0.5) * 0.1
    const randomLng = 36.817223 + (Math.random() - 0.5) * 0.1

    setLatitude(randomLat)
    setLongitude(randomLng)

    onLocationSelect({
      address: address,
      latitude: randomLat,
      longitude: randomLng,
    })

    toast({
      title: "Location set",
      description: "The location has been set successfully",
    })
  }

  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true)

    // Simulate getting current location
    setTimeout(() => {
      // Default to Nairobi with slight randomization
      const randomLat = -1.286389 + (Math.random() - 0.5) * 0.05
      const randomLng = 36.817223 + (Math.random() - 0.5) * 0.05

      setLatitude(randomLat)
      setLongitude(randomLng)
      setAddress("Nairobi, Kenya")

      onLocationSelect({
        address: "Nairobi, Kenya",
        latitude: randomLat,
        longitude: randomLng,
      })

      setIsLoadingLocation(false)

      toast({
        title: "Location set",
        description: "Using simulated current location: Nairobi, Kenya",
      })
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              placeholder="Enter a location address"
              value={address}
              onChange={handleAddressChange}
              className="w-full"
            />
          </div>
          <Button type="button" onClick={handleAddressSubmit}>
            <MapPin className="h-4 w-4 mr-2" />
            Set Location
          </Button>
          <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isLoadingLocation}>
            {isLoadingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            <span className="sr-only">Get current location</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Enter a location address or use your current location</p>
      </div>

      <Card className="overflow-hidden p-4">
        <div className="bg-muted rounded-md p-4 text-center">
          <p className="font-medium">Location: {address || "Not set"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
          <div className="mt-4 p-4 bg-background rounded border">
            <MapPin className="h-8 w-8 mx-auto text-primary" />
            <p className="text-sm mt-2">Map preview unavailable in demo mode</p>
            <p className="text-xs text-muted-foreground mt-1">In production, this would display an interactive map</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
