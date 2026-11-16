# 🏭 Mini Smart Factory MES — 풀스택 구축 아키텍처 & 개발 기록

## 1. 기술 스택 및 개발 환경 (Tech Stack)
- **Backend:** Java 21, Spring Boot (Spring Web, JDBC API, Validation)
- **Database:** PostgreSQL (Docker Compose 컨테이너 기반 로컬 운영)
- **Frontend:** HTML5, Vanilla JS (`fetch` API), Tailwind CSS (CDN), Chart.js (CDN)
- **IDE & Build:** IntelliJ IDEA, Gradle

---

## 2. 초기 환경 구축 프로세스 (0단계 ~ 1단계)
1. **필수 런타임 및 도구 설치**
   - Java 21 JDK, IntelliJ IDEA, Docker Desktop 설치
2. **프로젝트 초기화 및 의존성 동기화**
   - Spring Initializr로 Gradle 기반 프로젝트 생성 (`Web`, `JDBC`, `PostgreSQL`, `Validation`)
   - `build.gradle` 의존성 동기화(Gradle Sync) 및 IDE 인덱스 설정
3. **인프라 및 DB 스키마 구성**
   - `docker-compose.yml` 작성 후 `docker compose up -d`로 PostgreSQL 컨테이너(`5432` 포트) 기동
   - `application.yml`에 DB 접속 정보 및 `schema.sql` 자동 초기화 설정 적용

---

## 3. 시스템 아키텍처 및 데이터 흐름 (2단계)

```text
[브라우저 대시보드 (index.html / app.js)]
       │  (HTTP JSON 요청: POST / GET)
       ▼
[DTO: WorkOrderCreateRequest] ──▶ 입력값 1차 유효성 검증 (@Valid, @NotBlank, @Min)
       │
       ▼
[Controller: WorkOrderController] ──▶ REST API 엔드포인트 매핑 (/api/work-orders)
       │
       ▼
[Service: WorkOrderService] ──▶ 상태 전이 비즈니스 규칙 검증 및 트랜잭션(@Transactional) 관리
       │
       ▼
[DAO: WorkOrderDao] ──▶ JdbcTemplate 기반 SQL 실행, 행 잠금(FOR UPDATE), ResultSet → WorkOrder 객체 매핑
       │
       ▼
[PostgreSQL DB] ──▶ work_orders 테이블 영구 저장 및 상태(READY/RUNNING/STOPPED/COMPLETED) 관리
