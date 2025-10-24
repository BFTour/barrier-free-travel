'use client'

import TravelPlan from '@components/TravelPlan'
import { useTravelPlanStore } from '@stores/travelPlanStore'
import { useTravelInfo } from '@stores/travelnfo'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
// import mockResponse from './sample.json'

const TravelMap = dynamic(() => import('@components/TravelMap'), {
  ssr: false
})

const MapWithDirections = dynamic(() => import('@components/GoogleMap'), {
  ssr: false
})

export default function TravelPlanPage() {
  const { travelInfo } = useTravelInfo()
  const { setTravelPlan } = useTravelPlanStore()
  const [loading, setLoading] = useState(false)

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
    // For testing purposes
    // if (mockResponse) {
    //   setTravelPlan(mockResponse.plans as Travel)
    //   return
    // }
    setLoading(true)
    async function fetchPlan() {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || ''
      const res = await fetch(`${base}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sample, ...sample.plans[0] })
      })
      const data = await res.json()
      console.log('Fetched travel plan:', data)
      setTravelPlan(data.plan)
    }
    fetchPlan()
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex w-[1000px] gap-5">
      {/* <TravelMap /> */}
      {loading ? (
        <div className="flex items-center justify-center">
          여행 계획을 불러오는 중입니다...
        </div>
      ) : (
        <>
          <MapWithDirections />
          <TravelPlan />
        </>
      )}
    </div>
  )
}
