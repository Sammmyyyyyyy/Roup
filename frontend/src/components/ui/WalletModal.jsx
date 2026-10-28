import React, { useState } from 'react';
import { generateRefId, rechargeWallet, withdrawFunds } from '../../api/walletService.js';
import { useAuth } from '../../store/appContext.js';

export default function WalletModal({ isOpen, onClose }) {
  const { session, updateUser } = useAuth();
  const [tab, setTab] = useState('recharge'); // 'recharge' | 'withdraw'
  const [amount, setAmount] = useState('');
  const [refId, setRefId] = useState(() => generateRefId('RCG'));
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  if (!isOpen) return null;

  const user = session?.user;
  const available = Number(user?.availableBalance ?? 0);
  const reserved = Number(user?.reservedBalance ?? 0);
  const total = Number(user?.totalBalance ?? (available + reserved));

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setAmount('');
    setRefId(generateRefId(nextTab === 'recharge' ? 'RCG' : 'WTH'));
    setFeedback({ type: '', message: '' });
  };

  const setPreset = (value) => {
    setAmount(String(value));
    setFeedback({ type: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid amount greater than 0.' });
      return;
    }

    if (tab === 'withdraw' && numAmount > available) {
      setFeedback({
        type: 'error',
        message: `Insufficient unreserved balance. You can withdraw up to $${available.toFixed(2)}.`,
      });
      return;
    }

    setLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      if (tab === 'recharge') {
        const res = await rechargeWallet(numAmount, refId.trim() || generateRefId('RCG'));
        const newAvailable = available + numAmount;
        const newTotal = total + numAmount;
        if (updateUser) {
          updateUser({ availableBalance: newAvailable, totalBalance: newTotal });
        }
        setFeedback({
          type: 'success',
          message: typeof res === 'string' ? res : `Successfully recharged $${numAmount.toFixed(2)} to your wallet!`,
        });
        setAmount('');
        setRefId(generateRefId('RCG'));
      } else {
        const res = await withdrawFunds(numAmount, refId.trim() || generateRefId('WTH'));
        const newAvailable = Math.max(0, available - numAmount);
        const newTotal = Math.max(0, total - numAmount);
        if (updateUser) {
          updateUser({ availableBalance: newAvailable, totalBalance: newTotal });
        }
        setFeedback({
          type: 'success',
          message: typeof res === 'string' ? res : `Successfully withdrew $${numAmount.toFixed(2)} from your wallet!`,
        });
        setAmount('');
        setRefId(generateRefId('WTH'));
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || `Wallet ${tab} failed. Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title">
      <div className="mp-modal" style={{ maxWidth: '500px' }}>
        <button
          className="mp-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close wallet modal"
        >
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ color: 'var(--mint)', display: 'grid', placeItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </span>
          <h2 id="wallet-modal-title" style={{ margin: 0 }}>Roup Wallet</h2>
        </div>
        <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '12px' }}>
          Real-time account balance &amp; escrow reserves linked to Roup Wallet-Svc.
        </p>

        {/* Balance Summary Cards */}
        <div className="mp-metrics" style={{ margin: '0 0 20px', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div className="mp-metric" style={{ minHeight: '90px', padding: '12px 14px' }}>
            <span>Available</span>
            <b style={{ fontSize: '18px', color: 'var(--mint)' }}>${available.toFixed(2)}</b>
            <small>Unreserved</small>
          </div>
          <div className="mp-metric" style={{ minHeight: '90px', padding: '12px 14px' }}>
            <span>Reserved</span>
            <b style={{ fontSize: '18px', color: '#c1a46b' }}>${reserved.toFixed(2)}</b>
            <small>Active bids</small>
          </div>
          <div className="mp-metric" style={{ minHeight: '90px', padding: '12px 14px' }}>
            <span>Total</span>
            <b style={{ fontSize: '18px' }}>${total.toFixed(2)}</b>
            <small>Ledger balance</small>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="mp-tabs" style={{ margin: '0 0 16px' }}>
          <button
            type="button"
            className={tab === 'recharge' ? 'is-active' : ''}
            onClick={() => handleTabChange('recharge')}
          >
            + Recharge Wallet
          </button>
          <button
            type="button"
            className={tab === 'withdraw' ? 'is-active' : ''}
            onClick={() => handleTabChange('withdraw')}
          >
            - Withdraw Funds
          </button>
        </div>

        {feedback.message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '14px',
              fontSize: '12px',
              border: `1px solid ${feedback.type === 'error' ? 'rgba(207,128,120,.4)' : 'rgba(75,226,160,.4)'}`,
              background: feedback.type === 'error' ? 'rgba(207,128,120,.1)' : 'rgba(75,226,160,.1)',
              color: feedback.type === 'error' ? '#cf8078' : 'var(--mint)',
            }}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </div>
        )}

        {/* Form */}
        <form className="mp-form" onSubmit={handleSubmit} style={{ marginTop: '0' }}>
          <label>
            Amount ($ USD)
            <input
              type="number"
              step="any"
              min="0.01"
              max={tab === 'withdraw' ? available : undefined}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </label>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '-4px 0 6px' }}>
            {tab === 'recharge' ? (
              [50, 100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPreset(val)}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid var(--line-hi)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  +${val}
                </button>
              ))
            ) : (
              [
                { label: '25%', factor: 0.25 },
                { label: '50%', factor: 0.5 },
                { label: '75%', factor: 0.75 },
                { label: 'Max', factor: 1.0 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPreset((available * preset.factor).toFixed(2))}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid var(--line-hi)',
                    borderRadius: '4px',
                    background: 'var(--bg-2)',
                    color: 'var(--text)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  disabled={available <= 0}
                >
                  {preset.label}
                </button>
              ))
            )}
          </div>

          <label>
            Transaction Reference ID
            <input
              type="text"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              required
            />
          </label>

          <p style={{ margin: '4px 0 12px', fontSize: '10px', color: 'var(--quiet)' }}>
            Transactions are recorded in Roup double-entry ledger via idempotent reference IDs.
          </p>

          <div className="mp-form-actions">
            <button
              className="mp-button mp-button-secondary"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="mp-button mp-button-primary"
              type="submit"
              disabled={loading || !amount}
            >
              {loading
                ? 'Processing...'
                : tab === 'recharge'
                ? `Confirm Recharge ($${amount ? parseFloat(amount).toFixed(2) : '0.00'})`
                : `Confirm Withdrawal ($${amount ? parseFloat(amount).toFixed(2) : '0.00'})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
