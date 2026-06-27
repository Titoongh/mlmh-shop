# Robust Stripe Implementation Deployment Guide

> ⚠️ **Historical document.** The migration is complete: the sync-pattern webhook now
> lives at **`/api/webhook/stripe`** (the old v1 handler was removed). References below
> to `/api/webhook/stripe-v2` correspond to that same handler at its final path; the
> Stripe dashboard endpoint stays `/api/webhook/stripe`.

This guide explains how to deploy the new robust Stripe implementation based on the video recommendations while maintaining backward compatibility and preventing data loss.

## Overview

The new implementation addresses the following issues from the old system:
- **Split Brain Problem**: No more relying solely on Stripe API or webhooks
- **No Customer Management**: Proper Stripe customer creation before checkout
- **Slow Verification**: Fast KV store for purchase verification
- **No User Purchase History**: Users can now log in and see all purchases
- **Webhook Reliability**: Webhooks trigger data sync, not direct database updates

## Pre-Deployment Setup

### 1. Environment Variables

Add these new environment variables to your production environment:

```bash
# Upstash Redis for KV store
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Existing Stripe variables (should already be set)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Database Schema Updates

⚠️ **IMPORTANT**: Do NOT run these schema changes without consulting first, as per your instructions.

The new schema adds these models:
- `User` - For Clerk integration
- `StripeCustomer` - Maps users to Stripe customers  
- `Purchase` - Replaces DownloadIntent with better tracking
- `PurchaseItem` - Individual items within purchases

The old `DownloadIntent` and `Download` models are kept for backward compatibility.

### 3. Stripe Dashboard Configuration

1. **Enable "Limit customers to one subscription"**:
   - Go to Settings → Checkout and payment links → Subscriptions
   - Check "Multiple subscriptions" → "Limit customers to one subscription"
   - This prevents double-billing issues

2. **Disable Cash App Pay** (recommended):
   - This payment method is prone to fraud attempts
   - Disable unless you specifically need it

3. **Configure Webhook Endpoints**:
   - Keep existing webhook for gradual transition
   - Add new webhook endpoint: `your-domain/api/webhook/stripe-v2`
   - Configure these events:
     ```
     checkout.session.completed
     checkout.session.expired
     payment_intent.succeeded
     payment_intent.payment_failed
     customer.updated
     customer.deleted
     charge.succeeded
     charge.failed
     ```

## Deployment Strategy

### Phase 1: Parallel System Deployment

1. **Deploy new code without switching endpoints**
   ```bash
   # New endpoints are available but not used yet:
   # /api/checkout-v2 (new checkout)
   # /api/webhook/stripe-v2 (new webhook)
   # /api/download-v2 (new download)
   # /user/downloads (new user interface)
   ```

2. **Test the new system**:
   - Use `/api/checkout-v2` for test purchases
   - Verify webhook processing at `/api/webhook/stripe-v2`
   - Test user downloads at `/user/downloads`

3. **Run migration script** (optional, for historical data):
   ```bash
   cd /Users/martinlelong/Code/projects/mlmh-shop/mlmh-shop-app
   tsx scripts/migrate-to-robust-stripe.ts
   ```

### Phase 2: Gradual Traffic Migration

1. **Update checkout forms to use new endpoint**:
   ```javascript
   // Change from:
   fetch('/api/checkout', ...)
   // To:
   fetch('/api/checkout-v2', ...)
   ```

2. **Update success page redirect**:
   ```javascript
   // Change success_url from:
   success_url: `/checkout/?success=true&session_id={CHECKOUT_SESSION_ID}`
   // To:
   success_url: `/checkout/success?session_id={CHECKOUT_SESSION_ID}`
   ```

3. **Monitor both systems**:
   - Keep old endpoints running
   - Watch logs for errors in new system
   - Verify purchase data is syncing to KV store

### Phase 3: Full Migration

1. **Switch webhook endpoint in Stripe Dashboard**:
   - Change primary webhook from `/api/webhook/stripe` to `/api/webhook/stripe-v2`
   - Keep old webhook as backup during transition

2. **Update all download links**:
   - Email templates should use new download logic
   - Old session-based downloads still work via `/api/download-v2`

3. **Deploy user interface updates**:
   - Add navigation to `/user/downloads`
   - Update account pages to show purchase history

## Key Features of New System

### For Users
- **Login and Access**: Users can log in and access all their purchases
- **Purchase History**: Full history with redownload capability  
- **Better UX**: Success page with real-time confirmation
- **Multiple Downloads**: Download purchased items anytime

### For Developers
- **Fast Verification**: KV store lookup instead of Stripe API calls
- **Robust Webhooks**: Webhooks trigger sync, don't rely on webhook data
- **Customer Management**: Proper customer creation before checkout
- **Error Handling**: Better error messages and recovery
- **Monitoring**: Extensive logging for debugging

### For Business
- **Prevent Double Billing**: Stripe-level protection against multiple subscriptions
- **Reduce Fraud**: Better payment method controls
- **User Retention**: Users can access purchases long-term
- **Support**: Better tools for helping customers

## API Endpoints Reference

### New Endpoints
- `POST /api/checkout-v2` - Robust checkout with customer creation
- `POST /api/webhook/stripe-v2` - Webhook with sync pattern
- `GET /api/download-v2` - Supports both session and user-based downloads
- `POST /api/checkout-v2/confirm-session` - Force sync on success page
- `GET /user/downloads` - User purchase history interface

## Monitoring and Alerts

### Key Metrics to Monitor
1. **KV Store Performance**:
   - Cache hit rates for purchase verification
   - Sync function execution time
   - Redis connection errors

2. **Stripe Integration**:
   - Customer creation success rate
   - Webhook processing errors  
   - Session completion rates

3. **User Experience**:
   - Success page load times
   - Download completion rates
   - Purchase verification errors

### Recommended Alerts
- Failed customer creation attempts
- Webhook processing failures
- KV store sync errors
- High error rates on new endpoints

## Rollback Plan

If issues arise, you can quickly rollback:

1. **Switch traffic back to old endpoints**:
   - Revert checkout forms to use `/api/checkout`
   - Switch Stripe webhook back to `/api/webhook/stripe`

2. **Database rollback**:
   - New tables don't affect old system
   - Old DownloadIntent/Download tables remain unchanged

3. **KV store**:
   - Can be cleared without affecting old system functionality
   - Old system doesn't depend on KV store

## Testing Checklist

Before going live, test:

- [ ] User can sign up and checkout
- [ ] Stripe customer is created before checkout
- [ ] Checkout session completes successfully  
- [ ] Webhook processes and syncs data to KV
- [ ] Success page shows confirmation and redirects
- [ ] User can access purchase history
- [ ] User can redownload purchases
- [ ] Download includes all purchased files
- [ ] Error handling works for failed payments
- [ ] Legacy downloads still work for old purchases

## Support and Troubleshooting

### Common Issues

1. **"No customer ID found"**:
   - User needs to be authenticated before checkout
   - Check Clerk authentication setup

2. **"Purchase not found"**:
   - KV store may be out of sync
   - Use `/api/checkout-v2/confirm-session` to force sync

3. **"Download not authorized"**:
   - Check purchase verification logic
   - Verify KV store contains purchase data

### Debug Tools

- Check KV store contents via Upstash dashboard
- Monitor Stripe logs for webhook delivery
- Use browser dev tools to inspect API responses
- Check database for Purchase vs DownloadIntent records

### Getting Help

- Review video recommendations: https://github.com/t3dotgg/stripe-recommendations
- Check Stripe documentation for API changes
- Monitor this repository for updates and bug fixes

## Conclusion

This robust Stripe implementation provides a much more reliable and user-friendly purchase system while maintaining full backward compatibility. The gradual deployment strategy ensures no data loss and minimal risk during the transition.

The key improvements align with industry best practices and address the core issues identified in the video tutorial.