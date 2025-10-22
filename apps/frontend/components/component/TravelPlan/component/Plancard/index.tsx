import { DayPlan } from '@stores/travelPlanStore'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { P } from 'framer-motion/dist/types.d-DsEeKk6G'
import PlanCardContent from './PlanCardContent'

export default function PlanCard({ day }: { day: DayPlan }) {
  return (
    <motion.div
      layout
      key={day.date}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="rounded-lg border bg-white p-4 shadow-sm"
    >
      <div className="mb-2 font-semibold">
        {day.date} ({day.dayOfWeek})
      </div>
      <ul className="space-y-1">
        {day.places.map((place) => (
          <PlanCardContent key={`${place.name}-${place.time}`} place={place} />
        ))}
      </ul>
    </motion.div>
  )
}
