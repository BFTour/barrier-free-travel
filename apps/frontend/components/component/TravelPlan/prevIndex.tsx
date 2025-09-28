// export default function TravelPlan() {

//   return <></>
// }

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Checkbox } from '@radix-ui/react-checkbox'
import { Label } from '@radix-ui/react-label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from '@radix-ui/react-select'
import { useTravelPlanStore } from '@stores/travelPlanStore'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// export default function TravelPlan() {

//   return <></>
// }

// export default function TravelPlan() {

//   return <></>
// }

const travelSchema = z.object({
  theme: z.string().min(1, '테마를 선택하세요'),
  showAccessible: z.boolean()
})

type TravelFormValues = z.infer<typeof travelSchema>

export default function TravelPlan() {
  // 상태 관리 (여행 계획 전역)
  const { travel, fetchTravel } = useTravelPlanStore()
  // Form 관리
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TravelFormValues>({
    resolver: zodResolver(travelSchema),
    defaultValues: { theme: '', showAccessible: true }
  })

  useEffect(() => {
    fetchTravel()
  }, [fetchTravel])

  const theme = watch('theme')
  const showAccessible = watch('showAccessible')

  if (!travel) {
    return (
      <div className="flex justify-center py-24">
        여행 계획을 불러오는 중입니다...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* 1. 여행 요약 */}
      <div className="flex items-center space-x-4">
        {/* <FlagComponent
          code={travel.countryCode}
          style={{ width: 36, height: 24 }}
        /> */}
        <div>
          <div className="text-xl font-bold">{travel.destination}</div>
          <div className="text-sm text-gray-500">
            {travel.startDate} ~ {travel.endDate} · {travel.theme}
          </div>
        </div>
      </div>

      {/* 2. 필터 */}
      <form
        onSubmit={handleSubmit(() => {})}
        className="mb-2 flex items-center space-x-4 border-b pb-4"
      >
        <Label htmlFor="theme">여행테마</Label>
        <Select value={theme} onValueChange={(val) => setValue('theme', val)}>
          <SelectTrigger className="rounded border px-2 py-1">
            {theme || '테마 선택'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="culture">문화</SelectItem>
            <SelectItem value="food">음식</SelectItem>
            <SelectItem value="nature">자연</SelectItem>
          </SelectContent>
        </Select>
        <Label className="ml-4 flex items-center gap-2">
          <Checkbox
            checked={showAccessible}
            onCheckedChange={(val) => setValue('showAccessible', !!val)}
          />
          휠체어 접근 가능만 보기
        </Label>
      </form>

      {/* 3. 일정 리스트 */}
      <div className="w-[300px] space-y-2">
        {travel.itinerary.map((day, idx) => (
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
              {day.places.map(
                (place) =>
                  (showAccessible ? place.accessible : true) && (
                    <li
                      key={place.name}
                      className={clsx(
                        'flex items-center',
                        place.accessible ? 'text-blue-700' : 'text-gray-600'
                      )}
                    >
                      <span className="mr-2">{place.time}</span>
                      <span>{place.name}</span>
                      {place.accessible && (
                        <span className="ml-2 rounded border border-blue-300 bg-blue-100 px-1 text-xs">
                          배리어프리
                        </span>
                      )}
                    </li>
                  )
              )}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
