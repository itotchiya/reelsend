# Acelle Mail API Integration Plan

## Overview

This plan details the full integration of the **Acelle Mail API** (`https://new.reelsend.com/api/v1`) into the Reelsend application, replacing Mailgun for email sending and tracking.

---

## 1. Data Model Mapping

### Acelle API ↔ Reelsend Database

| Acelle Concept | Reelsend Model | Notes |
|----------------|----------------|-------|
| **List** | `Audience` | Each Audience = Acelle List |
| **Subscriber** | `Contact` | Subscribers are contacts in an audience |
| **Campaign** | `Campaign` | Local campaign sends via Acelle |
| **Custom Fields** | `Contact` fields | firstName → FIRST_NAME, etc. |

### Contact Field Mapping

| Reelsend Contact | Acelle Subscriber Field | Type |
|------------------|-------------------------|------|
| `email` | `EMAIL` | Required |
| `firstName` | `FIRST_NAME` | Text |
| `lastName` | `LAST_NAME` | Text |
| `phone` | `PHONE` | Text |
| `country` | `COUNTRY` | Text |
| `city` | `CITY` | Text |
| `street` | `ADDRESS` | Text |
| `birthday` | `BIRTHDAY` | Date |
| `gender` | `GENDER` | Text |
| `status` | `status` | subscribed/unsubscribed |

---

## 2. Environment Variables

Add to `.env`:

```env
# Acelle Mail API
ACELLE_API_URL=https://new.reelsend.com/api/v1
ACELLE_API_TOKEN=your_api_token_here
ACELLE_USER_EMAIL=your_email@example.com
ACELLE_USER_PASSWORD=your_password
```

---

## 3. Implementation Tasks

### Phase 1: Core API Client

#### 3.1 Create Acelle Client Library
**File:** `src/lib/acelle.ts`

```typescript
// Core functions to implement:
- login() → Get API token
- getToken() → Cached token management

// Lists
- createList(audienceId, name, ...)
- getLists()
- getList(uid)
- deleteList(uid)
- addCustomField(listUid, type, label, tag)

// Subscribers
- createSubscriber(listUid, email, fields)
- updateSubscriber(id, fields)
- getSubscriber(id)
- subscribeContact(listUid, subscriberId)
- unsubscribeContact(listUid, subscriberId)
- deleteSubscriber(id)

// Campaigns
- createCampaign(listUid, name, subject, html, ...)
- getCampaign(uid)
- runCampaign(uid)
- pauseCampaign(uid)
- resumeCampaign(uid)

// Analytics
- downloadTrackingLog(campaignUid)
- downloadOpenLog(campaignUid)
- downloadClickLog(campaignUid)
- downloadBounceLog(campaignUid)
```

---

### Phase 2: Audience Sync

#### 3.2 Sync Audiences with Acelle Lists

**When to sync:**
- On audience creation → Create Acelle List
- On audience update → Update Acelle List (if needed)
- On audience deletion → Delete Acelle List

**Schema Update Required:**
Add `acelleListUid` to `Audience` model:

```prisma
model Audience {
  // ... existing fields
  acelleListUid String?  // Acelle List UID for sync
}
```

**API Changes:**
- `POST /api/audiences` → Also create Acelle list
- `DELETE /api/audiences/{id}` → Also delete Acelle list

---

### Phase 3: Contact Sync

#### 3.3 Sync Contacts with Acelle Subscribers

**When to sync:**
- On contact creation → Create Acelle Subscriber
- On contact update → Update Acelle Subscriber
- On contact status change → Subscribe/Unsubscribe in Acelle
- On contact deletion → Delete Acelle Subscriber

**Schema Update Required:**
Add `acelleSubscriberId` to `Contact` model:

```prisma
model Contact {
  // ... existing fields
  acelleSubscriberId String?  // Acelle Subscriber ID for sync
}
```

**Contact Create Form Fields:**
Current fields align well with Acelle. Ensure UI includes:
- [x] Email (required)
- [x] First Name
- [x] Last Name
- [x] Phone
- [x] Country
- [x] City
- [x] Street/Address
- [x] Birthday
- [x] Gender
- [x] Marital Status (custom field in Acelle)
- [x] Status (ACTIVE/UNSUBSCRIBED)

**API Changes:**
- `POST /api/contacts` → Also create Acelle subscriber
- `PATCH /api/contacts/{id}` → Also update Acelle subscriber
- `DELETE /api/contacts/{id}` → Also delete Acelle subscriber

---

### Phase 4: Campaign Sending

#### 3.4 Replace Mailgun with Acelle for Sending

**Current Flow:**
1. User clicks "Start Campaign"
2. `/api/campaigns/{id}/send` uses Mailgun
3. Contacts are sent emails directly

**New Flow:**
1. User clicks "Start Campaign"
2. `/api/campaigns/{id}/send`:
   - Creates campaign in Acelle with HTML content
   - Points to synced Acelle List (audience)
   - Calls `runCampaign(uid)` to start sending
