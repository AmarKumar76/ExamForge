# ExamForge Test Suite Architecture

Centralized test directory containing unit, integration, and end-to-end (E2E) testing configurations.

## Directory Structure
- `unit/`: Unit tests for services, utilities, validators, and helper functions (Jest / PyTest)
- `integration/`: API route integration tests and cross-service contract tests (Supertest / HTTPX)
- `e2e/`: End-to-end exam lifecycle and user workflow tests (Cypress / Playwright)

*Note: Test suites will be created alongside feature modules according to acceptance criteria.*
