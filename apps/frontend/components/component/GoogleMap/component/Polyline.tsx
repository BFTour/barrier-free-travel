import { useMap } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'
import { RouteData } from '../type'

export default function Polyline({ routes }: { routes: RouteData[] }) {
  const map = useMap()
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([])

  useEffect(() => {
    if (!map) return

    polylines.forEach((polyline) => polyline.setMap(null))

    const newPolylines: google.maps.Polyline[] = []

    routes.forEach((route) => {
      const polyline = new google.maps.Polyline({
        path: route.path,
        geodesic: true,
        strokeColor: route.color || '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: route.strokeWeight || 2
      })

      polyline.setMap(map)
      newPolylines.push(polyline)
    })

    setPolylines(newPolylines)

    return () => {
      newPolylines.forEach((polyline) => polyline.setMap(null))
    }
  }, [map, routes])

  return null
}
