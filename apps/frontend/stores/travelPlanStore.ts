import { mockData } from '@components/TravelMap/constants'
import { create } from 'zustand'

export interface Place {
  name: string
  time?: string
  city: string
  country: string
  countryCode: string
  coords: { lat: number; lng: number }
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
  travelPlan: Travel | null
  setTravelPlan: (travel: Travel) => void
}

export const useTravelPlanStore = create<TravelStore>((set) => ({
  travelPlan: null,
  setTravelPlan: (travel: Travel) => set({ travelPlan: travel })
}))
