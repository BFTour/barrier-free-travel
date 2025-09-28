import { Place } from '@stores/travelPlanStore'
import clsx from 'clsx'

export default function PlanCardContent({ place }: { place: Place }) {
  return (
    <li
      key={place.name}
      className="grid grid-cols-[auto_1fr_auto] items-start gap-x-2 text-gray-600"
    >
      <span className="mr-2">{place.time}</span>
      <span
        className={clsx(
          'font-semibold',
          place.accessible ? 'text-[#285298]' : 'text-[#f6cecc]'
        )}
      >
        {place.name}
      </span>
      {place.accessible && (
        <span className="ml-2 rounded border border-blue-600 bg-blue-100 px-1 text-xs">
          배리어프리
        </span>
      )}
      <p className="col-span-2 col-start-2 text-xs">{place.description}</p>
    </li>
  )
}
