# --- 1단계: 빌드 환경 ---
# Node.js LTS 버전 (예: 18)을 기반 이미지로 사용합니다.
FROM node:18-alpine AS builder

# 작업 디렉터리 설정
WORKDIR /usr/src/app

# package.json과 package-lock.json (또는 yarn.lock)을 먼저 복사하여 의존성 캐싱 활용
COPY package*.json ./

# 프로덕션 의존성만 설치 (TypeScript 컴파일에 필요한 devDependencies는 여기서 설치)
# 또는 개발/빌드에 필요한 모든 의존성을 설치하려면: RUN npm install
RUN npm install

# 애플리케이션 소스 코드 전체 복사
COPY . .

# TypeScript를 JavaScript로 빌드 (package.json에 "build" 스크립트가 정의되어 있어야 함)
RUN npm run build

# --- 2단계: 프로덕션 환경 ---
# 더 가벼운 Node.js 이미지를 프로덕션 이미지로 사용
FROM node:18-alpine

WORKDIR /usr/src/app

# package.json과 package-lock.json을 다시 복사 (프로덕션 의존성 설치용)
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm install --only=production

# 빌드 단계에서 생성된 dist 폴더와 필요한 다른 자원(예: ABI 파일) 복사
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/abi ./src/abi

# 애플리케이션이 리슨할 포트 (server.ts에서 process.env.PORT || 3001로 설정됨)
# 실제 PORT 환경변수를 컨테이너 실행 시 주입하지 않으면 3001 포트 사용
EXPOSE 3001

# 애플리케이션 실행 명령어 (컴파일된 JavaScript 파일 실행)
CMD [ "node", "dist/server.js" ]
