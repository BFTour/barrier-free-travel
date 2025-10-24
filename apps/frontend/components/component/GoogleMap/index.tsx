import { useTravelPlanStore } from '@stores/travelPlanStore'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin
} from '@vis.gl/react-google-maps'
import React, { useState, useCallback, useEffect } from 'react'
import Polyline from './component/Polyline'
import { markerMockData, routesMockData } from './constants'
import { RouteData } from './type'

interface MarkerData {
  id: string
  position: { lat: number; lng: number }
  title: string
  description?: string
}

export default function MapWithMarkersAndLines() {
  const [markers, setMarkers] = useState<MarkerData[]>(markerMockData)
  const [routes, setRoutes] = useState<RouteData[]>(routesMockData)

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [shouldCenterOnMarker, setShouldCenterOnMarker] = useState(false)

  const { travelPlan } = useTravelPlanStore()
  const origin = travelPlan?.itinerary[0].places[0].coords
  useEffect(() => {
    const newMarkers: MarkerData[] = travelPlan?.itinerary
      .map(({ places }) => {
        return places.map((place, index) => ({
          id: `${place.name}-${index}`,
          position: place.coords,
          title: place.name,
          description: place.description || ''
        }))
      })
      .flat()
    setMarkers(newMarkers)
    setSelectedMarkerId(newMarkers[0]?.id || null)
    setRoutes([
      {
        ...routesMockData[0],
        path: [...newMarkers.map((marker) => marker.position)]
      }
    ])
    console.log([
      {
        ...routesMockData[0],
        ...newMarkers.map((marker) => marker.position)
      }
    ])
  }, [travelPlan])
  const handleMarkerClick = useCallback((marker: MarkerData) => {
    setSelectedMarkerId(marker.id)
    setShouldCenterOnMarker(true)
  }, [])

  const handleDragStart = () => setShouldCenterOnMarker(false)

  const handleCameraChanged = useCallback(() => {
    setTimeout(() => {
      setShouldCenterOnMarker(false)
    }, 100)
  }, [])

  const selectedMarker = selectedMarkerId
    ? markers.find((m) => m.id === selectedMarkerId)
    : null

  return (
    <div className="mt-[100px] h-[598px] w-full">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}>
        <Map
          mapId="barrier-free-travel-plan"
          className="h-full w-full overflow-hidden rounded-lg shadow-sm"
          defaultZoom={12}
          defaultCenter={origin}
          center={
            selectedMarker && shouldCenterOnMarker && selectedMarker.position
              ? selectedMarker.position
              : undefined
          }
          zoom={selectedMarker && shouldCenterOnMarker ? 14 : undefined}
          onDragstart={handleDragStart}
          onCameraChanged={handleCameraChanged}
          scrollwheel
          zoomControl
          clickableIcons
          keyboardShortcuts
          gestureHandling="greedy"
          disableDefaultUI={false}
          disableDoubleClickZoom={false}
        >
          <Polyline routes={routes} />

          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={marker.position}
              onClick={() => handleMarkerClick(marker)}
            >
              <Pin
                background={
                  selectedMarkerId === marker.id ? '#FF4444' : '#EA4335'
                }
                borderColor="#FFFFFF"
                glyphColor="#FFFFFF"
                scale={selectedMarkerId === marker.id ? 1.3 : 1}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}
