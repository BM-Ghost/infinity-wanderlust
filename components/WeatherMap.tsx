'use client';

import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { useEffect, useRef } from 'react';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// @ts-ignore
const mapboxglModule = require('mapbox-gl');

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const WeatherMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [36.8219, -1.2921], // Nairobi
      zoom: 6,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken || '',
      mapboxgl: mapboxglModule,
      marker: true,
      placeholder: 'Search for a place',
    });

    map.addControl(geocoder as any, 'top-left');

    map.on('load', () => {
      map.addSource('weather', {
        type: 'raster',
        tiles: [
          `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}`,
        ],
        tileSize: 256,
      });

      map.addLayer({
        id: 'clouds',
        type: 'raster',
        source: 'weather',
        paint: {
          'raster-opacity': 0.6,
        },
      });
    });

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} className="w-full h-screen rounded-xl" />;
};

export default WeatherMap;
