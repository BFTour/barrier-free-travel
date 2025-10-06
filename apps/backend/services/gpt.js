const { OpenAI } = require("openai");
const { checkWheelchairAccessibility } = require('./map');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. 여행 계획 생성을 위한 JSON 스키마 (Function Calling Tool)
const tripPlanSchema = {
  name: "create_barrier_free_trip_plan",
  description: "사용자의 조건에 맞춘 배리어프리 여행 계획을 프론트엔드 Travel 타입 구조로 JSON 형식으로 생성합니다.",
  type: "function",
  parameters: {
    type: "object",
    properties: {
      destination: { type: "string", description: "여행 목적지 이름 (예: '뉴욕')" },
      startDate: { type: "string", description: "여행 시작일 (YYYY-MM-DD 형식)" },
      endDate: { type: "string", description: "여행 종료일 (YYYY-MM-DD 형식)" },
      theme: { type: "string", description: "여행의 주제나 성격 (예: '문화', '자연', '맛집')" },
      itinerary: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "해당 일정의 날짜 (YYYY-MM-DD)" },
            dayOfWeek: { type: "string", description: "요일 (예: 월, 화, 수...)" },
            places: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "장소 이름 (Google Maps에서 검색 가능해야 함)" },
                  time: { type: "string", description: "방문 시간 (HH:mm 형식)" },
                  coords: { 
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 2,
                    description: "[위도, 경도]"
                  },
                  accessible: { type: "boolean", description: "휠체어 접근성 여부 (true/false)" },
                  description: { 
                    type: "string",
                    description: "해당 장소의 휠체어 접근성에 대한 설명 (예: '입구 경사로와 장애인 화장실이 완비되어 있음')"
                  },
                  city: { type: "string" },
                  country: { type: "string" },
                  countryCode: { type: "string" }
                },
                required: ["name", "time", "coords", "accessible", "description", "city", "country", "countryCode"]
              }
            }
          },
          required: ["date", "dayOfWeek", "places"]
        }
      }
    },
    required: ["destination", "startDate", "endDate", "theme", "itinerary"]
  }
};

async function generateTripPlan(userData, mode = 'initial', refinementContext = '') {
    const { country, city, startDate, endDate, travelStyle, isWheelchairUser } = userData;
    const isBarrierFree = isWheelchairUser
        ? '휠체어 접근성을 최우선으로 고려해야 합니다.'
        : '일반적인 장소를 추천합니다.';

    let systemMessage = '';

    if (mode === 'initial') {
        systemMessage = `당신은 장애인의 해외여행을 전문적으로 지원하는 최고 수준의 AI 여행 플래너입니다.
        사용자의 요구사항에 맞춰 ${country}, ${city}에 대한 상세하고 실현 가능한 여행 계획을 생성하세요.
        응답은 반드시 'create_detailed_trip_plan' 함수를 사용하여 JSON 형식으로 반환하세요.
        
        조건:
        - 기간: ${startDate}부터 ${endDate}까지
        - 도시: ${city}, 국가: ${country}
        - 여행 스타일: ${travelStyle}
        - 접근성: ${isBarrierFree}
        - 모든 장소는 Google Maps에서 검색 가능한 실제 위치여야 합니다.
        - description에는 장소의 휠체어 접근성과 편의시설(장애인 화장실, 엘리베이터, 진입로 등)에 대한 정보를 구체적으로 서술하세요.`;
        
    } else {
        systemMessage = `당신은 AI 여행 플래너입니다. 기존 계획에서 휠체어 접근성이 확인되지 않은 장소들을 대체해야 합니다.
        **가장 중요**: ${city}에서 원래 장소의 성격에 맞는, 휠체어 접근성이 **확실히 보장되는** 새로운 장소로 대체해 주세요.
        새로운 장소 이름은 Google Maps에서 정확히 검색 가능해야 하며, 기존 계획의 시간대와 구조를 최대한 유지해야 합니다.
        
        대체할 장소 목록:
        ${refinementContext}
        
        응답은 반드시 'create_detailed_trip_plan' 함수를 사용하여 JSON 형식으로 반환하세요.`;
    }

    try {
        const response = await openai.responses.create({
            model: "gpt-4.1", // 또는 gpt-5
            input: [
            { role: "system", content: systemMessage },
            { role: "user", content: "배리어프리 여행 계획 생성 요청" }
            ],
            tools: [tripPlanSchema],
            tool_choice: "auto",
            temperature: 0.5,
        });
        const functionCall = response.output?.[0];

        if (!functionCall || functionCall.type !== "function_call") {
        console.log("전체 GPT 응답: ", JSON.stringify(response, null, 2));
        throw new Error("함수 호출(tool_call)을 찾을 수 없습니다.");
        }

        const tripPlan = JSON.parse(functionCall.arguments);
        return tripPlan;
    } catch (error) {
        console.error(`GPT API 호출 오류 (${mode} 모드):`, error);
        throw new Error('여행 계획 생성에 실패했습니다. 다시 시도해 주세요.');
    }
}

async function validateAndRefineTripPlan(initialPlan, userData) {
    if (!userData.isWheelchairUser) {
        console.log('휠체어 사용자가 아니므로 접근성 검증을 건너뜁니다.');
        return initialPlan;
    }

    console.log('--- 휠체어 접근성 검증 시작 ---');
    let currentPlan = initialPlan;
    let placesToReplace = [];

    for (const day of currentPlan.itinerary) {
      for (const place of day.places) {
        if (place.accessible === false) {
          console.log(`[❌ 불합격] ${day.date} - ${place.name} (접근성 false로 표시됨)`);
          placesToReplace.push({
            date: day.date,
            originalPlace: place.name,
          });
        } else {
          // accessible이 true면 API 검증도 시도
          const checkResult = await checkWheelchairAccessibility(place.name);
          if (!checkResult.isAccessible) {
            console.log(`[❌ 불합격] ${day.date} - ${place.name} (${checkResult.reason})`);
            placesToReplace.push({
              date: day.date,
              originalPlace: place.name,
            });
          } else {
            console.log(`[✅ 합격] ${day.date} - ${place.name}`);
          }
        }
      }
    }

    if (placesToReplace.length > 0) {
        const refinementContext = `접근성이 낮아 대체해야 할 장소: ${JSON.stringify(placesToReplace)}. 기존 여행 계획: ${JSON.stringify(initialPlan)}`;

        console.log(`\n--- ${placesToReplace.length}개 장소 대체 요청 ---`);
        const refinedPlan = await generateTripPlan(userData, 'refine', refinementContext);
        console.log('--- 계획 수정 완료 ---');
        return refinedPlan;
    }

    console.log('--- 휠체어 접근성 검증 완료. 수정 필요 없음 ---');
    return currentPlan;
}

module.exports = {
    generateTripPlan,
    validateAndRefineTripPlan
};