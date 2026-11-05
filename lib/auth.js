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
  <title>Welcome back | Learning Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --cds-blue: #0056D2;
      --cds-blue-hover: #00419E;
      --cds-blue-light: #E8F0FE;
      --cds-text: #1F1F1F;
      --cds-text-secondary: #5B6780;
      --cds-border: #8892A0;
      --cds-border-light: #E5E7EB;
      --cds-bg: #F5F7F8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--cds-bg);
      color: var(--cds-text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    /* Coursera Global Top Header */
    .cds-login-header {
      height: 64px;
      background: #FFFFFF;
      border-bottom: 1px solid var(--cds-border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
    }
    .cds-login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .cds-brand-wordmark {
      font-family: 'Inter', sans-serif;
      font-size: 27px;
      font-weight: 800;
      letter-spacing: -0.045em;
      color: var(--cds-blue);
      line-height: 1;
      user-select: none;
    }
    .cds-brand-sep {
      width: 1px;
      height: 22px;
      background: var(--cds-border-light);
    }
    .cds-brand-tag {
      font-size: 13px;
      font-weight: 600;
      color: var(--cds-text-secondary);
      letter-spacing: 0.01em;
    }
    /* Main Centered Stage */
    .cds-login-stage {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 36px 16px;
    }
    .cds-login-card {
      width: 100%;
      max-width: 440px;
      background: #FFFFFF;
      border: 1px solid var(--cds-border-light);
      border-radius: 8px;
      padding: 36px 40px 32px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    }
    .cds-login-heading {
      font-size: 28px;
      font-weight: 700;
      color: var(--cds-text);
      text-align: center;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .cds-login-subheading {
      font-size: 14.5px;
      color: var(--cds-text-secondary);
      text-align: center;
      margin-bottom: 26px;
    }
    .cds-field {
      margin-bottom: 18px;
    }
    .cds-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .cds-label {
      font-size: 14px;
      font-weight: 700;
      color: var(--cds-text);
    }
    .cds-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .cds-input {
      width: 100%;
      height: 48px;
      padding: 0 14px;
      font-family: inherit;
      font-size: 15px;
      color: var(--cds-text);
      background: #FFFFFF;
      border: 1px solid var(--cds-border);
      border-radius: 4px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .cds-input--pwd {
      padding-right: 44px;
    }
    .cds-input::placeholder {
      color: #6B7280;
    }
    .cds-input:hover {
      border-color: var(--cds-text);
    }
    .cds-input:focus {
      border-color: var(--cds-blue);
      box-shadow: 0 0 0 2px var(--cds-blue-light);
    }
    .cds-pwd-toggle {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      color: var(--cds-text-secondary);
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    .cds-pwd-toggle:hover {
      background: #F3F4F6;
      color: var(--cds-text);
    }
    .cds-forgot-link {
      display: inline-block;
      margin-top: 6px;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--cds-blue);
      text-decoration: none;
      cursor: pointer;
    }
    .cds-forgot-link:hover {
      text-decoration: underline;
    }
    .cds-submit-btn {
      width: 100%;
      height: 48px;
      margin-top: 6px;
      background: var(--cds-blue);
      color: #FFFFFF;
      border: none;
      border-radius: 4px;
      font-family: inherit;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .cds-submit-btn:hover {
      background: var(--cds-blue-hover);
    }
    .cds-submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .cds-error-banner {
      display: none;
      margin-bottom: 16px;
      padding: 11px 14px;
      border-radius: 4px;
      background: #FEF3F2;
      border: 1px solid #FECDCA;
      border-left: 4px solid #D92D20;
      color: #B42318;
      font-size: 13.5px;
      font-weight: 600;
      line-height: 1.45;
    }
    .cds-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0;
      color: var(--cds-text-secondary);
      font-size: 13px;
    }
    .cds-divider::before,
    .cds-divider::after {
      content: "";
      flex: 1;
      height: 1px;
      background: var(--cds-border-light);
    }
    .cds-social-btn {
      width: 100%;
      height: 46px;
      background: #FFFFFF;
      border: 1px solid var(--cds-border);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: inherit;
      font-size: 14.5px;
      font-weight: 700;
      color: var(--cds-text);
      cursor: pointer;
      transition: background 0.12s, border-color 0.12s;
      margin-bottom: 10px;
    }
    .cds-social-btn:hover {
      background: #F5F7F8;
      border-color: var(--cds-text);
    }
    .cds-footer-note {
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid var(--cds-border-light);
      text-align: center;
      font-size: 12px;
      color: var(--cds-text-secondary);
      line-height: 1.5;
    }
    @media (max-width: 480px) {
      .cds-login-card { padding: 28px 22px; }
    }
  </style>
</head>
<body>
  <header class="cds-login-header">
    <a href="/" class="cds-login-brand">
      <span class="cds-brand-wordmark">coursera</span>
      <span class="cds-brand-sep"></span>
      <span class="cds-brand-tag">Personal Learning Portal</span>
    </a>
    <div style="font-size: 13px; font-weight: 600; color: var(--cds-text-secondary);">
      Google Drive Connected
    </div>
  </header>

  <main class="cds-login-stage">
    <div class="cds-login-card">
      <h1 class="cds-login-heading">Welcome back</h1>
      <p class="cds-login-subheading">Log in to access your courses, transcripts, and learning roadmap</p>

      <div id="errBox" class="cds-error-banner"></div>

      <form id="loginForm">
        <div class="cds-field">
          <div class="cds-label-row">
            <label class="cds-label" for="username">Email or username</label>
          </div>
          <div class="cds-input-wrap">
            <input
              class="cds-input"
              id="username"
              name="username"
              type="text"
              autocomplete="username"
              placeholder="name@email.com"
              required
              autofocus
            />
          </div>
        </div>

        <div class="cds-field">
          <div class="cds-label-row">
            <label class="cds-label" for="password">Password</label>
          </div>
          <div class="cds-input-wrap">
            <input
              class="cds-input cds-input--pwd"
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
            />
            <button type="button" class="cds-pwd-toggle" id="togglePwdBtn" title="Show/Hide password" aria-label="Toggle password visibility">
              <svg id="eyeIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <a class="cds-forgot-link" id="quickFillLink">Use configured Drive account (duc.to.dev@gmail.com)</a>
        </div>

        <button class="cds-submit-btn" id="submitBtn" type="submit">Login</button>
      </form>

      <div class="cds-divider"><span>or</span></div>

      <button type="button" class="cds-social-btn" id="btnGoogleQuick">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
          <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"/>
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"/>
        </svg>
        <span>Continue with duc.to.dev@gmail.com</span>
      </button>

      <div class="cds-footer-note">
        Private Learning Gateway · Protected by <code>noindex, nofollow</code> · 30-day persistent session
      </div>
    </div>
  </main>

  <script>
    const form = document.getElementById('loginForm');
    const errBox = document.getElementById('errBox');
    const btn = document.getElementById('submitBtn');
    const userInp = document.getElementById('username');
    const pwdInp = document.getElementById('password');
    const togglePwdBtn = document.getElementById('togglePwdBtn');

    togglePwdBtn.addEventListener('click', () => {
      const isPwd = pwdInp.type === 'password';
      pwdInp.type = isPwd ? 'text' : 'password';
    });

    const fillAccount = (e) => {
      e.preventDefault();
      userInp.value = 'duc.to.dev@gmail.com';
      pwdInp.focus();
    };
    document.getElementById('quickFillLink').addEventListener('click', fillAccount);
    document.getElementById('btnGoogleQuick').addEventListener('click', fillAccount);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Logging in...';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: userInp.value.trim(),
            password: pwdInp.value
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Invalid email or password.');
        }
        window.location.reload();
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Login';
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
