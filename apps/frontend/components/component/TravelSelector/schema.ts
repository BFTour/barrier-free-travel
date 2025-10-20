import { check, z } from 'zod'
import { TRAVEL_STYLES } from './constants'

export const FormSchema = z.object({
  plans: z
    .array(
      z.object({
        countries: z.enum(['KR', 'JP', 'US', 'FR']),
        cities: z.string(),
        startDate: z
          .string()
          .nonempty('출발일을 선택하세요.')
          .refine(
            (s) => !Number.isNaN(Date.parse(s)),
            '유효한 날짜가 아닙니다.'
          ),
        endDate: z
          .string()
          .nonempty('도착일을 선택하세요.')
          .refine(
            (s) => !Number.isNaN(Date.parse(s)),
            '유효한 날짜가 아닙니다.'
          )
      })
    )
    .min(1, '여행 계획을 하나 이상 추가하세요.')
    .superRefine((plans, ctx) => {
      plans.forEach((plan, idx) => {
        const s = new Date(plan.startDate)
        const e = new Date(plan.endDate)
        if (s > e) {
          ctx.addIssue({
            code: 'custom',
            message: '출발일은 도착일보다 빠르거나 같아야 합니다.',
            path: ['plans', idx, 'startDate']
          })
        }
      })
    }),
  travelStyles: z
    .array(
      z.enum(
        TRAVEL_STYLES.map((t) => t.id) as [
          (typeof TRAVEL_STYLES)[number]['id'],
          ...(typeof TRAVEL_STYLES)[number]['id'][]
        ]
      )
    )
    .min(1, '여행 스타일을 하나 이상 선택하세요.'),
  checkAccessibility: z.boolean().default(false).optional()
})

export type FormValues = z.infer<typeof FormSchema>
