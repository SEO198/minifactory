# 🏭 Mini Smart Factory MES — 풀스택 구축 아키텍처 & 개발 기록

> **현장 설비(PLC)의 비동기 생산 이벤트를 유실·중복 없이 트랜잭션으로 처리하고, 실시간 공정 상태와 품질 KPI를 관제하는 미니 스마트 팩토리 MES(제조실행시스템)**

---

## 1. 기술 스택 및 개발 환경 (Tech Stack)
- **Backend**: Java 21, Spring Boot 3.x (Spring Web, Spring JDBC, Validation, Scheduling)
- **Database**: PostgreSQL (Docker Compose 컨테이너 기반 로컬 운영)
- **Frontend**: HTML5, Vanilla JS (`fetch` API), Tailwind CSS (CDN), Chart.js (CDN)
- **IDE & Build**: IntelliJ IDEA, Gradle

---

## 2. 초기 환경 구축 프로세스 (0단계 ~ 1단계)
1. **필수 런타임 및 도구 설치**
   - Java 21 JDK, IntelliJ IDEA, Docker Desktop 설치
2. **프로젝트 초기화 및 의존성 동기화**
   - Spring Initializr로 Gradle 기반 프로젝트 생성 (`Web`, `JDBC`, `PostgreSQL`, `Validation`)
   - `build.gradle` 의존성 동기화(Gradle Sync) 및 IDE 인덱스 설정
3. **인프라 및 DB 스키마 구성**
   - `docker-compose.yml` 작성 후 `docker compose up -d`로 PostgreSQL 컨테이너(5432 포트) 기동
   - `application.yml`에 DB 접속 정보 및 `schema.sql` 자동 초기화 설정 적용 (`work_orders`, `production_events`, `production_results` 3단 정규화 스키마 구성)

---

## 3. 최종 시스템 아키텍처 및 데이터 흐름 (End-to-End)

```text
[가상 설비 데몬: PlcSimulator (@Scheduled)] ──┐ (2초 주기 자동 생산 & 90% 양품률 시뮬레이션)
                                             ▼
[브라우저 대시보드 (index.html / app.js)] ──▶ [Controller: WorkOrderController / EventController / SimulatorController]
   ├─ 실시간 통제 (시작/정지/완료/수동투입)         │ (@Valid 입력값 검증 및 REST API 라우팅)
   ├─ 실시간 KPI 카드 & 불량률 10% 초과 경고        ▼
   └─ 접이식 Traceability 이벤트 로그 콘솔     [Service: WorkOrderService / EventService]
                                                   │ (@Transactional 원자적 처리, 멱등성 검증, 목표 달성 자동 전환)
                                                   ▼
                                             [DAO: WorkOrderDao / EventDao]
                                                   │ (JdbcTemplate, 비관적 락 FOR UPDATE OF w, JOIN 집계 매핑)
                                                   ▼
                                             [PostgreSQL DB]
                                                   ├─ work_orders        (작업지시 마스터 & 상태 머신)
                                                   ├─ production_events  (설비 이벤트 불변 원장, event_id UNIQUE)
                                                   └─ production_results (작업지시별 양품/불량 누적 실적)
