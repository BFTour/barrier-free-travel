import L from 'leaflet'
import { Plane, Train } from 'lucide-react'
import ReactDOMServer from 'react-dom/server'

export const trainIcon = L.divIcon({
  html: ReactDOMServer.renderToString(<Train color="#285298" size={28} />),
  className: 'lucide-train-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
})
export const planeIcon = L.divIcon({
  html: ReactDOMServer.renderToString(<Plane color="#285298" size={28} />),
  className: 'lucide-plane-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
})
