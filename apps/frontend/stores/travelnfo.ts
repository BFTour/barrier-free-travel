import { fetchCoordinates } from '@lib/utils/geocode'
import { FormValues } from 'components/component/TravelSelector/schema'
import { countries } from 'country-flag-icons'
import { create } from 'zustand'

export const initialState = {
  plans: [{ countries: [], cities: [], startDate: '', endDate: '' }],
  travelStyles: []
}

interface TravelInfoStore extends FormValues {
  setTravelInfo: (info: Partial<FormValues>) => void
  clearTravelInfo: () => void
}
export const useTravelInfo = create<TravelInfoStore>((set) => ({
  ...initialState,
  setTravelInfo: (info: Partial<FormValues>) =>
    set((state) => ({ ...state, ...info })),
  clearTravelInfo: () => set({ ...initialState })
}))
