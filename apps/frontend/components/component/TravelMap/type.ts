import { Place } from "@stores/travelPlanStore"

export interface PlanType extends Place {
  startDate: string
  endDate: string
}
