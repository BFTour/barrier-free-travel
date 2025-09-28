import { Travel } from '@stores/travelPlanStore'

export default function PlanSummary({ travel }: { travel: Travel }) {
  return (
    <div className="flex flex-col justify-center gap-1">
      <div className="text-xl font-bold">{travel.destination}</div>
      <div className="text-sm text-gray-500">
        {travel.startDate} ~ {travel.endDate} · {travel.theme}
      </div>
    </div>
  )
}
