import { FormValues } from 'components/component/TravelSelector/schema'
import { create } from 'zustand'

export const initialState = {
  plans: [],
  checkAccessibility: false,
  travelStyles: []
}

interface TravelInfoStore {
  travelInfo: FormValues
  setTravelInfo: (info: Partial<FormValues>) => void
  clearTravelInfo: () => void
}
export const useTravelInfo = create<TravelInfoStore>((set) => ({
  travelInfo: initialState,
  setTravelInfo: (info: Partial<FormValues>) =>
    set((state) => ({
      ...state,
      travelInfo: { ...state.travelInfo, ...info }
    })),
  clearTravelInfo: () => set({ travelInfo: initialState })
}))
