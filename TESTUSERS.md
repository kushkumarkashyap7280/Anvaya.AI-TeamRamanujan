# 🧪 Anvaya.AI — Test Users Reference Guide

> **Copy-paste guide for testing the full pipeline (Step 0 → Step 5) with each of the 5 test users.**
> All users share password: `1234`

---

## Quick Login Reference

| # | Name | Email | Role | Project |
|---|------|-------|------|---------|
| 1 | Alex Chen | `alex.chen@example.com` | CEO | E-Commerce Checkout Flow |
| 2 | Sarah Johnson | `sarah.johnson@example.com` | Marketing Lead | FinSafe App Launch |
| 3 | Denver-LB Council Sync | `denver.lb.council@example.com` | Legislative Coordinator | Municipal Policy & Zoning Oversight |
| 4 | Liam O'Connor | `liam.oconnor@example.com` | Lead Developer | Online Learning Platform Revamp |
| 5 | Michael Vance | `michael.vance@example.com` | Legislative Coordinator | Municipal Policy & Infrastructure Oversight |

---

## How to Create a Project for Testing

After logging in, click **"Initialize Project"** on the Dashboard. Fill:
- **Project Name**: Use the "Project" name from the table above
- **Description**: Use the proposal description from the user's data vault (shown below per user)

---

# 👤 User 1 — Alex Chen (CEO)

## Login
```
Email: alex.chen@example.com
Password: 1234
```

## Project Info
```
Project Name: E-Commerce Checkout Flow
Description: PCI-DSS Compliance & Penetration Test — Comprehensive penetration testing of checkout-related microservices, PCI-DSS Level 2 compliance readiness assessment, vulnerability remediation report, risk documentation aligned with insurance policy requirements.
```

## Step 0 — Ingestion (Upload Files + Review Channels)

### Files to Upload
Upload these files from `frontend/src/test/testuser1/`:
1. `CyberSafe_Security_Audit_Proposal.txt` — Vendor proposal ($15,000 USD, 14 business days)
2. `Meeting_Transcript_Feb05.txt` — Technical Architecture Review meeting transcript

### Channels That Will Appear
| Channel | Platform | Relevant? | Thread Name |
|---------|----------|-----------|-------------|
| Executive Strategic Sync | WhatsApp | ✅ Yes | Budget discussion: CFO says $45k limit, CEO pushes $55k, CTO says $80k needed |
| Friday Night Football ⚽ | WhatsApp | ❌ No | Social — football game planning |
| Chen Family Chat 🏠 | WhatsApp | ❌ No | Personal — family dinner |
| #checkout-dev-ops | Slack | ✅ Yes | Dev team discusses audit vs Stripe integration tradeoff |
| #random-and-memes | Slack | ❌ No | Social — cat videos, coffee machine |
| #hr-announcements | Slack | ❌ No | HR — expense reports |
| RE: Budget Realignment | Gmail | ✅ Yes | CFO confirms $55k total budget |
| Payment Compliance Reminder | Gmail | ✅ Yes | CTO warns about PCI compliance risk |
| Amazon order shipped | Gmail | ❌ No | Personal — mouse pad order |

### Meeting Data
- **Title**: Technical Architecture Review (Stakeholders Sync)
- **Date**: Feb 05, 2024
- **Participants**: Alex Chen (CEO), Rajesh Patel (CTO), Maria Santos (CFO)

**Key Discussion Points**:
- CyberSafe proposal: $15,000 for security audit
- Total budget: $55k
- CEO decides to skip external audit to fund Stripe integration
- All high-risk decisions to be logged

→ Click **"Launch Stage 1"** to begin stakeholder extraction.

## Step 1 — Stakeholders (Expected Extraction)

| Stakeholder | Role | Expected Influence | Stance |
|-------------|------|-------------------|--------|
| Alex Chen | CEO | High — Final decision maker | Skip audit, prioritize development speed |
| Rajesh Patel | CTO | High — Technical authority | Wants audit but accepts CEO override |
| Maria Santos | CFO | High — Budget controller | Hard limit $45-55k, concerned about legal exposure |
| James Liu | Senior Dev | Medium — Implementation | Flags security risk, marks as "High Risk" in logs |

