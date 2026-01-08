# Acelle Integration Tasks

## Phase 1: Foundation
- [ ] Add Acelle env variables to `.env`
- [ ] Create `src/lib/acelle.ts` API client
- [ ] Implement authentication (login/token caching)
- [ ] Add new fields to Prisma schema (acelleListUid, acelleSubscriberId, acelleCampaignUid)
- [ ] Run Prisma migration

## Phase 2: Audience Sync
- [ ] Implement list CRUD in `acelle.ts`
- [ ] Update `POST /api/audiences` to create Acelle list
- [ ] Update `DELETE /api/audiences/[id]` to delete Acelle list
- [ ] Add custom fields to Acelle lists on creation

## Phase 3: Contact Sync
- [ ] Implement subscriber CRUD in `acelle.ts`
- [ ] Update `POST /api/contacts` to create subscriber
- [ ] Update `PATCH /api/contacts/[id]` to update subscriber
- [ ] Update `DELETE /api/contacts/[id]` to delete subscriber
- [ ] Handle status changes (subscribe/unsubscribe)

## Phase 4: Campaign Sending
- [ ] Implement campaign CRUD in `acelle.ts`
- [ ] Replace Mailgun in `/api/campaigns/[id]/send`
- [ ] Replace Mailgun in `/api/campaigns/[id]/test`
- [ ] Handle segment-based campaigns (temp list strategy)

## Phase 5: Analytics
- [ ] Implement analytics fetching (CSV parsing)
- [ ] Create `/api/campaigns/[id]/sync-analytics` endpoint
- [ ] Update campaign page to show sync button
- [ ] Cache analytics with 5-minute refresh

## Phase 6: Cleanup
- [ ] Remove Mailgun dependencies
- [ ] Remove `/api/webhooks/mailgun`
- [ ] Update UI to remove SMTP warnings
- [ ] End-to-end testing
