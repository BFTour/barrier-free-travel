// services/mapsService.js

const axios = require('axios');
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * 장소 이름으로 Google Maps에서 Place ID를 검색합니다.
 * @param {string} placeName - 검색할 장소 이름
 * @returns {string|null} - Place ID 또는 null
 */
async function findPlaceId(placeName) {
    const FIND_PLACE_URL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
    try {
        const response = await axios.get(FIND_PLACE_URL, {
            params: {
                input: placeName,
                inputtype: 'textquery',
                fields: 'place_id',
                key: GOOGLE_MAPS_API_KEY
            }
        });

        return response.data.candidates[0]?.place_id || null;
    } catch (error) {
        console.error(`Error finding Place ID for ${placeName}:`, error.message);
        return null;
    }
}

/**
 * Place ID를 사용하여 장소의 상세 정보(특히 휠체어 접근성)를 조회합니다.
 * @param {string} placeId - Google Place ID
 * @returns {object|null} - 접근성 상세 정보
 */
async function getPlaceDetails(placeId) {
    const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
    try {
        // New Places API에서 사용되는 필드 마스크를 URL 파라미터로 대체했습니다.
        // Legacy API를 사용하지만, 필드에 accessibility 관련 정보를 명시적으로 요청합니다.
        const response = await axios.get(DETAILS_URL, {
            params: {
                place_id: placeId,
                // 휠체어 접근성을 확인하는 데 필수적인 필드들
                fields: 'name,wheelchair_accessible_entrance,wheelchair_accessible_parking,wheelchair_accessible_restroom', 
                key: GOOGLE_MAPS_API_KEY
            }
        });

        return response.data.result || null;
    } catch (error) {
        console.error(`Error fetching Place Details for ID ${placeId}:`, error.message);
        return null;
    }
}

/**
 * 장소 이름으로 휠체어 접근성을 확인하는 주 함수
 * @param {string} placeName - 검증할 장소 이름
 * @returns {object} - 접근성 검증 결과
 */
async function checkWheelchairAccessibility(placeName) {
    const placeId = await findPlaceId(placeName);

    if (!placeId) {
        return { isAccessible: false, reason: 'Google Maps에서 장소 ID를 찾을 수 없습니다.' };
    }

    const details = await getPlaceDetails(placeId);

    if (!details) {
        return { isAccessible: false, reason: '장소 상세 정보(접근성 필드)를 가져올 수 없습니다.' };
    }

    // Google Maps의 wheelchair_accessible_entrance 필드는 'true', 'false', 또는 undefined
    const hasAccessibleEntrance = details.wheelchair_accessible_entrance === true;
    
    // 최소한 휠체어 접근 가능한 입구가 있어야 '접근 가능'으로 판단
    if (hasAccessibleEntrance) {
        return { 
            isAccessible: true, 
            reason: '휠체어 접근 가능한 입구가 확인되었습니다.',
            details: details
        };
    } else {
        return { 
            isAccessible: false, 
            reason: '휠체어 접근 가능한 입구가 확인되지 않았습니다.',
            details: details
        };
    }
}

module.exports = {
    checkWheelchairAccessibility
};