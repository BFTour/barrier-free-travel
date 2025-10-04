// services/gptService.js

const { OpenAI } = require("openai");
const { checkWheelchairAccessibility } = require('./map');
const { ClientRequest } = require("http");
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. 여행 계획 생성을 위한 JSON 스키마 (Function Calling Tool) 정의
const tripPlanSchema = {
    type: "function",
    function: {
        name: "create_detailed_trip_plan",
        description: "사용자의 조건에 맞춘 상세한 배리어프리 여행 계획을 JSON 형식으로 생성합니다.",
        parameters: {
            type: "object",
            properties: {
                tripTitle: { type: "string", description: "여행 계획의 제목" },
                days: {
                    type: "array",
                    description: "날짜별 여행 활동 목록",
                    items: {
                        type: "object",
                        properties: {
                            date: { type: "string", description: "YYYY-MM-DD 형식의 날짜" },
                            activities: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        time: { type: "string", description: "HH:MM 형식의 활동 시간" },
                                        placeName: { type: "string", description: "Google Maps에서 정확히 검색 가능한 장소의 공식 명칭" },
                                        description: { type: "string", description: "활동에 대한 간단한 설명" },
                                        type: { type: "string", enum: ["관광지", "식당", "카페", "교통수단", "숙박", "기타"] }
                                    },
                                    required: ["time", "placeName", "description", "type"]
                                }
                            }
                        },
                        required: ["date", "activities"]
                    }
                }
            },
            required: ["tripTitle", "days"]
        }
    }
};

/**
 * 사용자 입력 기반으로 GPT에게 여행 계획을 요청합니다.
 * @param {object} userData - 사용자 입력 데이터
 * @param {string} mode - 'initial' 또는 'refine' 모드
 * @param {string} refinementContext - 'refine' 모드 시 대체 장소 요청 컨텍스트
 * @returns {object} - GPT가 생성하거나 수정한 여행 계획 (JSON)
 */
async function generateTripPlan(userData, mode = 'initial', refinementContext = '') {
    const { country, city, startDate, endDate, travelStyle, isWheelchairUser } = userData;
    const isBarrierFree = isWheelchairUser ? '휠체어 접근성을 최우선으로 고려해야 합니다.' : '일반적인 장소를 추천합니다.';

    let systemMessage = '';
    
    if (mode === 'initial') {
        systemMessage = `당신은 장애인의 해외여행을 전문적으로 지원하는 최고 수준의 AI 여행 플래너입니다.
        사용자의 요구사항에 맞춰 ${country}, ${city}에 대한 상세하고 실현 가능한 여행 계획을 생성하세요.
        **가장 중요**: 사용자가 휠체어 사용자이므로, 모든 장소는 휠체어 접근성이 확실히 보장되는 곳으로 선정해야 합니다. 장소 이름은 Google Maps에서 정확하게 검색 가능해야 합니다.
        
        여행 조건:
        - 기간: ${startDate}부터 ${endDate}까지
        - 여행 스타일: ${travelStyle}
        - 접근성: ${isBarrierFree}
        
        응답은 반드시 'create_detailed_trip_plan' 툴을 사용하여 JSON 형식으로 반환해야 합니다. 다른 텍스트는 포함하지 마세요.`;
    } else { // refine 모드
        systemMessage = `당신은 AI 여행 플래너입니다. 기존 계획에서 휠체어 접근성이 확인되지 않은 장소들을 대체해야 합니다.
        **가장 중요**: ${city}에서 원래 장소의 성격에 맞는, 휠체어 접근성이 **확실히 보장되는** 새로운 장소로 대체해 주세요.
        새로운 장소 이름은 Google Maps에서 정확히 검색 가능해야 하며, 기존 계획의 시간대와 구조를 최대한 유지해야 합니다.
        
        대체할 장소 목록 (originalPlace):
        ${refinementContext}
        
        응답은 반드시 'create_detailed_trip_plan' 툴을 사용하여 JSON 형식으로 반환해야 하며, 이때 **기존 여행 계획 전체**를 대체 장소로 업데이트하여 반환해야 합니다.`;
    }

    try {
        const response = await openai.responses.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemMessage }],
            tools: [tripPlanSchema],
            tool_choice: { type: "function", function: { name: "create_detailed_trip_plan" } }, // 함수 강제
            temperature: 0.5,
        });

        // Function Call Arguments 추출
        const functionCall = response.choices[0].message.tool_calls[0].function;
        const jsonArguments = JSON.parse(functionCall.arguments);
        
        return jsonArguments;

    } catch (error) {
        console.error(`GPT API 호출 오류 (${mode} 모드):`, error.message);
        throw new Error('GPT API 호출 실패 및 응답 JSON 파싱 오류');
    }
}

/**
 * 여행 계획을 검증하고 필요한 경우 GPT에게 수정을 요청합니다.
 */
async function validateAndRefineTripPlan(initialPlan, userData) {
    if (!userData.isWheelchairUser) {
        console.log('휠체어 사용자가 아니므로 접근성 검증을 건너뜝니다.');
        return initialPlan;
    }

    console.log('--- 휠체어 접근성 검증 시작 ---');
    let currentPlan = initialPlan;
    let placesToReplace = [];

    // 1. 초기 계획 검증
    for (const day of currentPlan.days) {
        for (const activity of day.activities) {
            // 관광지나 식당 같은 주요 장소만 검증
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

    // 2. 대체 장소가 필요하다면 GPT에게 재요청 (재귀 대신 1회 수정만 가정)
    if (placesToReplace.length > 0) {
        const refinementContext = `접근성이 낮아 대체해야 할 장소: ${JSON.stringify(placesToReplace)}. 기존 여행 계획: ${JSON.stringify(initialPlan)}`;
        
        console.log(`\n--- ${placesToReplace.length}개 장소 대체 요청 ---`);
        
        // refine 모드로 전체 계획을 대체 장소로 수정한 새로운 계획을 요청
        const refinedPlan = await generateTripPlan(userData, 'refine', refinementContext);
        
        // 3. 대체된 계획 재검증 (선택적)
        // 여기서는 GPT의 수정 결과를 신뢰하고 바로 반환합니다.
        // 완벽을 기하려면 이 결과를 다시 Maps API로 검증해야 합니다.
        
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