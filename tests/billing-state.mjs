import test from 'node:test';
import assert from 'node:assert/strict';
import { selectBillingSnapshot } from '../supabase/functions/_shared/billing-state.ts';
const subscription = (id, status, price = 'price_allowed', created = 1) => ({ id, status, created, customer: 'cus_test', items: { data: [{ price: { id: price }, current_period_end: 2000000000 }] } });
test('only the configured price can produce premium entitlement', () => {
  assert.equal(selectBillingSnapshot([subscription('sub_other','active','price_wrong')], 'price_allowed').plan, 'free');
  assert.equal(selectBillingSnapshot([], 'price_allowed').status, 'none');
});
test('active matching subscription wins over newer canceled subscriptions', () => {
  const result = selectBillingSnapshot([subscription('sub_old','active'), subscription('sub_new','canceled','price_allowed',10)], 'price_allowed');
  assert.equal(result.id, 'sub_old'); assert.equal(result.status, 'active');
});
test('cancellation and payment failure preserve their actual state without trusting metadata', () => {
  for (const status of ['canceled','unpaid','past_due','incomplete']) {
    const result = selectBillingSnapshot([{ ...subscription('sub_test',status), metadata: {plan:'premium'} }], 'price_allowed');
    assert.equal(result.status, status); assert(!['active','trialing'].includes(result.status));
  }
  const result = selectBillingSnapshot([{ ...subscription('sub_test','active'), cancel_at_period_end:true }], 'price_allowed');
  assert.equal(result.cancel_at_period_end,true);assert.equal(result.current_period_end,new Date(2000000000*1000).toISOString());
});
