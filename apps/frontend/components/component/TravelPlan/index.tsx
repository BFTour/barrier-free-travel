'use client'

import { useTravelPlanStore } from '@stores/travelPlanStore'
import React, { useEffect } from 'react'
import PlanSummary from './component/PlanSummary'
import PlanCard from './component/Plancard'

export default function TravelPlan() {
  const { travel, fetchTravel } = useTravelPlanStore()

  useEffect(() => fetchTravel(), [fetchTravel])

  if (!travel) {
    return (
      <div className="flex justify-center py-24">
        여행 계획을 불러오는 중입니다...
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PlanSummary travel={travel} />

      <div className="w-[500px] space-y-2">
        {travel.itinerary.map((day) => (
          <PlanCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  )
}
