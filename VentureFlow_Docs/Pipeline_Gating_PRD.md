# Pipeline Gating & Fee Structure — PRD

## Overview
This document describes the configurable pipeline gating and monetization system for VentureFlow's deal pipeline. Admins can define entry conditions per stage and trigger automatic fee calculations when deals transition between stages.

---

## Key Concepts

### Dual Pipeline Architecture
VentureFlow operates two independent deal pipelines:

| Pipeline | Display Name | VentureFlow Role | Client |
|---|---|---|---|
| `buyer` | Investor's Pipeline | Financial Advisor for the buyer | Investor (buyer) |
| `seller` | Target Pipeline | Financial Advisor for the seller | Target (seller) |

Each deal belongs to **exactly one pipeline** via its `pipeline_type` column. Deals never appear on both tabs.

### Pipeline Stages
Each pipeline has its own set of stages with independent configurations. Same stage codes (A, B, C, etc.) can exist in both pipelines with different names and rules.

**Investor Pipeline:**
| Code | Stage | Progress |
|---|---|---|
| A | Target Sourcing | 10% |
| B | Initial Interest | 20% |
| ... | ... | ... |
| I | Success | 100% |

**Target Pipeline:**
| Code | Stage | Progress |
|---|---|---|
| A | Teaser & Buyer Outreach | 10% |
| B | NDA & IM Release | 20% |
| ... | ... | ... |
| I | Success | 100% |

---

## Gate Rules

### Purpose
Gate rules are conditions that must be met **before** a deal can move to a particular stage. All rules follow AND logic — every rule must pass for entry.

### Supported Fields

| Field | Description | Operators |
|---|---|---|
| `both_parties` | Buyer + Seller assigned | is |
| `has_buyer` | Buyer assigned | is |
| `has_seller` | Seller assigned | is |
| `ticket_size` | Ticket size in USD | greater than, less than, equals |
| `priority` | Deal priority level | is, is not |
| `probability` | Deal probability | is, is not |
| `has_documents` | Document count | more than |
| `industry` | Industry field | is set |

### How It Works
1. Admin configures gate rules per stage in **Settings → Pipeline Workflow**
2. When a deal is moved (drag-and-drop or forward/backward arrows), the frontend calls `GET /api/deals/{id}/stage-check`
3. If rules pass → move proceeds (or monetization modal appears)
4. If rules fail → error toasts are shown, move is blocked

---

## Monetization / Fee Structure

### Purpose
Automatically calculate and record advisory fees when deals enter monetization-enabled stages.

### Configuration
Per-stage monetization is configured in **Settings → Pipeline Workflow** under each stage's config panel:
- **Enable monetization** toggle
- **Payment type**: one-time or monthly
- **Deduct from success fee**: whether the fee should be credited against the final success fee

### Fee Calculation
1. Fees are determined by the **FeeTier** model based on the deal's `ticket_size`
2. The **fee side** is determined by the deal's pipeline:
   - `buyer` pipeline → fee_side = `investor`
   - `seller` pipeline → fee_side = `target`
3. Matching fee tier is found by `fee_type` (investor/target) + amount range
4. Fee is calculated via fixed amount or percentage rate

### User Confirmation
A confirmation modal appears showing:
- Ticket size, fee tier, rate, and calculated amount
- Editable final amount (admin can override)
- "Deduct from success fee" toggle
- "Confirm & Move" button records the fee and completes the stage transition

---

## Architecture

### Stage Transition Flow
```
┌──────────────────┐
│   User moves     │
│  deal on board   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  GET stage-check │────▶│  Evaluate gate   │
│  (pre-flight)    │     │  rules (AND)     │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
    ┌────▼────┐              ┌────▼────┐
    │ Failed  │              │ Passed  │
    │ → Toast │              └────┬────┘
    │  errors │                   │
    └─────────┘          ┌────────▼────────┐
                         │  Monetization   │
                         │  enabled?       │
                         └───┬──────┬──────┘
                         No  │      │  Yes
                             │      │
                    ┌────────▼──┐ ┌─▼──────────┐
                    │ PATCH     │ │ Show modal, │
                    │ /stage    │ │ user edits  │
                    └───────────┘ │ & confirms  │
                                  └──────┬─────┘
                                         │
                                 ┌───────▼──────┐
                                 │ PATCH /stage  │
                                 │ + fee_confirm │
                                 └──────────────┘
```

### API Endpoints 

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/deals/{id}/stage-check` | Pre-flight gate + monetization check |
| `PATCH` | `/api/deals/{id}/stage` | Execute stage move + optional fee recording |
| `POST` | `/api/pipeline-stages/bulk` | Save stage configs (gate rules + monetization) |

### Database Schema

**`deals` table** — added `pipeline_type` column:
```sql
pipeline_type VARCHAR(10) DEFAULT 'buyer'
-- Determines which pipeline (buyer/seller) the deal belongs to
```

**`pipeline_stages` table** — added JSON columns:
```sql
gate_rules JSON       -- Array of {field, operator, value} objects
monetization_config JSON  -- {enabled, type, deduct_from_success_fee}
```

**`deal_fees` table** (new):
```sql
deal_id, fee_tier_id, stage_code, fee_side, fee_type,
calculated_amount, final_amount, deducted_from_success, notes
```

---

## Files Modified

### Backend
- `database/migrations/2026_02_16_200000_add_gate_rules_and_monetization_to_pipeline_stages.php`
- `database/migrations/2026_02_16_200001_create_deal_fees_table.php`
- `database/migrations/2026_02_16_200002_add_pipeline_type_to_deals_table.php`
- `app/Models/PipelineStage.php` — gate_rules + monetization_config casts
- `app/Models/DealFee.php` — new model
- `app/Models/Deal.php` — pipeline_type in fillable, fees() relationship
- `app/Http/Controllers/DealController.php` — index filtering, stageCheck, updateStage, evaluateGateRules
- `app/Http/Controllers/PipelineStageController.php` — updateBulk with gate/monetization config
- `routes/api.php` — stage-check route

### Frontend
- `src/pages/settings/components/PipelineSettings.tsx` — Rule Builder + Monetization config UI
- `src/pages/deals/components/MonetizationConfirmModal.tsx` — new component
- `src/pages/deals/DealPipeline.tsx` — stageCheck integration, gate error toasts, monetization modal

---

*Last updated: February 2026*
