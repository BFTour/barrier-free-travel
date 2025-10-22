import { Travel } from '@stores/travelPlanStore'

export const mockData: Travel = {
  destination: '부산',
  startDate: '2025-09-25',
  endDate: '2025-09-27',
  theme: '문화',
  itinerary: [
    {
      date: '2025-09-25',
      dayOfWeek: '목',
      places: [
        {
          name: '해운대 해수욕장',
          time: '10:00',
          coords: [35.1587, 129.1604],
          accessible: true,
          description: '휠체어 접근성 매우 양호',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        },
        {
          name: '동백섬 누리마루APEC하우스',
          time: '13:00',
          coords: [35.1554, 129.1453],
          accessible: false,
          description: '산책로/전시관 모두 접근성 높음',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        },
        {
          name: '광안리 해수욕장',
          time: '16:00',
          coords: [35.1535, 129.1186],
          accessible: true,
          description: '해변/산책로, 관광안내소 접근성 양호',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        }
      ]
    },
    {
      date: '2025-09-26',
      dayOfWeek: '금',
      places: [
        {
          name: '감천문화마을',
          time: '10:00',
          coords: [35.0975, 129.0104],
          accessible: false,
          description: '경사가 많아 일부만 접근 가능',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        },
        {
          name: '자갈치시장',
          time: '13:00',
          coords: [35.0972, 129.0369],
          accessible: true,
          description: '주요 통로, 엘리베이터/지하철역 연계 이동 편리',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        },
        {
          name: '부산타워',
          time: '16:00',
          coords: [35.0984, 129.0324],
          accessible: true,
          description: '전망대 휠체어 접근 매우 양호',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        }
      ]
    },
    {
      date: '2025-09-27',
      dayOfWeek: '토',
      places: [
        {
          name: '오륙도 스카이워크',
          time: '10:00',
          coords: [35.0995, 129.1189],
          accessible: true,
          description: '스카이워크/주차장 경사로 완비, 입구 단차 소폭',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        },
        {
          name: '태종대',
          time: '13:00',
          coords: [35.0511, 129.0859],
          accessible: false,
          description: '다누비열차, 전망대 무장애',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        },
        {
          name: '구포무장애숲길',
          time: '16:00',
          coords: [35.2106, 128.9954],
          accessible: true,
          description: '데크 산책로로 정상까지 이동 가능',
          city: '부산',
          country: '대한한국',
          countryCode: 'KR'
        }
      ]
    }
  ]
}
