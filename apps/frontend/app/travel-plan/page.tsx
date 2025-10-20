'use client'

import TravelPlan from '@components/TravelPlan'
import { Travel, useTravelPlanStore } from '@stores/travelPlanStore'
import { useTravelInfo } from '@stores/travelnfo'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import mockResponse from './sample.json'

const TravelMap = dynamic(() => import('@components/TravelMap'), {
  ssr: false
})

const MapWithDirections = dynamic(() => import('@components/GoogleMap'), {
  ssr: false
})

export default function TravelPlanPage() {
  const { travelInfo } = useTravelInfo()
  const { travelPlan, setTravelPlan } = useTravelPlanStore()
  const sample = {
    checkAccessibility: true,
    plans: [
      {
        city: 'busan',
        country: 'KR',
        endDate: '2025-10-22',
        startDate: '2025-10-01'
      }
    ],
    travelStyles: ['culture']
  }

  useEffect(() => {
    if (mockResponse) {
      async function check() {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL || ''
        const res = await fetch(`${base}/check/부산역`)
        const data = await res.json()
        // setTravelPlan(data)
      }
      check()
      setTravelPlan(mockResponse.plans as Travel)
    } else {
      async function fetchPlan() {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL || ''
        const res = await fetch(`${base}/api/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sample, ...sample.plans[0] })
        })
        const data = await res.json()
        // setTravelPlan(data)
      }
      fetchPlan()
    }
  }, [])

  return (
    <div className="flex w-[1000px] gap-5">
      {/* <TravelMap /> */}
      <MapWithDirections />
      <TravelPlan />
    </div>
  )
}
