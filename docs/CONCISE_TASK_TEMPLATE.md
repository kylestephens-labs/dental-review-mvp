# 🎯 **Concise Task Template**

## **Task Details**
- **Title**: [Task Name]
- **Type**: [Functional/Non-Functional]
- **Priority**: [P0/P1/P2]
- **Duration**: [Estimated hours]

## **Goal**
[One sentence describing what needs to be accomplished]

## **Key Requirements**
- [ ] [Critical requirement 1]
- [ ] [Critical requirement 2]
- [ ] [Critical requirement 3]

## **Files to Create/Modify**
- `path/to/file1.ts` - [Purpose]
- `path/to/file2.ts` - [Purpose]

## **Dependencies**
- [What must be done first]
- [External resources needed]

## **Success Criteria**
- [How to know it's done]
- [What to test]

---

## **Example: Task 6 - Stripe Webhook**

**Task Details**
- **Title**: POST /webhooks/stripe with signature verify
- **Type**: Functional
- **Priority**: P0
- **Duration**: 6 hours

**Goal**
Create secure Stripe webhook endpoint that verifies signatures and creates practice + settings on checkout.session.completed.

**Key Requirements**
- [ ] Verify Stripe signature using STRIPE_WEBHOOK_SECRET
- [ ] Handle checkout.session.completed event only
- [ ] Create practice record with status='provisioning'
- [ ] Create settings with defaults (locale='en', quiet hours, cap)
- [ ] Store billing JSON from Stripe session
- [ ] Log events row with type='stripe_checkout'
- [ ] Handle idempotency (duplicate events)
- [ ] Return 200 on success, 400 on invalid signature

**Files to Create/Modify**
- `backend/src/api/webhooks/stripe.ts` - Main webhook endpoint
- `backend/src/utils/stripe.ts` - Stripe client and signature verification
- `backend/src/models/practices.ts` - createPractice function
- `backend/src/models/settings.ts` - createDefaultSettings function
- `backend/src/models/events.ts` - insertEvent, getEventByStripeId

**Dependencies**
- Task 5: Stripe product/price validated
- Migrations 001, 002 applied
- STRIPE_WEBHOOK_SECRET in .env

**Success Criteria**
- Stripe CLI test creates practice + settings + event
- Invalid signature returns 400
- Duplicate events handled idempotently
- All tests pass
