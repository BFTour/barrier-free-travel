import { Place } from '@stores/travelPlanStore'
import { LatLngExpression } from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import { planeIcon, trainIcon } from '../icons'
import { PlanType } from '../type'

interface MapMarkerProps {
  plan: Place
  idx: number
  plans: PlanType[]
}

export default function MapMarker({ plan, idx, plans }: MapMarkerProps) {
  if (idx === 0) return null
  const prev = plans[idx - 1]
  const cur = plan
  const mid: LatLngExpression = [
    (prev.coords[0] + cur.coords[0]) / 2,
    (prev.coords[1] + cur.coords[1]) / 2
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
}
