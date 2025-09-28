import * as Flags from 'country-flag-icons/react/3x2'
import L from 'leaflet'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

export const countryNameCodeMap = {
  대한민국: 'KR',
  일본: 'JP',
  미국: 'US',
  프랑스: 'FR',
  영국: 'GB',
  독일: 'DE',
  이탈리아: 'IT',
  스페인: 'ES'
}

export const mapFlagIcon = (countryName: string) => {
  const countryCode = countryNameCodeMap[countryName] || 'KR'
  const FlagComponent = Flags[countryCode.toUpperCase() as keyof typeof Flags]
  const svgString = ReactDOMServer.renderToString(
    React.createElement(FlagComponent, {
      title: countryCode,
      style: { width: '32px', height: '20px' }
    })
  )

  return L.divIcon({
    html: svgString,
    className: `circle-flag-icon-${countryCode}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  })
}
