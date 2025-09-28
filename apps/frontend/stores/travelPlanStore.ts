import { mockData } from '@components/TravelMap/constants'
import { create } from 'zustand'

export interface Place {
  name: string
  time?: string
  city: string
  country: string
  countryCode: string
  coords: [number, number]
  accessible: boolean
  description?: string
}

export interface DayPlan {
  date: string
  dayOfWeek: string
  places: Place[]
}

export type Travel = {
  destination: string
  startDate: string
  endDate: string
  theme: string
  itinerary: DayPlan[]
}

interface TravelStore {
  travel: Travel | null
  selectedCoords: [number, number] | null
  fetchTravel: () => void
  setSelectedCoords: (coords: [number, number]) => void
}

export const useTravelPlanStore = create<TravelStore>((set) => ({
  travel: null,
  selectedCoords: null,
  fetchTravel: () => set({ travel: mockData }),
  setSelectedCoords: (coords: [number, number]) =>
    set({ selectedCoords: coords })
}))