## Step 2 — Facts (Key Facts to Expect)

- Budget capped at $55k total (CFO moved $10k from Marketing pool)
- CyberSafe audit costs $15,000 USD for 14 business days
- CEO decided to skip external audit to speed up development
- PCI-DSS compliance is mandatory for 'Pro Tier' payment processing license
- Internal scans alone are insufficient for full legal compliance
- Stripe integration gets priority over security audit
- All high-risk decisions and exceptions must be logged
- Partial PCI compliance evidence to be documented
- External audit deferred to Q2 if budget allows
- Backend tokenization & encryption tests must be documented even if audit skipped

## Step 3 — Conflicts (Expected Contradictions)

| Conflict | Side A | Side B |
|----------|--------|--------|
| **Budget** | CFO says $45k is hard limit | CEO pushes for $55k total |
| **Security Audit** | Dev team says $15k audit is critical | CEO says skip audit, use $15k for development |
| **Compliance** | External audit required for PCI license | CEO overrides: internal-only audit |

## Step 4 — Summary
Expected summary should cover: Budget decision ($55k), audit skip decision, risk management approach, Stripe integration priority, compliance mitigation logging.

## Step 5 — BRD Generation
BRD should synthesize: E-Commerce checkout flow requirements, $55k budget constraint, deferred security audit, PCI compliance partial evidence approach, prioritized Stripe integration.

---

# 👤 User 2 — Sarah Johnson (Marketing Lead)

## Login
```
Email: sarah.johnson@example.com
Password: 1234
```

## Project Info
```
Project Name: FinSafe App Launch
Description: FinSafe App Security Review & Marketing Launch Readiness — Review app security compliance for investor demo, provide recommendations for marketing data safety, generate vulnerability report aligned with launch requirements.
```

## Step 0 — Ingestion (Upload Files + Review Channels)

### Files to Upload
Upload these files from `frontend/src/test/testuser2/`:
1. `Critical_Bug_Report_API_v2.txt` — Bug report for API v2
2. `Marketing_Campaign_Timeline.txt` — Marketing campaign timeline doc

### Channels That Will Appear
| Channel | Platform | Relevant? | Thread Name |
|---------|----------|-----------|-------------|
| 🚀 FinSafe Launch Squad | WhatsApp | ✅ Yes | Friday launch discussion, $2M investor pitch, race condition in stock ticker |
| Morning Yoga 🧘‍♀️ | WhatsApp | ❌ No | Personal — yoga class time change |
| #finsafe-engineering | Slack | ✅ Yes | Engineering warns about unstable API, cached vs live data debate |
| #office-playlists | Slack | ❌ No | Social — jazz solo discussion |
| URGENT: Investor Pitch Deck | Gmail | ✅ Yes | CEO tells Sarah VCs will download app LIVE during Friday speech |
| Flash Sale: Standing Desks | Gmail | ❌ No | Spam — OfficeDepot |

### Meeting Data
- **Title**: Marketing & Security Launch Sync
- **Date**: Feb 06, 2024
- **Participants**: Sarah Johnson, Michael Torres (Engineering), David (Backend), Alex Chen (CEO)

**Key Discussion Points**:
- Friday launch non-negotiable for $2M investor pitch
- Race condition in stock ticker API — app may crash under 1000+ users
- Proposed "Beta" tag as workaround
- Cached data keeps it stable but Marketing promised "Live" updates
- All exceptions to be documented in investor deck

→ Click **"Launch Stage 1"** to extract stakeholders.

## Step 1 — Stakeholders

| Stakeholder | Role | Expected Influence | Stance |
|-------------|------|-------------------|--------|
| Sarah Johnson | Marketing Lead | High — Drives launch timeline | Launch is non-negotiable, use Beta disclaimer |
| Michael Torres | Engineering | High — Technical assessment | API unstable, needs 10 days to refactor |
| David | Backend Dev | Medium — Implementation | Cached data is stable, but Marketing promised Live |
| Alex Chen | CEO | High — Final authority | VCs must see live app Friday |

