export const countryCityMap: Record<
  CountryKey,
  { label: string; cities: { value: string; label: string }[] }
> = {
  KR: {
    label: '대한민국',
    cities: [
      { value: 'seoul', label: '서울' },
      { value: 'busan', label: '부산' },
      { value: 'jeju', label: '제주' }
    ]
  },
  JP: {
    label: '일본',
    cities: [
      { value: 'tokyo', label: '도쿄' },
      { value: 'kyoto', label: '교토' },
      { value: 'osaka', label: '오사카' }
    ]
  },
  US: {
    label: '미국',
    cities: [
      { value: 'nyc', label: '뉴욕' },
      { value: 'la', label: '로스앤젤레스' },
      { value: 'sf', label: '샌프란시스코' }
    ]
  },
  FR: {
    label: '프랑스',
    cities: [
      { value: 'paris', label: '파리' },
      { value: 'lyon', label: '리옹' },
      { value: 'nice', label: '니스' }
    ]
  }
} as const
export type CountryKey = 'KR' | 'JP' | 'US' | 'FR'

export const TRAVEL_STYLES = [
  { id: 'relax', label: '휴식' },
  { id: 'adventure', label: '모험' },
  { id: 'culture', label: '문화/역사' },
  { id: 'food', label: '미식' },
  { id: 'nature', label: '자연' }
] as const
