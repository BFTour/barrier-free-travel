'use client'

import TravelPlan from '@components/TravelPlan'
import dynamic from 'next/dynamic'

const TravelMap = dynamic(() => import('@components/TravelMap'), {
  ssr: false
})

export default function TravelPlanPage() {
  
  return (
    <div className="flex w-[1000px] gap-5">
      <TravelMap />
      <TravelPlan />
    </div>
  )
}