## Step 2 — Facts

- Friday launch is non-negotiable for $2M investor pitch at 4 PM
- Race condition in stock ticker API — crashes under 1000+ users
- "Beta" tag proposed as disclaimer
- Cached data keeps app stable but investors expect "Live" feed
- CEO told VCs they can download app LIVE during speech
- Engineering needs 10 days to refactor
- All exceptions to be logged in dev log and investor deck
- Vendor audit costs $12,500 for 10 business days

## Step 3 — Conflicts

| Conflict | Side A | Side B |
|----------|--------|--------|
| **Launch vs Stability** | Marketing: Friday launch, can't cancel investors | Engineering: 10 days needed to fix race condition |
| **Live vs Cached Data** | Marketing promised "Live" data in ads | Backend: Cached data is only stable option |
| **Risk Acceptance** | CEO says VCs download LIVE Friday | Engineering: API will crash under load |

## Step 4 — Summary
Summary should cover: Investor pitch priority, API instability risk, Beta disclaimer approach, cached vs live data tradeoff, risk documentation strategy.

## Step 5 — BRD
BRD should synthesize: FinSafe launch requirements, investor demo constraints, stability vs live-data tradeoff, risk mitigation for investor event.

---

# 👤 User 3 — Denver-LB Council Sync (Legislative Coordinator)

## Login
```
Email: denver.lb.council@example.com
Password: 1234
```

## Project Info
```
Project Name: Municipal Policy & Zoning Oversight
Description: Colorado AIDS Project (CAP) Contract — Provide health services and support through CAP, manage existing loan agreements for neighborhood development, execute contract amendments for health-related community building. $2,000,000 Franchise Renewal/Special Revenue.
```

## Step 0 — Ingestion (Upload Files + Review Channels)

### Files to Upload
Upload these files from `frontend/src/test/testuser3/`:
1. `Urban Rezoning & Neighborhood Development Loan Amendment.txt`
2. `meeting_transcripts_jan13.txt`

### Channels That Will Appear
| Channel | Platform | Relevant? | Thread Name |
|---------|----------|-----------|-------------|
| 🏛️ City Hall Strategy | WhatsApp | ✅ Yes | National Western Stock Show proclamation, zoning sign-off |
| #zoning-and-land-use | Slack | ✅ Yes | Council bill 153 for rezoning, $2M franchise renewal fee |
| MLK Jr. 50th Anniversary | Gmail | ✅ Yes | Proclamation celebrating MLK visit, 13 Eyes vote passed |

### Meeting Data
**Meeting 1**: Denver City Council Public Hearing (Jan 06, 2014)
- Participants: Speaker 3, Councilman Herndon, Councilwoman Ortega
- Topics: Zoning classification changes (M-RX-5 to M-MX-5), property at 8822 Bee

**Meeting 2**: Long Beach Municipal Review (Jan 07, 2014)
- Participants: Speaker 1, Speaker 2, Councilmember Johnson
- Topics: Ordinance amending Municipal Code (Chapter 9.61), City Manager authorization

## Step 1 — Stakeholders

| Stakeholder | Role | Influence | Stance |
|-------------|------|-----------|--------|
| Speaker 3 | Council representative | High | Zoning changes procedural |
| Councilman Herndon | Council member | Medium | Supports zoning amendments |
| Councilwoman Ortega | Council member | Medium | Participates in public hearings |
| Councilmember Johnson | Council member | High | Motion carries nine votes |

## Step 2 — Facts
- Zoning changes from M-RX-5 to M-MX-5 for property at 8822 Bee
- Long Beach Municipal Code adding Chapter 9.61
- City Manager authorized to execute amendments
- $2,000,000 franchise renewal/special revenue
- Colorado AIDS Project contract
- $1 million additional for Del Norte Neighborhood Development loan

## Step 3 — Conflicts

