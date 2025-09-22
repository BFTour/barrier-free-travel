export interface Coordinates {
  lat: number
  lon: number
}

export async function fetchCoordinates(
  city: string,
  country?: string
): Promise<Coordinates | null> {
  const query = country ? `${city}, ${country}` : city
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': `NextTravelApp/1.0 (your-email@example.com) ${process.env.NOMINATIM_KEY}` // 필수!
      }
    })

    if (!res.ok) {
      console.error('Nominatim API error:', res.statusText)
      return null
    }

    const data = await res.json()
    if (data.length === 0) return null

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    }
  } catch (err) {
    console.error('Failed to fetch coordinates:', err)
    return null
  }
}
