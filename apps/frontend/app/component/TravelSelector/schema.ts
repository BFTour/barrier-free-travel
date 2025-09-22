import { z } from 'zod'
import { TRAVEL_STYLES } from './constants'

export const FormSchema = z
  .object({
    countries: z
      .array(z.enum(['KR', 'JP', 'US', 'FR']))
      .min(1, '국가를 하나 이상 선택하세요.'),
    cities: z.array(z.string()).min(1, '도시를 하나 이상 선택하세요.'),
    startDate: z
      .string()
      .nonempty('출발일을 선택하세요.')
      .refine((s) => !Number.isNaN(Date.parse(s)), '유효한 날짜가 아닙니다.'),
    endDate: z
      .string()
      .nonempty('도착일을 선택하세요.')
      .refine((s) => !Number.isNaN(Date.parse(s)), '유효한 날짜가 아닙니다.'),
    travelStyles: z
      .array(
        z.enum(
          TRAVEL_STYLES.map((t) => t.id) as [
            (typeof TRAVEL_STYLES)[number]['id'],
            ...(typeof TRAVEL_STYLES)[number]['id'][]
          ]
        )
      )
      .min(1, '여행 스타일을 하나 이상 선택하세요.')
  })
  .superRefine((val, ctx) => {
    const s = new Date(val.startDate)
    const e = new Date(val.endDate)
    if (s > e) {
      ctx.addIssue({
        code: 'custom',
        message: '출발일은 도착일보다 빠르거나 같아야 합니다.',
        path: ['startDate']
      })
    }
  })

export type FormValues = z.infer<typeof FormSchema>
