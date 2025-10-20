export const markerMockData = [
  {
    id: '1',
    position: { lat: 37.7749, lng: -122.4194 },
    title: 'San Francisco',
    description: '시작점'
  },
  {
    id: '2',
    position: { lat: 37.7849, lng: -122.4094 },
    title: 'Destination 1',
    description: '첫 번째 목적지'
  },
  {
    id: '3',
    position: { lat: 37.7649, lng: -122.4294 },
    title: 'Destination 2',
    description: '두 번째 목적지'
  }
]

export const routesMockData = [
  {
    id: 'route1',
    path: [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.7849, lng: -122.4094 },
      { lat: 37.7649, lng: -122.4294 }
    ],
    color: '#285298',
    strokeWeight: 3
  }
]
