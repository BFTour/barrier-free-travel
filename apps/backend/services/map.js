// services/mapsService.js
// Google Places API (New) 사용

const axios = require('axios');
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// API 엔드포인트 (New API)
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

// 캐시 (중복 요청 방지)
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30분

/**
 * Text Search (New)로 장소 검색
 * @param {string} textQuery - 검색 텍스트
 * @param {object} options - 검색 옵션 {lat, lng, radius}
 * @returns {object|null} - Place 데이터 또는 null
 */
async function searchPlace(textQuery, options = {}) {
    // 캐시 확인
    const cacheKey = `search:${textQuery}:${JSON.stringify(options)}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`💾 캐시 히트: "${textQuery}"`);
        return cached.data;
    }

    console.log(`🔍 검색: "${textQuery}"`);

    // 요청 바디
    const requestBody = {
        textQuery: textQuery,
        languageCode: 'en' // 다국어 지원
    };

    try {
        const response = await axios.post(TEXT_SEARCH_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.accessibilityOptions'
            }
        });

        const places = response.data.places;
        
        if (!places || places.length === 0) {
            console.log(`❌ 결과 없음`);
            searchCache.set(cacheKey, { data: null, timestamp: Date.now() });
            return null;
        }

        // 첫 번째 결과 사용
        const place = places[0];
        
        const result = {
            id: place.id,
            displayName: place.displayName?.text || 'Unknown',
            formattedAddress: place.formattedAddress,
            location: place.location,
            accessibilityOptions: place.accessibilityOptions || {}
        };

        console.log(`✅ 찾음: "${result.displayName}"`);
        if (result.formattedAddress) {
            console.log(`     📍 ${result.formattedAddress}`);
        }

        // 캐시 저장
        searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;

    } catch (error) {
        console.error(`❌ 검색 오류: ${error.message}`);
        if (error.response) {
            console.error(`  HTTP ${error.response.status}`);
            console.error(`  응답:`, error.response.data);
        }
        return null;
    }
}

/**
 * Place Details (New)로 상세 정보 조회
 * @param {string} placeId - Place ID (예: "places/ChIJ...")
 * @returns {object|null} - 상세 정보
 */
async function getPlaceDetails(placeId) {
    // 캐시 확인
    const cacheKey = `details:${placeId}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `${PLACE_DETAILS_URL}/${placeId}`;
        
        const response = await axios.get(url, {
            headers: {
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'displayName,formattedAddress,accessibilityOptions'
            }
        });

        const result = response.data;
        
        // 캐시 저장
        if (result) {
            searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
        }

        return result;

    } catch (error) {
        console.error(`Details 오류: ${error.message}`);
        return null;
    }
}

/**
 * 여러 검색 전략으로 장소 찾기
 * @param {string} placeName - 장소 이름
 * @param {object} cityInfo - {city, country, lat, lng}
 * @returns {object|null} - Place 데이터
 */
async function findPlaceWithFallback(placeName, cityInfo = {}) {
    console.log(`\n🔎 검색 시작: "${placeName}"`);

    // 검색 옵션
    const searchOptions = {};
    if (cityInfo.lat && cityInfo.lng) {
        searchOptions.lat = cityInfo.lat;
        searchOptions.lng = cityInfo.lng;
        searchOptions.radius = 50000; // 50km
    }

    // 1차: 원본 이름 그대로
    let result = await searchPlace(placeName, searchOptions);
    if (result) return result;

    // 2차: 쉼표로 분리 ("장소명, 도시명" → "장소명")
    if (placeName.includes(',')) {
        const mainPart = placeName.split(',')[0].trim();
        if (mainPart && mainPart !== placeName) {
            console.log(`  📍 2차 (장소명만): "${mainPart}"`);
            result = await searchPlace(mainPart, searchOptions);
            if (result) return result;
        }
    }

    // 3차: 괄호 제거
    const withoutParens = placeName
        .replace(/[\(\（][^\)\）]*[\)\）]/g, '')
        .trim();
    if (withoutParens && withoutParens !== placeName) {
        console.log(`  📍 3차 (괄호 제거): "${withoutParens}"`);
        result = await searchPlace(withoutParens, searchOptions);
        if (result) return result;
    }

    // 4차: 괄호 안 내용만 (영문명)
    const parensMatch = placeName.match(/[\(\（]([^\)\）]+)[\)\）]/);
    if (parensMatch && parensMatch[1]) {
        const inParens = parensMatch[1].trim();
        if (inParens.length >= 3) {
            console.log(`  📍 4차 (괄호 내용): "${inParens}"`);
            result = await searchPlace(inParens, searchOptions);
            if (result) return result;
        }
    }

    // 5차: 도시 이름과 함께 검색
    if (cityInfo.city) {
        const withCity = `${placeName}, ${cityInfo.city}`;
        console.log(`  📍 5차 (도시 추가): "${withCity}"`);
        result = await searchPlace(withCity, searchOptions);
        if (result) return result;
    }

    // 6차: 단어 분리 (가장 긴 단어부터)
    const words = placeName
        .split(/[\s,\-\/\(\)（）]+/)
        .filter(w => w.length >= 3)
        .sort((a, b) => b.length - a.length);

    for (const word of words.slice(0, 3)) {
        console.log(`  📍 6차 (단어): "${word}"`);
        result = await searchPlace(word, searchOptions);
        if (result) return result;
    }

    console.log(`❌ 모든 검색 실패`);
    return null;
}

