# BrandGuard AI Demonstration Script

## Step-by-Step Walkthrough

### 1. Workspace Onboarding & Persona Setup
- Log in as **Workspace Admin** (`admin@acmebrand.com`).
- Verify active workspace `Acme Global`.

### 2. Policy & Truth Base Setup
- Review Brand Guidelines: Tone, restricted terms ("cheapest", "revolutionary", guaranteed ROI).
- Inspect Approved Facts: "Series B funding of $50M in 2025", "SOC2 Type II certified".

### 3. Content Creation & Draft Ingestion
- Log in as **Content Creator** (`creator@acmebrand.com`).
- Paste draft claiming unverified metrics ("We guarantee 300% ROI in 30 days!").
- Submit draft for analysis.

### 4. Evidence-First Rule Engine & AI Analysis
- Rule engine immediately flags "guarantee ROI" with High severity.
- Findings card displays exact excerpt, violating policy ID, and suggested replacement.

### 5. Reviewer Segregation of Duties
- Content Creator attempts to approve draft -> Blocked (Segregation of Duties).
- Log in as **Compliance Reviewer** (`reviewer@acmebrand.com`).
- Inspect Evidence Panel, approve correction, or request revision.

### 6. Audit Trail & Hash-Chain Verification
- Open Audit Log -> Verify cryptographic HMAC-SHA256 hash chaining.
