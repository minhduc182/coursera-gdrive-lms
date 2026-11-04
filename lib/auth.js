const crypto = require('crypto');
const { getProjectConfig, saveProjectConfig } = require('./gdrive');

const COOKIE_NAME = 'ml_workspace_sid';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const failedAttempts = new Map(); // ip -> { count, lockedUntil, lastAttempt }

function applyStealthHeaders(res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

function getClientIp(req) {
  const xff = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const rec = failedAttempts.get(ip);
  if (!rec) return false;
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
    return true;
  }
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    failedAttempts.delete(ip);
  }
  return false;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const prev = failedAttempts.get(ip) || { count: 0, lockedUntil: null, lastAttempt: now };
  if (now - prev.lastAttempt > 10 * 60 * 1000) {
    prev.count = 0;
  }
  prev.count += 1;
  prev.lastAttempt = now;
  if (prev.count >= 6) {
    prev.lockedUntil = now + 15 * 60 * 1000; // Lock 15 minutes
  }
  failedAttempts.set(ip, prev);
}

function clearFailedLogin(ip) {
  failedAttempts.delete(ip);
}

function signSessionToken(username, secret) {
  const payloadObj = {
    u: username,
    exp: Date.now() + SESSION_TTL_MS
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

function isRequestAuthenticated(req) {
  const cfg = getProjectConfig();
  if (!cfg.auth?.enabled) return { authenticated: true, user: cfg.auth?.username || 'admin' };

  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const verified = verifySessionToken(token, cfg.auth.secret);
  if (verified) {
    return { authenticated: true, user: verified.u };
  }
  return { authenticated: false, user: null };
}

function verifyCredentials(inputUser, inputPass) {
  const cfg = getProjectConfig();
  const u = String(inputUser || '').trim().toLowerCase();
  const p = String(inputPass || '');
  const validUsers = new Set([
    String(cfg.auth.username || '').toLowerCase(),
    ...(cfg.auth.aliases || []).map(a => String(a).toLowerCase())
  ]);
  if (!validUsers.has(u)) return false;
  return p === cfg.auth.password;
}

function buildSetCookieHeader(token, isHttps = false) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

function buildClearCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

function renderStealthLoginPage() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
  <meta name="referrer" content="no-referrer" />
  <title>MinducLab — Private Workspace</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: #0F172A;
      color: #F8FAFC;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 32px 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
    }
    .auth-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
    }
    .auth-badge {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2563EB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .auth-title {
      font-size: 18px;
      font-weight: 700;
      color: #F8FAFC;
    }
    .auth-sub {
      font-size: 12.5px;
      color: #94A3B8;
      margin-top: 2px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #CBD5E1;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px 12px;
      background: #0F172A;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #F8FAFC;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-input:focus {
      border-color: #3B82F6;
    }
    .auth-btn {
      width: 100%;
      padding: 11px 16px;
      background: #2563EB;
       hover: #1D4ED8;
      color: #FFFFFF;
      border: none;
      border-radius: 6px;
      font-size: 14.5px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 6px;
      transition: background 0.15s;
    }
    .auth-btn:hover { background: #1D4ED8; }
    .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-err {
      margin-top: 12px;
      padding: 9px 12px;
      border-radius: 6px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #FCA5A5;
      font-size: 13px;
      display: none;
    }
    .auth-footer {
      margin-top: 20px;
      font-size: 11.5px;
      color: #64748B;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="auth-card">
    <div class="auth-brand">
      <div class="auth-badge">ML</div>
      <div>
        <div class="auth-title">MinducLab Workspace</div>
        <div class="auth-sub">Hệ thống lưu trữ nội bộ cá nhân — Yêu cầu xác thực</div>
      </div>
    </div>
    <form id="loginForm">
      <div class="form-group">
        <label class="form-label" for="username">Tài khoản</label>
        <input class="form-input" id="username" name="username" type="text" autocomplete="username" placeholder="duc.to.dev@gmail.com hoặc minduc" required autofocus />
      </div>
      <div class="form-group">
        <label class="form-label" for="password">Mật khẩu truy cập</label>
        <input class="form-input" id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
      </div>
      <button class="auth-btn" id="submitBtn" type="submit">Đăng nhập hệ thống</button>
      <div class="auth-err" id="errBox"></div>
    </form>
    <div class="auth-footer">Protected by MinducLab Access Gateway · Authorized Personnel Only</div>
  </div>
  <script>
    const form = document.getElementById('loginForm');
    const errBox = document.getElementById('errBox');
    const btn = document.getElementById('submitBtn');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Đang xác thực...';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('password').value
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Sai thông tin đăng nhập');
        }
        window.location.reload();
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Đăng nhập hệ thống';
      }
    });
  </script>
</body>
</html>`;
}

function updateAuthPassword(newPassword, newUsername) {
  const cfg = getProjectConfig();
  const nextAuth = {
    ...cfg.auth,
    password: String(newPassword || cfg.auth.password)
  };
  if (newUsername && newUsername.trim()) {
    nextAuth.username = newUsername.trim();
  }
  return saveProjectConfig({ auth: nextAuth });
}

module.exports = {
  COOKIE_NAME,
  applyStealthHeaders,
  getClientIp,
  isRateLimited,
  recordFailedLogin,
  clearFailedLogin,
  signSessionToken,
  isRequestAuthenticated,
  verifyCredentials,
  buildSetCookieHeader,
  buildClearCookieHeader,
  renderStealthLoginPage,
  updateAuthPassword
};
