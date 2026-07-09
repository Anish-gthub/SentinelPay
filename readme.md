# SentinelPay 🛡️
**A High-Concurrency, ACID-Compliant Payment Gateway Microservice**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-In--Memory-red.svg)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/Queue-BullMQ-orange.svg)](https://docs.bullmq.io/)

---

## 🏗️ System Architecture & Engineering Focus

SentinelPay is a robust backend payment processing engine designed to solve complex distributed system challenges, specifically focusing on **multi-device race conditions**, **network retries (double-spending)**, and **I/O blocking**.
### 🔗 Live Production API
* **Gateway URL:** `https://sentinel-pay-api.onrender.com`
* **Health Check Endpoint:** `https://sentinel-pay-api.onrender.com/`

---

## 🏗️ System Architecture & Cloud Infrastructure

The application decouples the intensive transaction pipeline into an asynchronous, memory-efficient microservice ecosystem deployed across a modern cloud infrastructure stack:

* **API Gateway Layer:** Node.js & Express hosted on **Render** (handles validation, route management, and incoming web traffic).
* **In-Memory Cache & Lock Layer:** Serverless Redis cluster hosted on **Upstash** (manages rapid-fire idempotency tracking with sub-millisecond latencies).
* **Background Worker Queue:** Distributed task allocation using **BullMQ** to gracefully manage heavy execution spikes outside the main execution thread.
* **Relational Persistence Layer:** Serverless PostgreSQL database hosted on **Neon**, leveraging transactional ACID guarantees.

---

### Core Technical Achievements:

* **Pessimistic Row-Level Locking (`SELECT FOR UPDATE`):** Engineered strict database concurrency controls in PostgreSQL. Financial mutations are wrapped in explicit transaction blocks, entirely eliminating Read-Modify-Write race conditions when multiple clients attempt to modify the same wallet balance simultaneously.
* **Distributed Idempotency Gateway (Redis):** Built an in-memory Bouncer using atomic `SETNX` commands. This intercepts identical, rapid-fire network requests (e.g., user double-clicking "Pay") at the cache layer, rejecting duplicates with `HTTP 409 Conflict` and preventing redundant database execution.
* **Asynchronous Event-Driven Processing:** Decoupled core ACID transactions from heavy I/O post-processing tasks (receipt generation, webhooks). Utilized **BullMQ** to push background jobs to separate Node.js worker threads, resulting in sub-millisecond API response times for the primary client.
* **Immutable Double-Entry Ledger:** Wallet mutations are strictly bound to an append-only ledger schema, ensuring 100% mathematical auditability and state recovery in the event of hardware failures.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js, Express.js
* **Primary Database:** PostgreSQL (Neon Cloud)
* **Caching & Distributed Locks:** Redis
* **Message Queue:** BullMQ
* **Security:** Bearer Token (API Key) Authentication

---

## 📂 Layered Directory Structure

```text
SentinelPay/
├── config/             # DB, Redis, and Queue initialization pools
├── controllers/        # Core business logic and transaction blocks
├── middlewares/        # Idempotency and API Auth security layers
├── routes/             # Express traffic routing
├── schema.sql          # Double-entry ledger DDL
├── seed.js             # Automated database setup & dummy data seeder
├── worker.js           # Decoupled BullMQ background consumer
├── stress.js           # Custom concurrency stress-testing script
├── server.js           # Application orchestrator
└── .env.example        # Environment variable template