| Conflict | Details |
|----------|---------|
| Zoning density | R-MU-30 to high-density mixed-use flagged for bulk plane limitations |
| Budget flexibility | $1M additional for neighborhood development loan |
| Regulatory ambiguity | Temporary traffic caps vs interim mitigation on billboard ordinance |

## Step 4 & 5
Summary/BRD cover municipal zoning decisions, budget allocations, public health contracts, and procedural compliance.

---

# 👤 User 4 — Liam O'Connor (Lead Developer)

## Login
```
Email: liam.oconnor@example.com
Password: 1234
```

## Project Info
```
Project Name: Online Learning Platform Revamp
Description: Learning Platform Security & GDPR Compliance — Web application penetration testing for critical modules, GDPR data privacy compliance audit, detailed vulnerability report with remediation plans, comprehensive risk documentation.
```

## Step 0 — Ingestion (Upload Files + Review Channels)

### Files to Upload
Upload these files from `frontend/src/test/testuser4/`:
1. `Security_Policy_v4.txt`
2. `meeting_trans.txt`

### Channels That Will Appear
| Channel | Platform | Relevant? | Thread Name |
|---------|----------|-----------|-------------|
| GDPR & Security Ops | WhatsApp | ✅ Yes | Audit cost tightens budget, partial mitigation logs |
| #learning-dev-ops | Slack | ✅ Yes | GDPR audit essential, encryption/access control checks |
| GDPR Audit Funding | Gmail | ✅ Yes | $12.5k audit approved, document partial checks |

### Meeting Data
- **Title**: GDPR Compliance & Security Sync
- **Date**: Feb 12, 2024
- **Participants**: Liam O'Connor (Lead Dev), Eva Müller (CTO), Oliver Reed (CFO)

**Key Discussion Points**:
- EduSecure proposal: $12,500 for 12 days
- Total sprint budget: $40k
- Partial audit: critical modules first, minor modules later
- Skipped modules must be documented with risk levels
- API endpoints handling personal data and payments = priority
- Encryption, access controls, logging compliance required
- Regulators can request evidence at any point
- All decisions must be timestamped and logged

## Step 1 — Stakeholders

| Stakeholder | Role | Influence | Stance |
|-------------|------|-----------|--------|
| Liam O'Connor | Lead Dev | High | Partial audit acceptable, will document everything |
| Eva Müller | CTO | High | Partial = high risk, must document properly |
| Oliver Reed | CFO | High | $40k cap, $12.5k for audit, dev gets rest |
| Sara Kim | Senior Dev | Medium | GDPR audit essential, do not skip critical modules |

## Step 2 — Facts
- EduSecure audit: $12,500 for 12 business days
- Sprint budget: $40k total
- External audit required for GDPR certification
- Partial audit decided: critical modules first
- Skipped modules flagged as high risk
- API endpoints for personal data/payments get priority
- Encryption + access control testing mandatory
- Minor UI modules deferred but logged
- Regulators can request evidence at any point
- Internal reviewers assigned for skipped modules

## Step 3 — Conflicts

| Conflict | Side A | Side B |
|----------|--------|--------|
| **Audit completeness** | GDPR audit mandatory in full | Partial execution decided due to budget |
| **Budget allocation** | $12.5k for core audit | Leaves less for new learning features |
| **Regulatory risk** | Partial mitigation documented | Regulator acceptance unclear |

## Step 4 & 5
Summary/BRD cover GDPR compliance approach, partial audit justification, risk documentation, budget tradeoffs, and regulatory preparedness.

---

# 👤 User 5 — Michael Vance (Legislative Coordinator)

## Login
```
Email: michael.vance@example.com
Password: 1234
```

## Project Info
```
Project Name: Municipal Policy & Infrastructure Oversight
Description: Municipal Fleet Procurement & Infrastructure — Adopt Specifications No. ITB FS14-042 for vehicle fleet, authorize City Manager to execute fleet contracts, coordinate with Financial Management for budget approval.
```

## Step 0 — Ingestion (Upload Files + Review Channels)

