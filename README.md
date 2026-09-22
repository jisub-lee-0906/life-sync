# LifeSync v1.2

올인원 자산·라이프 통합 대시보드입니다. 가계부, 일정/할 일, 루틴, 만다라트, 통계를 하나의 개인용 웹 애플리케이션으로 통합해 기록과 회고를 한 화면에서 관리하는 것을 목표로 합니다.

## Project Overview

LifeSync는 다음 흐름을 중심으로 설계되었습니다.

- 빠른 입력: 가계부 Quick Add, CSV Import/Export, 모바일 PWA 접근성
- 통합 시야: Finance, Calendar, Todo/Routine, Mandalart, Analytics를 같은 대시보드 안에서 연결
- 개인 보안: Google OAuth + 승인제(`PENDING` / `APPROVED` / `REJECTED`) 기반 접근 제어
- 백업 가능성: JSON 전체 백업과 CSV 금융 데이터 이관 지원

## Tech Stack

- Framework: Next.js 16 (App Router, React 19)
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI: shadcn/ui, Base UI, lucide-react
- Auth: Auth.js v5 beta + Google OAuth
- Database: PostgreSQL (Supabase), Drizzle ORM, drizzle-zod
- State: Zustand
- Forms & Validation: react-hook-form, Zod, @hookform/resolvers
- Charts & Motion: recharts, framer-motion
- CSV & Utilities: PapaParse, date-fns, react-intersection-observer
- PWA: @serwist/next
- Deployment target: Next.js standalone output for Coolify/Docker

## Directory Structure

주요 디렉터리 역할은 아래와 같습니다.

```text
app/              App Router pages, layouts, route handlers
actions/          Server Actions by feature domain
components/       UI components (dashboard, finance, planner, settings, ui)
drizzle/          Drizzle schema and migrations source
lib/              Shared business logic, parsers, helpers, typed utilities
schemas/          App-facing Zod schema re-exports
store/            Zustand provider/store setup
public/           Icons, PWA assets, generated service worker output
```

## Core Features

### Finance Dashboard

- Quick Add 입력 폼
- 사용자 세션 기준 Zero-Trust CRUD
- `date + id` 복합 커서 기반 Infinite Scroll
- CSV Import/Export
- 반복 결제 필드 저장(`isRecurring`, `recurrenceDate`)

### Life Calendar

- 월간 캘린더 셀에 재무 합계와 할 일 요약 표시
- 서버 집계 기반 날짜별 요약 데이터 렌더링
- 날짜 선택 시 상세 패널 표시

### Todo & Routine

- 루틴 주간 체크(`mon_check` ~ `sun_check`)
- 진행률 슬라이더 기반 Task 상태 업데이트
- 드래그 중 서버 과호출 방지를 위해 commit 시점에만 저장

### Mandalart Vision

- 3x3 보드 렌더링
- `framer-motion` 기반 포커스 전환 애니메이션

### Analytics

- 카테고리별 지출 도넛 차트
- Task 완료율 요약

### Settings & Admin

- 아이콘 환경설정(`schedule_icon`, `todo_icon`)
- 관리자 승인 페이지(`/settings/admin`)
- 전체 데이터 JSON 백업(`/api/backup`)

## Local Setup

### 1. Install

```bash
npm ci
```

### 2. Configure environment variables

로컬 실행 전에 `.env.local`에 아래 값을 설정합니다.

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/lifesync
AUTH_SECRET=replace-with-a-secure-random-string
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
ADMIN_EMAILS=admin@example.com
```

메모:

- `DATABASE_URL`은 Supabase Postgres 연결 문자열을 사용합니다.
- `ADMIN_EMAILS`는 쉼표로 구분된 관리자 이메일 목록입니다.
- Google Provider는 Auth.js v5 규칙에 따라 `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`를 사용합니다.

### 3. Run the app

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## Database Commands

Drizzle 설정 파일은 [`drizzle.config.ts`](drizzle.config.ts)에 있습니다.

스키마를 데이터베이스에 반영할 때:

```bash
npx drizzle-kit push
```

필요 시 Drizzle Studio:

```bash
npx drizzle-kit studio
```

## Available Commands

```bash
npm run dev      # local dev server
SKIP_DB_PUSH=1 npm run build  # local production build; prevents any schema push
npm run start    # run built app
npm run lint     # eslint
npx tsc --noEmit # type check
```

## Local verification safety

`npm run build` has a deployment database-sync pre-step. For local verification, always set `SKIP_DB_PUSH=1` so no schema push is attempted. `npm run test` covers pure `lib/` logic only; browser E2E tests require configured local authentication and database fixtures and are not safe against a production service.
## Deployment Notes

- `next.config.ts`에 `output: "standalone"`이 설정되어 있어 Coolify/Docker 배포에 적합한 산출물을 생성합니다.
- PWA 서비스 워커는 Serwist를 통해 빌드 시 `public/sw.js`로 생성됩니다.
- 승인 기반 인증 구조를 사용하므로 첫 관리자 계정은 `ADMIN_EMAILS`에 포함된 이메일로 로그인해야 합니다.

