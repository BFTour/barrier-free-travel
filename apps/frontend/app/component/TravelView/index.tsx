import TravelPlan from '../TravelPlan'
import TravelSelector from '../TravelSelector'

export default function TravelView() {
  return (
    <section className="flex gap-5">
      <TravelSelector />
      <TravelPlan />
    </section>
  )
}