### Files to Upload
Upload these files from `frontend/src/test/testuser5/`:
1. `proposal 5.txt` — Fleet procurement proposal
2. `meetings5.txt` — Meeting transcripts
3. `Proclamations_and_Sidelines.txt` — Proclamation documents

### Channels That Will Appear
| Channel | Platform | Relevant? | Thread Name |
|---------|----------|-----------|-------------|
| 🏛️ City Hall Strategy | WhatsApp | ✅ Yes | Tuskegee Airmen proclamation, IHO presentation |
| Intern Hangout | WhatsApp | ❌ No | Social — water bottle, intern banter |
| #zoning-land-use | Slack | ✅ Yes | Rezoning parcel at 2728 Zuni St from PUD 437 to C-MX-5 |
| #playlists | Slack | ❌ No | Social — jazz solo |
| National Western Stock Show Proclamation | Gmail | ✅ Yes | 109th Stock Show proclamation |

### Meeting Data
**Meeting 1**: Denver Airport Enterprises Review (Jan 05, 2015)
- Participants: Speaker 7, DAE Representatives
- Topics: Eliminating mid-term refurbishment requirement, streamlining DAE agreement

**Meeting 2**: Alameda Lease Final Passage (Jan 20, 2015)
- Participants: Speaker 0, City Staff
- Topics: Lease blocked by city official staff members

## Step 1 — Stakeholders

| Stakeholder | Role | Influence | Stance |
|-------------|------|-----------|--------|
| Speaker 7 | Council representative | High | Questions DAE refurbishment changes |
| DAE Rep | Airport enterprises | Medium | Streamlining agreement |
| Speaker 0 | Council representative | Medium | Lease blocked by officials |
| Speaker 3 | Council representative | High | Coordinates rezoning, proclamations |
| Speaker 5 | Council representative | Medium | IHO presentation, Stock Show |

## Step 2 — Facts
- Specification No. ITB FS14-042 for vehicle fleet procurement
- City Manager authorized to execute fleet contracts
- DAE mid-term refurbishment requirement eliminated
- Alameda lease blocked by city staff
- Rezoning: 2728 Zuni St from PUD 437 to C-MX-5
- Tuskegee Airmen proclamation set for Feb 24
- Inclusionary Housing Ordinance (IHO) presentation
- 109th National Western Stock Show proclamation

## Step 3 — Conflicts

| Conflict | Details |
|----------|---------|
| Lease blockage | Alameda lease can't proceed due to blocks from city officials |
| Refurbishment policy | DAE mid-term refurbishment eliminated vs commitment documentation |
| Zoning | Rezoning from PUD 437 to C-MX-5 may face opposition |

## Step 4 & 5
Summary/BRD cover fleet procurement, airport enterprise agreements, lease issues, zoning changes, and policy coordination.

---

## ⚡ Quick Reference: Files Per User

| User | Folder | Files |
|------|--------|-------|
| User 1 — Alex Chen | `testuser1/` | `CyberSafe_Security_Audit_Proposal.txt`, `Meeting_Transcript_Feb05.txt` |
| User 2 — Sarah Johnson | `testuser2/` | `Critical_Bug_Report_API_v2.txt`, `Marketing_Campaign_Timeline.txt` |
| User 3 — Denver-LB Council | `testuser3/` | `Urban Rezoning & Neighborhood Development Loan Amendment.txt`, `meeting_transcripts_jan13.txt` |
| User 4 — Liam O'Connor | `testuser4/` | `Security_Policy_v4.txt`, `meeting_trans.txt` |
| User 5 — Michael Vance | `testuser5/` | `proposal 5.txt`, `meetings5.txt`, `Proclamations_and_Sidelines.txt` |

> **Note**: Each testuser folder also contains a `README.md` and a stakeholder file (`U*_stackholder.txt`) for additional context. Only upload the main doc files listed above.

---

## 🔁 Resetting Test Users

Use the **"🔄 Refresh Test Users"** button on the Dashboard to:
1. Delete all existing users (cascade-deletes all projects, stakeholders, facts, contradictions, resolutions)
2. Re-create all 5 test users with fresh accounts
3. You'll be logged out — log back in with any test user credentials above
