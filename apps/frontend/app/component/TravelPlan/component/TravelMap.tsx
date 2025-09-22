'use client'

import * as Flags from 'country-flag-icons/react/3x2'
import { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plane, Train } from 'lucide-react'
import ReactDOMServer from 'react-dom/server'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import { useTravelInfo } from 'stores/travelnfo'
import { countryNameCodeMap } from './utils'
import { mockPlans } from './constants'

export default function TravelMap() {
  const { countries, cities, startDate, endDate, travelStyles } =
    useTravelInfo()
  const plans = mockPlans
  if (plans.length === 0) {
    return (
      <p className="mt-10 text-center text-slate-600">
        저장된 여행 계획이 없습니다.
      </p>
    )
  }

  // 지도 중심을 첫 번째 도시로
  const center: [number, number] = plans[0].coordinates as [number, number]
  const positions = plans.map((p) => p.coordinates) as LatLngExpression[]

  return (
    <div className="h-[600px] w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full rounded-lg shadow"
      >
        <TileLayer
          // attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {plans.map((plan, idx) => (
          <Marker
            key={idx}
            position={plan.coordinates as [number, number]}
            icon={mapFlagIcon(plan.country)}
          >
            <Popup>
              <div>
                <p className="font-bold">
                  {plan.city}, {plan.country}
                </p>
                <p>
                  {plan.startDate} ~ {plan.endDate}
                </p>
                <p>스타일: {plan.styles.join(', ')}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        <Polyline positions={positions} pathOptions={{ color: '#285298' }} />

        {plans.map((plan, idx) => {
          if (idx === 0) return null
          const prev = plans[idx - 1]
          const cur = plan
          const mid: LatLngExpression = [
            (prev.coordinates[0] + cur.coordinates[0]) / 2,
            (prev.coordinates[1] + cur.coordinates[1]) / 2
          ]
          const international = prev.country !== cur.country

          return (
            <Marker
              key={`move-${idx}`}
              position={mid}
              icon={international ? planeIcon : trainIcon}
            >
              <Popup>
                {international
                  ? `${prev.city} (${prev.country}) → ${cur.city} (${cur.country}) 비행 이동`
                  : `${prev.city} → ${cur.city} 국내 이동`}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

const planeIcon = L.divIcon({
  html: ReactDOMServer.renderToString(<Plane color="#285298" size={32} />),
  className: 'lucide-plane-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
})

const trainIcon = L.divIcon({
  html: ReactDOMServer.renderToString(<Train color="#F6CECC" size={28} />),
  className: 'lucide-train-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
})

const mapFlagIcon = (countryName: string) => {
  const countryCode = countryNameCodeMap[countryName].toLowerCase()
  const FlagComponent = Flags[countryCode.toUpperCase() as keyof typeof Flags]
  const svgString = ReactDOMServer.renderToString(
    <FlagComponent
      title={countryCode}
      style={{ width: '32px', height: '20px' }}
    />
  )

  return L.divIcon({
    html: svgString,
    className: `circle-flag-icon-${countryCode}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  })
}
