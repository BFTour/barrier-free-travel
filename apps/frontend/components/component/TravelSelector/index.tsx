'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@shadcn/ui'
import { Switch } from 'components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useTravelInfo } from 'stores/travelnfo'
import ErrorMessage from './component/ErrorMessage'
import { countryCityMap, CountryKey, TRAVEL_STYLES } from './constants'
import { FormSchema, FormValues } from './schema'

const defaultClassName = 'flex flex-col gap-2'

export default function TravelSelector() {
  const router = useRouter()
  const [preview, setPreview] = useState<FormValues | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const {
    watch,
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      plans: [],
      travelStyles: [],
      checkAccessibility: false
    },
    mode: 'onTouched'
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'plans'
  })
  const plans = watch('plans')
  const { clearTravelInfo, setTravelInfo } = useTravelInfo((state) => state)

  const onSubmit = (data: FormValues) => {
    setPreview(data)
    setTravelInfo(data)
  }

  const resetData = () => {
    reset()
    setPreview(null)
    clearTravelInfo()
  }

  useEffect(() => {
    plans.forEach((plan, idx) => {
      const availableCities =
        countryCityMap[plan.countries as CountryKey]?.cities ?? []
      if (
        plan.cities &&
        !availableCities.find((c) => c.value === plan.cities)
      ) {
        // 현재 도시는 해당 나라의 도시가 아닐 경우 초기화
        setValue(`plans.${idx}.cities`, availableCities[0]?.value ?? '')
      }
      // country가 비어있으면 city도 공백 처리 가능
      if (!plan.countries) {
        setValue(`plans.${idx}.cities`, '')
      }
    })
  }, [plans, setValue])

  useEffect(() => {
    plans.forEach((plan, idx) => {
      if (idx > 0) {
        const prevEndDate = plans[idx - 1]?.endDate
        if (prevEndDate && plan.startDate !== prevEndDate) {
          setValue(`plans.${idx}.startDate`, prevEndDate)
        }
      }
    })
  }, [plans, setValue])

  return (
    <div className="my-5 w-[1000px] rounded-lg border-2 bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-semibold">여행 계획 만들기</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Plans */}
        <div className="space-y-4">
          <Label>여행 계획</Label>
          {fields.map((field, idx) => {
            const country = (field.countries as CountryKey) || 'KR'
            const availableCities = countryCityMap[country]?.cities ?? []
            const isExpanded = expandedIndex === idx
            return (
              <div
                key={field.id}
                className="rounded-md border border-slate-200"
              >
                {/* Header */}
                <div
                  className="flex cursor-pointer items-center justify-between bg-slate-50 p-3 hover:bg-slate-100"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <span className="font-medium">
                    {field.cities
                      ? `${countryCityMap[country]?.label} - ${
                          availableCities.find((c) => c.value === field.cities)
                            ?.label ?? field.cities
                        }`
                      : `계획 ${idx + 1}`}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    style={{ backgroundColor: '#f6cecc', color: '#285298' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(idx)
                      if (expandedIndex === idx) {
                        setExpandedIndex(null)
                      }
                    }}
                  >
                    삭제
                  </Button>
                </div>
                {/* Body (expand/collapse with animation) */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 p-4">
                        {/* Country */}
                        <div className={defaultClassName}>
                          <Label htmlFor={`plans.${idx}.countries`}>국가</Label>
                          <select
                            id={`plans.${idx}.countries`}
                            {...register(`plans.${idx}.countries`)}
                            className="rounded border px-2 py-1"
                          >
                            <option value="">국가 선택</option>
                            {Object.entries(countryCityMap).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                          <ErrorMessage
                            error={errors.plans?.[idx]?.countries}
                          />
                        </div>
                        {/* City */}
                        <div className={defaultClassName}>
                          <Label htmlFor={`plans.${idx}.cities`}>도시</Label>
                          <select
                            id={`plans.${idx}.cities`}
                            {...register(`plans.${idx}.cities`)}
                            className="rounded border px-2 py-1"
                          >
                            <option value="">도시 선택</option>
                            {availableCities.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                          <ErrorMessage error={errors.plans?.[idx]?.cities} />
                        </div>
                        {/* Dates */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className={defaultClassName}>
                            <Label htmlFor={`plans.${idx}.startDate`}>
                              출발일
                            </Label>
                            <Input
                              type="date"
                              id={`plans.${idx}.startDate`}
                              {...register(`plans.${idx}.startDate`)}
                            />
                            <ErrorMessage
                              error={errors.plans?.[idx]?.startDate}
                            />
                          </div>
                          <div className={defaultClassName}>
                            <Label htmlFor={`plans.${idx}.endDate`}>
                              종료일
                            </Label>
                            <Input
                              type="date"
                              id={`plans.${idx}.endDate`}
                              {...register(`plans.${idx}.endDate`)}
                            />
                            <ErrorMessage
                              error={errors.plans?.[idx]?.endDate}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          <Button
            type="button"
            onClick={() => {
              const newIndex = fields.length
              append({
                countries: 'KR',
                cities: '',
                startDate: '',
                endDate: ''
              })
              setExpandedIndex(newIndex) // 새 계획 열기
            }}
          >
            계획 추가
          </Button>
          <ErrorMessage error={errors.plans} />
        </div>
        {/* Travel styles */}
        <div className={defaultClassName}>
          <Label>여행 스타일 (복수 선택 가능)</Label>
          <div className="flex flex-wrap gap-3">
            {TRAVEL_STYLES.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  id={`style-${t.id}`}
                  type="checkbox"
                  value={t.id}
                  {...register('travelStyles')}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label
                  htmlFor={`style-${t.id}`}
                  className="text-sm text-slate-700"
                >
                  {t.label}
                </label>
              </div>
            ))}
          </div>
          <ErrorMessage error={errors.travelStyles} />
        </div>
        <div className={defaultClassName}>
          <Label>휠체어 사용 여부</Label>
          <Controller
            name="checkAccessibility"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit">미리보기</Button>
          <Button
            type="button"
            className="bg-gray-500 hover:bg-gray-600"
            onClick={resetData}
          >
            초기화
          </Button>
        </div>
      </form>
      {/* Preview */}
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-medium">선택 요약</h2>
        {preview ? (
          <div className="space-y-2 rounded-md border bg-slate-50 p-4">
            {preview.plans.map((p, i) => (
              <div key={i}>
                <p>
                  <strong>국가:</strong>{' '}
                  {countryCityMap[p.countries as CountryKey]?.label ??
                    p.countries}
                </p>
                <p>
                  <strong>도시:</strong>{' '}
                  {Object.values(countryCityMap)
                    .flatMap((cc) => cc.cities)
                    .find((c) => c.value === p.cities)?.label ?? p.cities}
                </p>
                <p>
                  <strong>기간:</strong>{' '}
                  {new Date(p.startDate).toLocaleDateString()} ~{' '}
                  {new Date(p.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
            <p>
              <strong>스타일:</strong>{' '}
              {preview.travelStyles
                .map((s) => TRAVEL_STYLES.find((t) => t.id === s)?.label)
                .join(', ')}
            </p>
            <p>
              <strong>휠체어 접근성 반영:</strong>{' '}
              {preview.checkAccessibility ? 'O' : 'X'}
            </p>
            <Button onClick={() => router.push('/travel-plan')}>
              여행 계획 보기
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            폼을 제출하면 선택한 여행 계획을 미리볼 수 있습니다.
          </p>
        )}
      </div>
    </div>
  )
}
