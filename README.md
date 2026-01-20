# 💪 FITNESS BATTLE

친구들과 운동 기록을 공유하고 경쟁하는 웹앱입니다!

## 멤버
- 강동훈
- 권영근
- 서정환
- 정성효
- 조현오
- 천창익
- 황대한

## 주요 기능

- 🏆 실시간 순위표
- ➕ 운동 기록 입력 (거리 기반)
- 📸 인증 사진 업로드
- ⚡ 운동 가중치 설정
  - 러닝: 1.0배
  - 수영: 1.5배
  - 바다수영: 2.0배
  - 등산: 1.0배
  - 사이클: 1.0배
- 👥 친구와 함께 운동 시 10% 보너스
- 💬 카카오톡 공유 기능

## 로컬 실행 방법

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm run dev
```

3. 브라우저에서 `http://localhost:5173` 접속

## 배포 방법

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com) 가입
2. GitHub에 프로젝트 푸시
3. Vercel에서 "New Project" 클릭
4. GitHub 저장소 연결
5. 자동 배포 완료!

### Netlify 배포

1. [Netlify](https://www.netlify.com) 가입
2. "Add new site" → "Import an existing project"
3. GitHub 저장소 연결
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy 클릭!

## 카카오톡 공유 설정

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 생성
3. 플랫폼 → Web 플랫폼 추가
4. 사이트 도메인 등록
5. JavaScript 키 복사
6. 앱 내 설정에서 키 입력

## 기술 스택

- React 18
- Vite
- Tailwind CSS
- Lucide React (아이콘)
- 카카오 SDK

## 라이센스

MIT
