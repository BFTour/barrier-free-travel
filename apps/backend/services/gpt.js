const { OpenAI } = require("openai");
const { checkWheelchairAccessibility } = require('./map');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 장애 유형 정의 (14가지)
const DISABILITY_TYPES = {
    BRAIN_LESION: '뇌병변장애',
    VISUAL: '시각장애',
    HEARING: '청각장애',
    SPEECH: '언어장애',
    FACIAL: '안면장애',
    KIDNEY: '신장장애',
    HEART: '심장장애',
    RESPIRATORY: '호흡기장애',
    LIVER: '간장애',
    STOMA: '장루·요루장애',
    EPILEPSY: '뇌전증장애',
    INTELLECTUAL: '지적장애',
    AUTISM: '자폐성장애',
    MENTAL: '정신장애'
};

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
                    description: {
                        type: "string",
                        description: "사용자의 장애 유형에 맞는 접근성 정보를 종합적으로 서술. 해당되는 편의시설과 서비스를 구체적으로 명시 (예: '휠체어 경사로 완비, 장애인 화장실 있음, 점자 안내판 설치, 수화 통역 예약 가능')"
                    },
                    accessibilityScore: {
                        type: "number",
                        description: "접근성 점수 (1-5). 5: 매우 우수, 4: 우수, 3: 보통, 2: 부족, 1: 매우 부족",
                        minimum: 1,
                        maximum: 5
                    },
                    city: { type: "string" },
                    country: { type: "string" },
                    countryCode: { type: "string" }
                    },
                    required: ["name", "time", "coords", "description", "accessibilityScore", "city", "country", "countryCode"]
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

// 장애 유형별 접근성 요구사항 생성
function generateAccessibilityRequirements(disabilityTypes, isWheelchairUser) {
    const requirements = [];
    
    if (isWheelchairUser) {
        requirements.push(`
        **휠체어 사용자 (최우선 고려):**
        - 휠체어 진입 가능한 경사로 또는 평평한 입구
        - 엘리베이터 설치 (층간 이동 시)
        - 장애인 전용 화장실
        - 넓은 통로와 문 (최소 80cm)
        - 휠체어 접근 가능한 테이블/좌석
        - 장애인 주차 구역`);
    }
    
    if (!disabilityTypes || disabilityTypes.length === 0) {
        return requirements.length > 0 ? requirements.join('\n\n') : '일반적인 접근성을 고려합니다.';
    }

    const requirementsMap = {
        [DISABILITY_TYPES.BRAIN_LESION]: `
        **뇌병변장애:**
        - 평탄한 바닥 또는 완만한 경사로
        - 손잡이가 있는 계단 및 복도
        - 휴식 공간 및 의자 비치
        - 미끄럽지 않은 바닥
        - 넓은 통로 (보행 보조기구 사용 가능)`,
        
        [DISABILITY_TYPES.VISUAL]: `
        **시각장애:**
        - 점자 안내판 및 촉각 지도
        - 음성 안내 시스템
        - 안내견 동반 가능
        - 명확한 동선과 장애물 없는 경로
        - 오디오 가이드 또는 설명 서비스
        - 충분한 조명 (저시력자용)`,
        
        [DISABILITY_TYPES.HEARING]: `
        **청각장애:**
        - 수화 통역 서비스 또는 예약 가능
        - 자막이 제공되는 영상/공연
        - 시각적 안내 시스템 (문자 안내판, 디지털 디스플레이)
        - 진동 알림 시스템
        - 필담 또는 문자 소통 가능한 직원`,
        
        [DISABILITY_TYPES.SPEECH]: `
        **언어장애:**
        - 필담 또는 문자 소통 가능
        - 인내심 있는 직원
        - 태블릿/스마트폰 사용 허용
        - AAC 보조기기 사용 가능`,
        
        [DISABILITY_TYPES.FACIAL]: `
        **안면장애:**
        - 일반적인 접근성 (특별한 시설 불필요)
        - 편안하고 차별 없는 환경`,
        
        [DISABILITY_TYPES.KIDNEY]: `
        **신장장애:**
        - 깨끗한 화장실 접근 용이
        - 투석 가능한 의료 시설 근처
        - 휴식 공간
        - 음수대/정수기
        - 응급 의료 접근성`,
        
        [DISABILITY_TYPES.HEART]: `
        **심장장애:**
        - 휴식 공간 충분
        - 엘리베이터/에스컬레이터
        - 과도한 계단이나 경사 없음
        - 응급 의료 접근성
        - 온도 조절이 잘 되는 환경`,
        
        [DISABILITY_TYPES.RESPIRATORY]: `
        **호흡기장애:**
        - 금연 구역
        - 환기가 잘 되는 공간
        - 공기질 좋은 환경
        - 휴식 공간
        - 산소 공급 가능 시설`,
        
        [DISABILITY_TYPES.LIVER]: `
        **간장애:**
        - 화장실 접근 용이
        - 휴식 공간
        - 그늘진 공간 (햇빛 주의)
        - 편안한 환경`,
        
        [DISABILITY_TYPES.STOMA]: `
        **장루·요루장애:**
        - 깨끗하고 접근 용이한 화장실
        - 개인 화장실 또는 장애인 화장실
        - 세면대와 거울
        - 쓰레기통 비치`,
        
        [DISABILITY_TYPES.EPILEPSY]: `
        **뇌전증장애:**
        - 조명이 깜빡이지 않는 환경
        - 조용하고 안정적인 공간
        - 휴식 공간
        - 응급 의료 접근성`,
        
        [DISABILITY_TYPES.INTELLECTUAL]: `
        **지적장애:**
        - 쉬운 언어로 된 안내
        - 시각적 안내 자료 (그림, 아이콘)
        - 차분한 환경
        - 보호자 동반 가능
        - 명확하고 단순한 동선`,
        
        [DISABILITY_TYPES.AUTISM]: `
        **자폐성장애:**
        - 감각 친화적 환경 (소음, 조명 조절)
        - 조용한 공간 또는 별도 공간
        - 예측 가능한 일정과 명확한 구조
        - 보호자 동반 가능
        - 혼잡하지 않은 시간대`,
        
        [DISABILITY_TYPES.MENTAL]: `
        **정신장애:**
        - 조용하고 편안한 환경
        - 휴식 공간
        - 혼잡하지 않은 시간대
        - 스트레스 최소화
        - 보호자 동반 가능`
  };

  disabilityTypes.forEach(type => {
    if (requirementsMap[type]) {
      requirements.push(requirementsMap[type]);
    }
  });

  return requirements.join('\n\n');
}

