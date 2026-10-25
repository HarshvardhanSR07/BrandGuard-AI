# BrandGuard AI

> **Evidence-First Brand Governance Platform for Safer, More Consistent Publishing**  
> Developed by **Team INFINITY**

---

## 🛡️ Project Overview

**BrandGuard AI** is a multi-tenant brand governance platform ensuring content drafts strictly adhere to active corporate guidelines, approved facts, and regulatory policies before publication.

### Key Architecture Principles
1. **Evidence-First Verification**: Every compliance finding maps directly to cited text spans and policy rules.
2. **Human-in-the-Loop Review**: AI never unilaterally approves or publishes drafts; reviews enforce strict segregation of duties.
3. **Multi-Tenant Isolation**: Workspace boundaries are enforced across all queries, models, and audit records.
4. **Tamper-Evident Audit Chains**: Every governance decision is recorded in an HMAC-SHA256 hash chain.

---

## 📂 Project Structure

```
brandguard-ai/
├── apps/
│   ├── web/            # Vite + React TypeScript Frontend
│   ├── api/            # Express + TypeScript Modular API
│   └── ocr-worker/     # Python document extraction & OCR service
├── packages/
│   └── shared/         # Shared TypeScript schemas, types, and DTO contracts
├── scripts/            # Seed data and environment verification scripts
├── docs/               # System architecture, schemas, and security documentation
└── .github/workflows/  # CI/CD automation pipelines
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- MongoDB >= 7.x
- Python >= 3.10 (optional, for OCR worker)

### Installation
```bash
npm install
cp .env.example .env
```

### Run Development Servers
```bash
# Backend API
npm run dev:api

# Frontend Web Application
npm run dev:web
```
