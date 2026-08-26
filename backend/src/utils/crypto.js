import crypto from 'node:crypto';
import { SECRET, AUTH_TOKEN_TTL, TOKEN_TTL } from '../config/env.js';
import { read, write } from '../repositories/jsonStore.js';

export function hashPin(pin, salt) {
  return crypto
    .scryptSync(String(pin || '').trim().toUpperCase(), salt, 32)
    .toString('hex');
}

export function verifyPin(pin, participant) {
  try {
    if (!participant?.salt || !participant?.pinHash) return false;
    const attempt = hashPin(pin, participant.salt);
    return crypto.timingSafeEqual(
      Buffer.from(attempt, 'hex'),
      Buffer.from(participant.pinHash, 'hex')
    );
  } catch {
    return false;
  }
}

export function hashSecret(secret, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: crypto.scryptSync(String(secret), salt, 32).toString('hex'),
  };
}

export function safeEqualHex(a, b) {
  try {
    const x = Buffer.from(String(a), 'hex');
    const y = Buffer.from(String(b), 'hex');
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  } catch {
    return false;
  }
}

export function issueToken(id) {
  const body = Buffer.from(
    JSON.stringify({
      id,
      exp: Date.now() + TOKEN_TTL,
    })
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(body)
    .digest('base64url');

  return ${body}.;
}

export function readToken(token) {
  if (!token || !token.includes('.')) return null;

  const [body, sig] = token.split('.');
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(body)
    .digest('base64url');

  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export function setAuthToken(kind, participantId) {
  const raw = crypto.randomBytes(32).toString('base64url');
  const all = read('auth-tokens.json', []);
  const digest = crypto.createHash('sha256').update(raw).digest('hex');
  all.push({ kind, participantId, digest, expiresAt: Date.now() + AUTH_TOKEN_TTL, usedAt: null });
  write('auth-tokens.json', all.filter((t) => !t.usedAt && t.expiresAt > Date.now()));
  return raw;
}

export function consumeAuthToken(kind, raw) {
  const digest = crypto.createHash('sha256').update(String(raw || '')).digest('hex');
  const all = read('auth-tokens.json', []);
  const token = all.find((t) => t.kind === kind && !t.usedAt && t.expiresAt > Date.now() && safeEqualHex(t.digest, digest));
  if (!token) return null;
  token.usedAt = Date.now();
  write('auth-tokens.json', all);
  return token;
}\n