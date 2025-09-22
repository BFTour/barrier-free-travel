'use client'

import dynamic from 'next/dynamic'

const TravelMap = dynamic(() => import('./component/TravelMap'), {
  ssr: false
})

export default function TravelPlan() {
  return (
    <div className="w-[1000px]">
      <TravelMap />
    </div>
  )
}
