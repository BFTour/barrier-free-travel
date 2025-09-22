'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@shadcn/ui'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  initialState as initialTravleInfo,
  useTravelInfo
} from 'stores/travelnfo'
import ErrorMessage from './component/ErrorMessage'
import { countryCityMap, CountryKey, TRAVEL_STYLES } from './constants'
import { FormSchema, FormValues } from './schema'

export default function TravelSelector() {
  const [preview, setPreview] = useState<FormValues | null>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialTravleInfo,
    mode: 'onTouched'
  })

  // 선택된 country/city 값 관리(옵션)
  const selectedCountries = watch('countries')
  const { clearTravelInfo, setTravelInfo } = useTravelInfo((state) => state)
  const availableCities = useMemo(() => {
    return selectedCountries?.flatMap(
      (code: CountryKey) => countryCityMap[code].cities
    )
  }, [selectedCountries])

  const onSubmit = (data: FormValues) => {
    setPreview(data)
    setTravelInfo(data)
  }

  const resetData = () => {
    reset()
    setPreview(null)
    clearTravelInfo()
  }

  const defaultClassName = 'flex flex-col gap-2'

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-semibold">여행 계획 만들기</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Country (checkbox) */}
        <div className={defaultClassName}>
          {/* TODO: Make multi-select */}
          <Label>국가</Label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(countryCityMap).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={k}
                  {...register('countries')}
                  id={`country-${k}`}
                  className="h-4 w-4"
                />
                <label htmlFor={`country-${k}`}>{v.label}</label>
              </div>
            ))}
          </div>
          <ErrorMessage error={errors.countries} />
        </div>

        {/* City (checkbox) */}
        <div className={`${defaultClassName} transition-all duration-300`}>
          <Label>도시 (복수 선택 가능)</Label>
          <div className="flex flex-col gap-3">
            {availableCities?.map((c) => {
              const isChecked = watch('cities')?.includes(c.value)
              return (
                <div key={c.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={c.value}
                    {...register('cities')}
                    id={`city-${c.value}`}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`city-${c.value}`}>{c.label}</label>
                  {/* Dates */}
                  <div
                    className={`grid grid-cols-1 gap-4 transition-all duration-300 sm:grid-cols-2 ${isChecked ? 'max-h-[200px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'}`}
                  >
                    {['startDate', 'endDate'].map(
                      (dateType: 'startDate' | 'endDate') => (
                        <div key={dateType} className={defaultClassName}>
                          <Label htmlFor={dateType}>
                            {dateType === 'startDate' ? '출발일' : '종료일'}
                          </Label>
                          <Input
                            id={dateType}
                            type="date"
                            {...register(dateType)}
                          />
                          <ErrorMessage error={errors[dateType]} />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <ErrorMessage error={errors.cities} />
        </div>

        {/* Travel styles (checkbox) */}
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
          <div className="rounded-md border bg-slate-50 p-4">
            <p>
              <strong>국가:</strong>{' '}
              {preview.countries
                .map((k) => countryCityMap[k as CountryKey].label)
                .join(', ')}
            </p>
            <p>
              <strong>도시:</strong>{' '}
              {preview.cities
                .map(
                  (c) =>
                    Object.values(countryCityMap)
                      .flatMap((cc) => cc.cities)
                      .find((city) => city.value === c)?.label ?? c
                )
                .join(', ')}
            </p>
            <p>
              <strong>기간:</strong>{' '}
              {new Date(preview.startDate).toLocaleDateString()} ~{' '}
              {new Date(preview.endDate).toLocaleDateString()}
            </p>
            <p>
              <strong>스타일:</strong>{' '}
              {preview.travelStyles
                .map((s) => TRAVEL_STYLES.find((t) => t.id === s)?.label)
                .join(', ')}
            </p>
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
