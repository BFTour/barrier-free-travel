const { OpenAI } = require("openai");
const { checkWheelchairAccessibility } = require('./map');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. 여행 계획 생성을 위한 JSON 스키마 (Function Calling Tool)
const tripPlanSchema = {
  name: "create_detailed_trip_plan", // 필수
  description: "사용자의 조건에 맞춘 상세한 배리어프리 여행 계획을 JSON 형식으로 생성합니다.",
  type: "function", // ✅ type 명시
  parameters: {
    type: "object",
    properties: {
      tripTitle: { type: "string" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string" },
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  placeName: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string", enum: ["관광지","식당","카페","교통수단","숙박","기타"] }
                },
                required: ["time","placeName","description","type"]
              }
            }
          },
          required: ["date","activities"]
        }
      }
    },
    required: ["tripTitle","days"]
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
        **가장 중요**: 사용자가 휠체어 사용자이므로, 모든 장소는 휠체어 접근성이 확실히 보장되는 곳으로 선정해야 합니다.
        장소 이름은 Google Maps에서 정확히 검색 가능해야 합니다.
        
        여행 조건:
        - 기간: ${startDate}부터 ${endDate}까지
        - 여행 스타일: ${travelStyle}
        - 접근성: ${isBarrierFree}
        
        응답은 반드시 'create_detailed_trip_plan' 함수를 사용하여 JSON 형식으로 반환하세요.`;
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
            { role: "user", content: "여행 계획 생성 요청" }
            ],
            tools: [tripPlanSchema], // ✅ 배열로 제공
            tool_choice: "auto",      // ✅ 이렇게 변경
            temperature: 0.5,
        });
                // response.output[0]가 바로 function_call 객체임
        const functionCall = response.output?.[0];

        if (!functionCall || functionCall.type !== "function_call") {
        console.log("전체 GPT 응답:", JSON.stringify(response, null, 2));
        throw new Error("함수 호출(tool_call)을 찾을 수 없습니다.");
        }

        // arguments는 문자열이므로 JSON.parse 필요
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

    for (const day of currentPlan.days) {
        for (const activity of day.activities) {
            if (['관광지', '식당', '카페'].includes(activity.type)) {
                const checkResult = await checkWheelchairAccessibility(activity.placeName);

                if (!checkResult.isAccessible) {
                    console.log(`[❌ 불합격] ${day.date} - ${activity.placeName} (${checkResult.reason})`);
                    placesToReplace.push({
                        date: day.date,
                        originalPlace: activity.placeName,
                        type: activity.type
                    });
                } else {
                    console.log(`[✅ 합격] ${day.date} - ${activity.placeName}`);
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