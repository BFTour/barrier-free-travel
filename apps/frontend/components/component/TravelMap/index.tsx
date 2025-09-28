'use client'

import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import MapMarker from './component/MapMarker'
import { mockData } from './constants'
import { PlanType } from './type'
import { mapFlagIcon } from './utils'

// TODO: add loading state
export default function TravelMap() {
  const plans: PlanType[] = mockData.itinerary
    .map((plan) =>
      plan.places.map((place) => ({
        startDate: plan.date,
        endDate: plan.date,
        ...place
      }))
    )
    .flat()

  if (plans.length === 0) {
    return (
      <p className="mt-10 text-center text-slate-600">
        저장된 여행 계획이 없습니다.
      </p>
    )
  }

  // 지도 중심을 첫 번째 도시로
  const center: [number, number] = plans[0].coords as [number, number]
  const positions = plans.map((p) => p.coords) as LatLngExpression[]

  return (
    <div className="h-[692px] w-full pt-[96px]">
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
            position={plan.coords as [number, number]}
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
              </div>
            </Popup>
          </Marker>
        ))}

        <Polyline positions={positions} pathOptions={{ color: '#285298' }} />

        {plans.map((plan, idx) => (
          <MapMarker key={idx} plan={plan} idx={idx} plans={plans} />
        ))}
      </MapContainer>
    </div>
  )
}
