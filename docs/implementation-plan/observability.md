# Observability — Implementation Plan

# Status

[NEEDS VERIFICATION]

## Completed

- Application health check endpoints (`/health`) across backend Express API and Python AI microservices
- Docker containerization (`docker-compose.yml`) for server, client, database, and Redis services
- Standard structured error logging and request duration tracking in Node.js server middleware
- Prometheus metric exporter configuration definitions

## Remaining

- Real-time Prometheus scraping verification against live running instance
- Grafana dashboard deployment and alert threshold configuration verification under production load

## Verification Evidence

- Backend tests: PASS (`/health` returns HTTP 200 OK with operational status)
- Frontend build: PASS (`npx vite build` succeeded cleanly)
- API verification: PASS (`GET http://localhost:5000/health`)
- Relevant files: `server/src/server.js`, `docker-compose.yml`, `prometheus.yml`

## 1. Module Overview
The Observability module provides system-level metrics collection, health monitoring, operational tracing, and alert management for ExamForge. It tracks API performance, AI microservice throughput, active exam concurrencies, WebSocket connection counts, Redis memory usage, and database query latencies, exposing standard metrics endpoints for Prometheus scraping and Grafana dashboard visualization.

## 2. SRS Requirements Covered
- Section 16: Non-Functional Requirements (Observability & Health Checks)
- Section 19: Observability (API, AI, Exam, WebSocket, Redis, MongoDB, Infrastructure Signals)

## 3. Module Scope

### In Scope
- Application Health Monitoring: Health check endpoints (`/health`) across Node.js API and FastAPI AI services
- Performance & Operational Metrics Exposure: Standard `/metrics` scrapable format exposing:
  - API: Request rate, latency distribution (p95, p99), HTTP status codes, error rates
  - AI Service: Generation request count, failure rate, latency, token usage metadata
  - Exam Engine: Active attempts, submissions per minute, autosave failure count
  - WebSockets: Active connections, reconnect rates, dropped event counts
  - Infrastructure & Data: Redis memory usage, cache hit/miss ratio, MongoDB query latency
- Prometheus configuration setup and metric exporter integration
- Grafana dashboard definition templates for operational visualization

### Out of Scope
- User activity audit logging (handled by Audit Logs module)
- Application business analytics (handled by Analytics module)

## 4. User Roles
- **Super Admin**: Monitors real-time system health, API latencies, active exam loads, and service status indicators on System Overview panel.
- **DevOps / System Engineers**: Inspects Prometheus scrapers, Grafana dashboards, container resource usage, and configures alerting thresholds.

## 5. User Flow
DevOps engineer or Super Admin accesses System Health Dashboard 
→ System queries `/health` and metric endpoints across services 
→ Displays live system status indicators (API API Status: Operational, AI Service: Operational, Redis: Healthy) 
→ Grafana dashboards render real-time graphs of active exam concurrencies, API latencies, and AI throughput 
→ If an anomaly occurs (e.g., elevated autosave failure rate), system triggers alert notification.

## 6. Core Features

### System Health & Metric Exporter
- **Purpose**: Provide real-time health status and structured operational metrics.
- **Expected behavior**: Expose `/health` endpoints returning service status and `/metrics` returning formatted metrics for Prometheus scrapers.
- **User interaction**: None for end-users; Super Admin views health status on Admin panel.
- **System behavior**: Measure request durations, track error counts, monitor active session locks, and format metric strings.

### Operational Metrics Collector
- **Purpose**: Track application performance across API, AI microservice, Exam Engine, and WebSocket layers.
- **Expected behavior**: Continuously update metric counters, gauges, and histograms without impacting API performance.
- **User interaction**: View Grafana dashboard charts.
- **System behavior**: Increment counters on HTTP requests, record latency histograms, track active WebSocket sockets.

### Operational Dashboards & Alerting
- **Purpose**: Visualize platform vitals and alert engineers to operational bottlenecks.
- **Expected behavior**: Render real-time time-series graphs for exam throughput, server response times, and AI latency.
- **User interaction**: View dashboards, receive system alerts upon threshold breaches.
- **System behavior**: Aggregate metric series, render visual charts, evaluate alert conditions.

## 7. Business Rules
- Health check endpoints must respond within 200ms to allow load balancer probe evaluation.
- Metric collection code must execute asynchronously with zero noticeable latency impact on user API requests.
- Health and metrics endpoints must be secured or restricted to internal monitoring network interfaces in production.

## 8. Module Dependencies

### Depends On
- Authentication & Account Management
- Audit Logs

### Depends On This Module
None (Infrastructure monitoring module).

## 9. Important States
- Healthy / Operational
- Degraded Performance
- Unhealthy / Service Down
- Scrape Active

## 10. Error & Edge Behavior

### AI Service Unreachable
- **Scenario**: FastAPI AI microservice crashes or becomes unreachable.
- **Expected behavior**: API Gateway health check reports `AI Service Degraded`; main REST API continues operating for non-AI exam functions.

### Redis Memory Threshold Breach
- **Scenario**: High exam concurrency causes Redis memory usage to exceed 85% capacity.
- **Expected behavior**: Trigger elevated alert on monitoring dashboard and clear non-essential cache keys automatically.

## 11. Security Considerations
- Metrics endpoints exposing internal node IPs or server environment metadata must be protected against public Internet exposure.

## 12. Implementation Phases
- **Phase 1 — Health Endpoints**: `/health` checks across Express API and FastAPI AI service.
- **Phase 2 — Metric Exporters**: Integration of metric scrapers for API latency, errors, and exam counts.
- **Phase 3 — Prometheus Setup**: Prometheus configuration and scraping target definitions.
- **Phase 4 — Grafana Dashboards**: Construction of operational dashboards for system performance visualization.

## 13. Testing Scope
- Verifying `/health` endpoint response formatting and status codes under normal and degraded states.
- Verifying metric increments upon executing API requests and AI jobs.
- Testing Prometheus metric scraping syntax validation.
- Verifying alert triggers under simulated high-error or latency conditions.

## 14. Definition of Done
- Health check endpoints operate reliably across all microservices.
- Operational metrics (API, AI, Exam, WebSockets, Infrastructure) are exposed cleanly for Prometheus scraping.
- Grafana dashboard configurations accurately visualize system performance and concurrency vitals.
