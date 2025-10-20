'use client'

import { useTravelPlanStore } from '@stores/travelPlanStore'
import React, { useEffect } from 'react'
import PlanSummary from './component/PlanSummary'
import PlanCard from './component/Plancard'

export default function TravelPlan() {
  const { travelPlan } = useTravelPlanStore()

  if (!travelPlan) return <div>여행 계획을 불러오는 중입니다...</div>

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PlanSummary travel={travelPlan} />

      <div className="w-[500px] space-y-2">
        {travelPlan.itinerary.map((day) => (
          <PlanCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  )
}
