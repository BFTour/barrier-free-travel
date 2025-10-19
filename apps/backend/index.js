// index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateTripPlan, validateAndRefineTripPlan } = require('./services/gpt');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001' }));

// 헬스 체크 라우트
app.get('/', (req, res) => {
    res.send('배리어프리 여행 지원 플랫폼 백엔드 서버가 실행 중입니다. ✈️');
});

// 주요 기능 라우트: 여행 계획 생성 및 검증
app.post('/api/recommend', async (req, res) => {
    // 1. 사용자 입력 받기
    const { country, city, startDate, endDate, travelStyle, isWheelchairUser } = req.body;

    if (!country || !city || !startDate || !endDate || !travelStyle) {
        return res.status(400).json({ error: '필수 입력값 (국가, 도시, 기간, 스타일)이 누락되었습니다.' });
    }

    try {
        // 2. GPT 호출 및 여행 계획 초안 생성 (Function Calling 사용)
        console.log('1. GPT에게 여행 계획 초안 요청...');
        const initialTripPlan = await generateTripPlan(req.body, 'initial');

        // 3. 휠체어 사용자라면 Google Maps API로 장소 접근성 검증 및 수정
        console.log('2. 접근성 검증 및 계획 수정 시작...');
        const finalTripPlan = await validateAndRefineTripPlan(initialTripPlan, req.body);

        // 4. 최종 결과 반환
        res.json({
            message: '배리어프리 여행 계획이 성공적으로 생성/검증되었습니다. 🎉',
            plan: finalTripPlan
        });

    } catch (error) {
        console.error('전체 여행 계획 처리 중 오류 발생:', error);
        res.status(500).json({ 
            error: '서버 오류로 여행 계획 생성에 실패했습니다.', 
            detail: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});