import test from 'node:test';
import assert from 'node:assert/strict';

// Helper functions for call duration and status mapping
function formatCallDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0s';
  const s = Math.round(Number(seconds));
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}m ${rem}s`;
}

function calculateCallMetrics(calls) {
  const total = calls.length;
  if (total === 0) {
    return { total: 0, completed: 0, successRate: 0, avgDurationSec: 0, totalDurationSec: 0 };
  }

  const completed = calls.filter((c) => {
    const s = (c?.status || '').toLowerCase();
    return s === 'completed' || s === 'ended' || s === 'success';
  }).length;

  const totalDurationSec = calls.reduce((acc, c) => {
    const d = Number(c?.duration || c?.durationSeconds || 0);
    return acc + (isNaN(d) ? 0 : d);
  }, 0);

  const avgDurationSec = Math.round(totalDurationSec / total);
  const successRate = Math.round((completed / total) * 100);

  return { total, completed, successRate, avgDurationSec, totalDurationSec };
}

test('formatCallDuration formats sub-minute and multi-minute seconds correctly', () => {
  assert.strictEqual(formatCallDuration(0), '0s');
  assert.strictEqual(formatCallDuration(45), '45s');
  assert.strictEqual(formatCallDuration(60), '1m 0s');
  assert.strictEqual(formatCallDuration(125), '2m 5s');
  assert.strictEqual(formatCallDuration(null), '0s');
  assert.strictEqual(formatCallDuration('invalid'), '0s');
});

test('calculateCallMetrics computes total, completed, and talk-time averages correctly', () => {
  const calls = [
    { id: 'call-1', status: 'completed', duration: 60 },
    { id: 'call-2', status: 'ended', duration: 120 },
    { id: 'call-3', status: 'failed', duration: 0 },
    { id: 'call-4', status: 'completed', duration: 180 },
  ];

  const metrics = calculateCallMetrics(calls);
  assert.strictEqual(metrics.total, 4);
  assert.strictEqual(metrics.completed, 3);
  assert.strictEqual(metrics.successRate, 75); // 3 of 4 = 75%
  assert.strictEqual(metrics.totalDurationSec, 360);
  assert.strictEqual(metrics.avgDurationSec, 90); // 360 / 4 = 90
});

test('calculateCallMetrics handles empty call arrays gracefully without division by zero', () => {
  const metrics = calculateCallMetrics([]);
  assert.strictEqual(metrics.total, 0);
  assert.strictEqual(metrics.completed, 0);
  assert.strictEqual(metrics.successRate, 0);
  assert.strictEqual(metrics.avgDurationSec, 0);
  assert.strictEqual(metrics.totalDurationSec, 0);
});