/**
 * 휠체어 접근성 분석
 * @param {object} accessibilityOptions - API 응답의 accessibilityOptions
 * @returns {object} - {features, issues, score}
 */
function analyzeAccessibility(accessibilityOptions) {
    const features = [];
    const issues = [];
    let score = 0;

    if (!accessibilityOptions) {
        return { features, issues, score: 0 };
    }

    // wheelchairAccessibleEntrance (가장 중요)
    if (accessibilityOptions.wheelchairAccessibleEntrance === true) {
        features.push('휠체어 접근 가능한 입구');
        score += 3;
    } else if (accessibilityOptions.wheelchairAccessibleEntrance === false) {
        issues.push('휠체어 접근 가능한 입구 없음');
    }

    // wheelchairAccessibleParking
    if (accessibilityOptions.wheelchairAccessibleParking === true) {
        features.push('장애인 주차장');
        score += 1;
    }

    // wheelchairAccessibleRestroom
    if (accessibilityOptions.wheelchairAccessibleRestroom === true) {
        features.push('장애인 화장실');
        score += 1;
    } else if (accessibilityOptions.wheelchairAccessibleRestroom === false) {
        issues.push('장애인 화장실 없음');
    }

    // wheelchairAccessibleSeating
    if (accessibilityOptions.wheelchairAccessibleSeating === true) {
        features.push('휠체어 좌석');
        score += 1;
    }

    return { features, issues, score };
}

/**
 * 휠체어 접근성 확인 (메인 함수)
 * @param {string} placeName - 장소 이름
 * @param {object} cityInfo - {city, country, lat, lng}
 * @returns {object} - {isAccessible, reason, details}
 */
async function checkWheelchairAccessibility(placeName, cityInfo = {}) {
    // 장소 검색
    const placeData = await findPlaceWithFallback(placeName, cityInfo);

    if (!placeData) {
        return {
            isAccessible: false,
            reason: 'Google Maps에서 장소를 찾을 수 없습니다',
            searchedName: placeName,
            suggestions: [
                '장소 이름을 "정식명칭, 도시명" 형식으로 작성하세요',
                '영문 정식 명칭을 사용하세요',
                '주소를 포함하여 검색하세요'
            ]
        };
    }

    // 접근성 분석
    const { features, issues, score } = analyzeAccessibility(placeData.accessibilityOptions);

    // 접근 가능 입구가 있으면 접근 가능
    const hasAccessibleEntrance = placeData.accessibilityOptions?.wheelchairAccessibleEntrance === true;

    if (hasAccessibleEntrance) {
        console.log(`✅ 휠체어 접근 가능 (점수: ${score})`);
        return {
            isAccessible: true,
            reason: `휠체어 접근 가능 ${features.length > 0 ? ` (${features.join(', ')})` : ''}`,
            details: {
                name: placeData.displayName,
                formatted_address: placeData.formattedAddress,
                features: features,
                accessibilityScore: Math.min(5, Math.max(1, score))
            }
        };
    } else if (placeData.accessibilityOptions?.wheelchairAccessibleEntrance === false) {
        console.log(`⚠️ 휠체어 접근 불가`);
        return {
            isAccessible: false,
            reason: '휠체어 접근 불가능으로 등록됨',
            details: {
                name: placeData.displayName,
                formatted_address: placeData.formattedAddress,
                issues: issues
            }
        };
    } else {
        console.log(`❓ 접근성 정보 없음`);
        return {
            isAccessible: false,
            reason: '휠체어 접근성 정보가 등록되어 있지 않습니다',
            details: {
                name: placeData.displayName,
                formatted_address: placeData.formattedAddress,
                note: '실제로는 접근 가능할 수 있으나, 확인된 정보가 없습니다'
            }
        };
    }
}

/**
 * 배치 검증 (여러 장소 한 번에)
 * @param {Array} places - [{name, city, country, lat, lng}, ...]
 * @returns {Array} - 검증 결과 배열
 */
async function batchCheckAccessibility(places) {
    console.log(`\n🔄 배치 검증 시작 (${places.length}개 장소)`);

    const results = [];

    for (let i = 0; i < places.length; i++) {
        const place = places[i];
        console.log(`\n[${i + 1}/${places.length}] ${place.name}`);

        const cityInfo = {
            city: place.city,
            country: place.country,
            lat: place.lat,
            lng: place.lng
        };

        const result = await checkWheelchairAccessibility(place.name, cityInfo);
        results.push({
            ...place,
            ...result
        });

        // API Rate Limit 고려 (짧은 딜레이)
        if (i < places.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    console.log(`\n✅ 배치 검증 완료`);
    return results;
}

/**
 * 캐시 관리
 */
function clearCache() {
    searchCache.clear();
    console.log('🗑️ 캐시 클리어됨');
}

function getCacheStats() {
    return {
        size: searchCache.size,
        ttl: CACHE_TTL
    };
}

module.exports = {
    checkWheelchairAccessibility,
    batchCheckAccessibility,
    searchPlace,
    getPlaceDetails,
    findPlaceWithFallback,
    clearCache,
    getCacheStats
};