3. Acelle handles all email delivery

**API Changes:**
- Replace `src/lib/mailgun.ts` → Use `src/lib/acelle.ts`
- Update `POST /api/campaigns/{id}/send`
- Update `POST /api/campaigns/{id}/test`

**Schema Update:**
Add `acelleCampaignUid` to `Campaign` model:

```prisma
model Campaign {
  // ... existing fields
  acelleCampaignUid String?  // Acelle Campaign UID
}
```

---

### Phase 5: Analytics Sync

#### 3.5 Fetch Analytics from Acelle

**Options:**
1. **Polling** - Periodically fetch logs from Acelle
2. **On-demand** - Fetch when user views campaign

**Recommended: On-demand + Caching**

When viewing campaign analytics:
1. Check if data is stale (> 5 minutes old)
2. Fetch logs from Acelle:
   - `GET /api/v1/campaigns/{uid}/open-log/download`
   - `GET /api/v1/campaigns/{uid}/click-log/download`
   - `GET /api/v1/campaigns/{uid}/bounce-log/download`
3. Parse CSV and update `CampaignAnalytics`

**API Changes:**
- Create `POST /api/campaigns/{id}/sync-analytics`
- Update campaign page to call sync before display

---

### Phase 6: Segmentation

#### 3.6 Handle Segments

Acelle doesn't have built-in segmentation matching our model.

**Strategy:**
Create a **temporary list** for segment-based campaigns:
1. When sending to segment, create a new Acelle list
2. Add only segment contacts to that list
3. Send campaign to that list
4. Optionally delete list after campaign

---

## 4. Migration Checklist

### Database Changes

```prisma
model Audience {
  acelleListUid String?
}

model Contact {
  acelleSubscriberId String?
}

model Campaign {
  acelleCampaignUid String?
}
```

### Files to Create

- [ ] `src/lib/acelle.ts` - API client
- [ ] `src/lib/acelle-sync.ts` - Sync utilities

### Files to Modify

- [ ] `src/app/api/audiences/route.ts` - Create list on audience create
- [ ] `src/app/api/audiences/[id]/route.ts` - Delete list on audience delete
- [ ] `src/app/api/contacts/route.ts` - Sync contacts (create, if exists)
- [ ] `src/app/api/contacts/[id]/route.ts` - Sync updates/deletes
- [ ] `src/app/api/campaigns/[id]/send/route.ts` - Use Acelle to send
- [ ] `src/app/api/campaigns/[id]/test/route.ts` - Use Acelle for test
- [ ] Campaign client page - Add sync analytics button

### Files to Remove/Deprecate

- [ ] `src/lib/mailgun.ts` - Replace with Acelle
- [ ] `src/app/api/webhooks/mailgun/route.ts` - No longer needed

---

## 5. Task Breakdown

### Week 1: Foundation

| # | Task | Priority |
|---|------|----------|
| 1 | Add env variables for Acelle | High |
| 2 | Create `src/lib/acelle.ts` client | High |
| 3 | Implement authentication (login/token) | High |
| 4 | Run Prisma migration for new fields | High |

### Week 2: Audience & Contact Sync

| # | Task | Priority |
|---|------|----------|
| 5 | Implement list CRUD in acelle.ts | High |
| 6 | Update audience API to sync with Acelle | High |
| 7 | Implement subscriber CRUD in acelle.ts | High |
| 8 | Update contact API to sync with Acelle | High |
| 9 | Add custom fields to Acelle lists | Medium |

### Week 3: Campaign Sending

| # | Task | Priority |
|---|------|----------|
| 10 | Implement campaign CRUD in acelle.ts | High |
| 11 | Replace Mailgun send with Acelle | High |
| 12 | Implement test email with Acelle | High |
| 13 | Handle segment-based campaigns | Medium |

### Week 4: Analytics & Polish

| # | Task | Priority |
|---|------|----------|
| 14 | Implement analytics fetching | High |
| 15 | Create sync-analytics endpoint | High |
| 16 | Add polling/refresh UI for analytics | Medium |
| 17 | Remove Mailgun code | Low |
| 18 | Test end-to-end flow | High |

---

## 6. UI Changes Required

### Contact Creation Form
Ensure all fields are present:
- Email, First Name, Last Name
- Phone, Country, City, Street
- Birthday (date picker)
- Gender (dropdown)
- Marital Status (dropdown)
- Status (Active/Unsubscribed toggle)

### Campaign Page
- Add "Sync Analytics" button
- Show last sync time
- Remove SMTP-related warnings

### Audience Page
- Show sync status (synced/not synced)
- Add manual sync button

---

## 7. Error Handling

| Scenario | Handling |
|----------|----------|
| Acelle API down | Queue sync, retry later |
| Duplicate email | Skip and log |
| Invalid token | Re-authenticate |
| List not found | Re-create list |

---

## Ready to Start?

Once you approve this plan, I will:
1. Run the Prisma migration
2. Create the Acelle client library
3. Implement each task in order

**Please review and confirm to proceed!**