// 장애 유형 설명 생성
function generateDisabilityContext(disabilityTypes, isWheelchairUser) {
    const contexts = [];
    
    if (isWheelchairUser) {
        contexts.push('휠체어 사용자');
    }
    
    if (disabilityTypes && disabilityTypes.length > 0) {
        contexts.push(...disabilityTypes);
    }
    
    if (contexts.length === 0) {
        return '일반 여행객을 위한 장소를 추천합니다.';
    }
    
    return `다음 유형의 여행객을 위한 접근성을 최우선으로 고려해야 합니다: ${contexts.join(', ')}`;
}

async function generateTripPlan(userData, mode = 'initial', refinementContext = '') {
    const { 
        country, 
        city, 
        startDate, 
        endDate, 
        travelStyle, 
        disabilityTypes = [], 
        isWheelchairUser = false 
    } = userData;
    
    const accessibilityRequirements = generateAccessibilityRequirements(disabilityTypes, isWheelchairUser);
    const disabilityContext = generateDisabilityContext(disabilityTypes, isWheelchairUser);
    const hasAccessibilityNeeds = isWheelchairUser || disabilityTypes.length > 0;

    let systemMessage = '';

    if (mode === 'initial') {
        systemMessage = `당신은 장애인의 해외여행을 전문적으로 지원하는 최고 수준의 AI 여행 플래너입니다.
        사용자의 요구사항에 맞춰 ${country}, ${city}에 대한 상세하고 실현 가능한 여행 계획을 생성하세요.
        응답은 반드시 'create_barrier_free_trip_plan' 함수를 사용하여 JSON 형식으로 반환하세요.

        조건:
        - 기간: ${startDate}부터 ${endDate}까지
        - 도시: ${city}, 국가: ${country}
        - 여행 스타일: ${travelStyle}
        - 접근성: ${disabilityContext}
       
        **매우 중요 - 장소 이름 작성 규칙:**
        - 모든 장소 이름은 Google Maps에서 정확히 검색 가능해야 합니다.
        - 장소 이름 형식: "정식 명칭, 도시명" (예: "부산시립미술관, 부산", "Busan Museum of Art, Busan")
        - 영문 병기가 일반적인 장소는 영문도 포함 (예: "벡스코 BEXCO, 부산")
        - 약칭보다는 정식 명칭 사용
        - 브랜드 체인점은 지점명 포함 (예: "스타벅스 해운대점, 부산")

        **장소 이름 예시:**
        좋은 예: "국립중앙박물관, 서울", "해운대해수욕장, 부산", "롯데월드타워, 서울"
        나쁜 예: "중앙박물관", "해운대", "롯데타워"

        ${hasAccessibilityNeeds ? `
        **접근성 요구사항:**
        ${accessibilityRequirements}

        각 장소에 대해:
        1. description: 위 요구사항에 해당하는 구체적인 편의시설을 명시
        - 예: "1층 입구에 휠체어 경사로 설치, 3층까지 엘리베이터 운영, 장애인 화장실 2층에 위치, 점자 안내판 주요 동선마다 설치, 수화 통역은 3일 전 예약 필요"
        2. accessibilityScore: 접근성 점수 부여 (1-5)
        - 5: 모든 요구사항 충족, 편의시설 우수
        - 4: 대부분 요구사항 충족
        - 3: 기본적인 접근 가능하나 일부 불편
        - 2: 접근 어려움, 보조 필요
        - 1: 접근 매우 어려움

        **중요**: 접근성 점수 4점 이상인 장소만 추천하세요.` : 
        `각 장소의 description에 일반적인 편의시설 정보를 제공하고, accessibilityScore는 3-5점 사이로 설정하세요.`}`;
    } else {
        systemMessage = `당신은 AI 여행 플래너입니다. 기존 계획에서 접근성이 부족한 장소들을 대체해야 합니다.
        **가장 중요**: ${city}에서 원래 장소의 성격에 맞으면서, 사용자의 접근성 요구사항이 **확실히 보장되는** 새로운 장소로 대체해 주세요.

        사용자 정보: ${disabilityContext}

        **접근성 요구사항:**
        ${accessibilityRequirements}

        **장소 이름 작성 규칙 (필수):**
        - Google Maps에서 정확히 검색 가능한 형식으로 작성
        - 형식: "정식 명칭, ${city}" (예: "부산시립미술관, 부산", "Busan Museum of Art, Busan")
        - 영문 병기: "벡스코 BEXCO, 부산"
        - 체인점은 지점명 포함: "스타벅스 해운대점, 부산"

        새로운 장소는:
        - Google Maps에서 정확히 검색 가능해야 함
        - 접근성 점수 4점 이상이어야 함
        - 기존 계획의 시간대와 구조를 최대한 유지

        대체할 장소 목록:
        ${refinementContext}

        응답은 반드시 'create_barrier_free_trip_plan' 함수를 사용하여 JSON 형식으로 반환하세요.`;
    }

    try {
        const response = await openai.responses.create({
            model: "gpt-4.1",
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
    const { isWheelchairUser = false } = userData;
    
    // 휠체어 사용자가 아니면 Google Maps API 검증 패스
    if (!isWheelchairUser) {
        console.log('휠체어 사용자가 아니므로 Google Maps 접근성 검증을 건너뜁니다.');
        return initialPlan;
    }

    console.log('--- 휠체어 접근성 검증 시작 (휠체어 사용자) ---');
    let currentPlan = initialPlan;
    let retryCount = 0;
    let maxRetries = 2;

    while (retryCount <= maxRetries) {
        console.log(`\n--- 휠체어 접근성 검증 ${retryCount > 0 ? `(${retryCount}차 재시도)` : '시작'} ---`);
        let placesToReplace = [];

        for (const day of currentPlan.itinerary) {
            for (const place of day.places) {
                // 접근성 점수가 낮으면 일단 불합격 처리
                if (place.accessibilityScore < 4) {
                    console.log(`[❌ 불합격] ${day.date} - ${place.name} (접근성 점수: ${place.accessibilityScore})`);
                    placesToReplace.push({
                        date: day.date,
                        originalPlace: place.name,
                        reason: `낮은 접근성 점수 (${place.accessibilityScore})`
                    });
                    continue;
                }
                
                // 점수가 높아도 Google Maps API로 추가 검증
                const checkResult = await checkWheelchairAccessibility(place.name);
                if (!checkResult.isAccessible) {
                    console.log(`[❌ 불합격] ${day.date} - ${place.name} (${checkResult.reason})`);
                    placesToReplace.push({
                        date: day.date,
                        originalPlace: place.name,
                        reason: checkResult.reason
                    });
                } else {
                    console.log(`[✅ 합격] ${day.date} - ${place.name} (점수: ${place.accessibilityScore})`);
                }
            }
        }

        // 대체할 장소가 없으면 검증 완료
        if (placesToReplace.length === 0) {
            console.log('--- 휠체어 접근성 검증 완료. 모든 장소 합격 ✅ ---');
            return currentPlan;
        }

        // 최대 재시도 횟수에 도달했으면 현재 계획 반환
        if (retryCount >= maxRetries) {
            console.log(`\n⚠️  경고: ${maxRetries}번 재시도 후에도 ${placesToReplace.length}개 장소가 불합격 상태입니다.`);
            console.log('현재 계획을 반환합니다. 수동 확인이 필요할 수 있습니다.');
            return currentPlan;
        }

        // 계획 수정 요청
        const refinementContext = `접근성이 낮아 대체해야 할 장소: ${JSON.stringify(placesToReplace)}. 기존 여행 계획: ${JSON.stringify(currentPlan)}`;

        console.log(`\n--- ${placesToReplace.length}개 장소 대체 요청 ---`);
        currentPlan = await generateTripPlan(userData, 'refine', refinementContext);
        console.log('--- 계획 수정 완료. 재검증 시작 ---');
        
        retryCount++;
    }

    return currentPlan;
}

module.exports = {
    generateTripPlan,
    validateAndRefineTripPlan,
    DISABILITY_TYPES
};