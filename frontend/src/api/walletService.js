import { apiRequest } from './apiClient.js';

/**
 * Generate a unique transaction reference identifier.
 */
export function generateRefId(prefix = 'TX') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}

/**
 * Recharge user wallet balance.
 * Endpoint: POST /api/wallet/recharge?amount={amount}&refId={refId}
 */
export async function rechargeWallet(amount, refId = generateRefId('RCG')) {
  const query = new URLSearchParams({
    amount: String(amount),
    refId,
  });
  return apiRequest(`/api/wallet/recharge?${query.toString()}`, {
    method: 'POST',
    auth: true,
  });
}

/**
 * Withdraw funds from user's unreserved balance.
 * Endpoint: POST /api/wallet/withdraw?amount={amount}&refId={refId}
 */
export async function withdrawFunds(amount, refId = generateRefId('WTH')) {
  const query = new URLSearchParams({
    amount: String(amount),
    refId,
  });
  return apiRequest(`/api/wallet/withdraw?${query.toString()}`, {
    method: 'POST',
    auth: true,
  });
}

/**
 * Reserve funds for an active bid.
 * Endpoint: POST /api/wallet/reserve?amount={amount}&refId={refId}
 */
export async function reserveFunds(amount, refId = generateRefId('RSV')) {
  const query = new URLSearchParams({
    amount: String(amount),
    refId,
  });
  return apiRequest(`/api/wallet/reserve?${query.toString()}`, {
    method: 'POST',
    auth: true,
  });
}

/**
 * Release reserved funds (e.g. outbid or cancelled).
 * Endpoint: POST /api/wallet/release?amount={amount}&refId={refId}
 */
export async function releaseFunds(amount, refId = generateRefId('RLS')) {
  const query = new URLSearchParams({
    amount: String(amount),
    refId,
  });
  return apiRequest(`/api/wallet/release?${query.toString()}`, {
    method: 'POST',
    auth: true,
  });
}

/**
 * Deduct funds for escrow on settlement.
 * Endpoint: POST /api/wallet/escrow/deduct?amount={amount}&refId={refId}
 */
export async function deductForEscrow(amount, refId = generateRefId('ESC_DED')) {
  const query = new URLSearchParams({
    amount: String(amount),
    refId,
  });
  return apiRequest(`/api/wallet/escrow/deduct?${query.toString()}`, {
    method: 'POST',
    auth: true,
  });
}

/**
 * Settle seller payment from escrow.
 * Endpoint: POST /api/wallet/escrow/settle?amount={amount}&refId={refId}
 */
export async function settleSellerPayment(amount, refId = generateRefId('ESC_SET')) {
  const query = new URLSearchParams({
    amount: String(amount),
    refId,
  });
  return apiRequest(`/api/wallet/escrow/settle?${query.toString()}`, {
    method: 'POST',
    auth: true,
  });
}
