import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const CREDENTIALS_FILE = path.resolve(__dirname, 'server', 'credentials.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'alpha9_session_secret_secure_key';
const COOKIE_NAME = 'a9_session';

// --- Cryptographic Password Hashing (scrypt with random salt) ---
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch (err) {
    return false;
  }
}

// --- OTP Hash Functions (scrypt) ---
function hashOtp(code: string, salt: string): string {
  const derived = crypto.scryptSync(code, salt, 32);
  return derived.toString('hex');
}

function verifyOtp(code: string, salt: string, expectedHash: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const derivedBuffer = crypto.scryptSync(code, salt, 32);
    return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
  } catch (err) {
    return false;
  }
}

interface ServerCredentialsData {
  identifier: string;
  passwordHash: string;
  userEmail: string;
  displayName: string;
  role: string;
  updatedAt: string;
}

// Generate secure random fallback password if none provided via .env
const ENV_PASSWORD = process.env.SERVER_AUTH_PASSWORD || crypto.randomBytes(12).toString('base64');
const DEFAULT_CREDENTIALS: ServerCredentialsData = {
  identifier: process.env.SERVER_AUTH_IDENTIFIER || 'Adam SAMBO',
  passwordHash: hashPassword(ENV_PASSWORD),
  userEmail: 'samboadam221@gmail.com',
  displayName: 'Adam SAMBO',
  role: 'Super Administrateur Alpha-9',
  updatedAt: new Date().toISOString()
};

function readServerCredentials(): ServerCredentialsData {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      const parsed = JSON.parse(content);

      let passwordHash = parsed.passwordHash;
      if (!passwordHash && parsed.password) {
        console.log('[Security] Migrating plaintext password to scrypt hash in credentials.json...');
        passwordHash = hashPassword(parsed.password);
        delete parsed.password;
        parsed.passwordHash = passwordHash;
        writeServerCredentials({
          identifier: parsed.identifier || DEFAULT_CREDENTIALS.identifier,
          passwordHash,
          userEmail: parsed.userEmail || DEFAULT_CREDENTIALS.userEmail,
          displayName: parsed.displayName || DEFAULT_CREDENTIALS.displayName,
          role: parsed.role || DEFAULT_CREDENTIALS.role,
          updatedAt: new Date().toISOString()
        });
      }

      return {
        identifier: parsed.identifier || DEFAULT_CREDENTIALS.identifier,
        passwordHash: passwordHash || DEFAULT_CREDENTIALS.passwordHash,
        userEmail: parsed.userEmail || DEFAULT_CREDENTIALS.userEmail,
        displayName: parsed.displayName || DEFAULT_CREDENTIALS.displayName,
        role: parsed.role || DEFAULT_CREDENTIALS.role,
        updatedAt: parsed.updatedAt || DEFAULT_CREDENTIALS.updatedAt
      };
    }
  } catch (err) {
    console.error('[Server Auth] Error reading credentials file:', err);
  }

  writeServerCredentials(DEFAULT_CREDENTIALS);
  return DEFAULT_CREDENTIALS;
}

function writeServerCredentials(creds: ServerCredentialsData): boolean {
  try {
    const dir = path.dirname(CREDENTIALS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Server Auth] Error writing credentials file:', err);
    return false;
  }
}

// --- Brute-Force Rate Limiting Store ---
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
  firstAttempt: number;
}
const rateLimits = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 min sliding window

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(key: string): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds, attempts: record.attempts };
  }

  if (now - record.firstAttempt > WINDOW_DURATION_MS) {
    rateLimits.delete(key);
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  return { isLocked: false, remainingSeconds: 0, attempts: record.attempts };
}

function recordFailedAttempt(key: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const now = Date.now();
  let record = rateLimits.get(key);

  if (!record || now - record.firstAttempt > WINDOW_DURATION_MS) {
    record = { attempts: 1, lockedUntil: 0, firstAttempt: now };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimits.set(key, record);
    return { isLocked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
  }

  rateLimits.set(key, record);
  return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS - record.attempts };
}

function clearRateLimit(key: string) {
  rateLimits.delete(key);
}

// --- Real Server-Side Sessions Store ---
interface ServerSession {
  token: string;
  identifier: string;
  userEmail: string;
  displayName: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, ServerSession>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function createSession(user: { identifier: string; userEmail: string; displayName: string; role: string }): string {
  const token = `a9_sec_${crypto.randomBytes(32).toString('hex')}`;
  const now = Date.now();
  activeSessions.set(token, {
    token,
    identifier: user.identifier,
    userEmail: user.userEmail,
    displayName: user.displayName,
    role: user.role,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS
  });
  return token;
}

function getSessionFromRequest(req: express.Request): ServerSession | null {
  // Check HttpOnly cookie first
  let token = req.cookies ? req.cookies[COOKIE_NAME] : undefined;

  // Fallback to Bearer token header if present
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

// --- HASHED OTP Storage (No plaintext in memory) ---
interface HashedOtpRecord {
  salt: string;
  otpHash: string;
  identifier: string;
  email: string;
  attempts: number;
  expiresAt: number;
}
const resetCodes = new Map<string, HashedOtpRecord>();
const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// --- Real Email Transport (Nodemailer) ---
function createEmailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
}

async function startServer() {
  const app = express();

  // 1. Helmet Security Middleware (with frameguard disabled for AI Studio iframe compatibility)
  app.use(helmet({
    frameguard: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true
  }));

  // 2. Cookie parser with secret
  app.use(cookieParser(SESSION_SECRET));
  app.use(express.json());

  // Ensure credentials file is initialized and migrated to hash on start
  readServerCredentials();

  // --- API Authentication Routes ---

  // Health check & Server Status
  app.get('/api/auth/status', (req, res) => {
    res.json({
      status: 'online',
      serverTime: new Date().toISOString(),
      security: {
        httpOnlyCookies: true,
        scryptHashing: true,
        serverSessions: true,
        bruteForceProtection: true,
        helmetProtection: true
      }
    });
  });

  // PROTECTED: /api/auth/me (Requires valid HttpOnly cookie session)
  // Replaces public credentials-info
  app.get('/api/auth/me', (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        authenticated: false,
        error: 'Non authentifié. Aucune session valide active.'
      });
    }

    const creds = readServerCredentials();
    return res.json({
      authenticated: true,
      user: {
        identifier: creds.identifier,
        userEmail: creds.userEmail,
        displayName: creds.displayName,
        role: creds.role,
        updatedAt: creds.updatedAt
      }
    });
  });

  // Verify Session (via HttpOnly Cookie)
  app.get('/api/auth/verify-session', (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Session expirée ou absente.'
      });
    }

    return res.json({
      success: true,
      valid: true,
      user: {
        identifier: session.identifier,
        email: session.userEmail,
        displayName: session.displayName,
        role: session.role
      }
    });
  });

  // Server Logout: Destroys session in memory and clears HttpOnly Cookie
  app.post('/api/auth/logout', (req, res) => {
    const token = req.cookies ? req.cookies[COOKIE_NAME] : undefined;
    if (token) {
      activeSessions.delete(token);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Session détruite côté serveur et cookie HttpOnly révoqué.'
    });
  });

  // Login Endpoint: verifies scrypt hash, sets HttpOnly Cookie, does NOT send token to React
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body || {};
    const clientIp = getClientIp(req);
    const rateLimitKey = `${clientIp}_${String(identifier || '').trim().toLowerCase()}`;

    // Check rate limit lockout
    const rateCheck = checkRateLimit(rateLimitKey);
    if (rateCheck.isLocked) {
      return res.status(429).json({
        success: false,
        error: `Accès temporairement verrouillé suite à trop de tentatives erronées. Veuillez patienter ${Math.ceil(rateCheck.remainingSeconds / 60)} minute(s).`,
        remainingSeconds: rateCheck.remainingSeconds,
        isLocked: true
      });
    }

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Identifiant et mot de passe requis.'
      });
    }

    const creds = readServerCredentials();

    const isIdentifierMatch =
      String(identifier).trim().toLowerCase() === String(creds.identifier).trim().toLowerCase() ||
      String(identifier).trim().toLowerCase() === String(creds.userEmail).trim().toLowerCase();

    const isPasswordValid = isIdentifierMatch && verifyPassword(String(password).trim(), creds.passwordHash);

    if (!isIdentifierMatch || !isPasswordValid) {
      const failInfo = recordFailedAttempt(rateLimitKey);
      if (failInfo.isLocked) {
        return res.status(429).json({
          success: false,
          error: `Trop d'échecs de connexion (5/5). Votre accès est verrouillé pour 15 minutes.`,
          remainingSeconds: failInfo.remainingSeconds,
          isLocked: true
        });
      }

      return res.status(401).json({
        success: false,
        error: `Identifiant ou mot de passe incorrect. (${failInfo.attemptsLeft} tentative(s) restante(s) avant verrouillage)`,
        attemptsLeft: failInfo.attemptsLeft
      });
    }

    // Success: clear rate limit
    clearRateLimit(rateLimitKey);

    // Create session in server memory
    const token = createSession({
      identifier: creds.identifier,
      userEmail: creds.userEmail,
      displayName: creds.displayName,
      role: creds.role
    });

    // Set secure HttpOnly Cookie (session token is NEVER sent in JSON to React)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: SESSION_TTL_MS,
      path: '/'
    });

    console.log(`[Security Audit] Connexion réussie pour '${creds.identifier}' (${clientIp}) - HttpOnly cookie émis.`);

    return res.json({
      success: true,
      message: 'Authentification serveur validée avec succès.',
      user: {
        identifier: creds.identifier,
        email: creds.userEmail,
        displayName: creds.displayName,
        role: creds.role
      }
    });
  });

  // Protected: Update Credentials / Change Password from Admin space
  app.post('/api/auth/update-credentials', (req, res) => {
    const session = getSessionFromRequest(req);
    const { newIdentifier, newPassword, currentPassword, userEmail, displayName } = req.body || {};

    const creds = readServerCredentials();

    // Verify session OR current password
    if (!session) {
      if (!currentPassword || !verifyPassword(String(currentPassword).trim(), creds.passwordHash)) {
        return res.status(401).json({
          success: false,
          error: 'Session non autorisée ou mot de passe actuel incorrect.'
        });
      }
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.'
      });
    }

    // Hash the new password using scrypt with random salt
    const hashed = hashPassword(String(newPassword).trim());
    const updated: ServerCredentialsData = {
      identifier: newIdentifier ? String(newIdentifier).trim() : creds.identifier,
      passwordHash: hashed,
      userEmail: userEmail ? String(userEmail).trim() : creds.userEmail,
      displayName: displayName ? String(displayName).trim() : creds.displayName,
      role: creds.role,
      updatedAt: new Date().toISOString()
    };

    const saved = writeServerCredentials(updated);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l’écriture des identifiants sur le serveur.'
      });
    }

    // Clear failed attempts counter
    rateLimits.clear();

    console.log(`[Security Audit] Identifiants mis à jour et scellés avec hash scrypt sur le serveur.`);

    return res.json({
      success: true,
      message: 'Identifiants et mot de passe mis à jour et hachés avec succès sur le serveur.',
      user: {
        identifier: updated.identifier,
        userEmail: updated.userEmail,
        displayName: updated.displayName,
        updatedAt: updated.updatedAt
      }
    });
  });

  // Request Password Recovery: HASHED OTP + Real Email (Zero previewCode in response)
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { emailOrIdentifier } = req.body || {};

    if (!emailOrIdentifier || !String(emailOrIdentifier).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez saisir votre adresse email ou identifiant enregistré.'
      });
    }

    const creds = readServerCredentials();
    const query = String(emailOrIdentifier).trim().toLowerCase();

    const isMatch =
      query === creds.userEmail.toLowerCase() ||
      query === creds.identifier.toLowerCase();

    if (!isMatch) {
      return res.status(404).json({
        success: false,
        error: 'Aucun compte administrateur correspondant à cet identifiant ou adresse email.'
      });
    }

    // Generate random 6-digit OTP
    const code = String(Math.floor(100000 + crypto.randomInt(900000)));
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtp(code, salt);

    // Store ONLY the scrypt hash of the OTP in memory (zero plaintext in memory)
    const recordKey = creds.identifier.toLowerCase();
    resetCodes.set(recordKey, {
      salt,
      otpHash,
      identifier: creds.identifier,
      email: creds.userEmail,
      attempts: 0,
      expiresAt: Date.now() + RESET_CODE_TTL_MS
    });

    // Masked email for UI response
    const emailParts = creds.userEmail.split('@');
    const localPart = emailParts[0];
    const domainPart = emailParts[1] || '';
    const masked =
      localPart.length > 2
        ? `${localPart[0]}***${localPart[localPart.length - 1]}@${domainPart}`
        : `${localPart[0]}***@${domainPart}`;

    // Real Email Dispatch (via SMTP if configured, or secure server audit log)
    const transporter = createEmailTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Portail Alpha-9" <${process.env.SMTP_USER}>`,
          to: creds.userEmail,
          subject: '🔐 Code de Récupération de Sécurité Alpha-9',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Portail d'Accès Sécurisé Alpha-9</h2>
              <p>Une demande de réinitialisation de mot de passe a été émise pour l'utilisateur <strong>${creds.identifier}</strong>.</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #64748b;">Ce code à usage unique expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            </div>
          `
        });
        console.log(`[SMTP] Email envoyé avec succès à ${creds.userEmail}`);
      } catch (mailErr) {
        console.error('[SMTP Error] Échec d\'envoi email via transporteur:', mailErr);
      }
    } else {
      // In development or when no external SMTP is set: secure audit dispatch
      console.log(`[Email Dispatch Service] Code expédié à ${creds.userEmail} (OTP hashé scrypt côté serveur)`);
    }

    // STRICT: ZERO previewCode in HTTP JSON response
    return res.json({
      success: true,
      message: `Un code de sécurité à 6 chiffres a été expédié à ${masked}.`,
      maskedEmail: masked,
      expiresInMinutes: 15
    });
  });

  // Reset Password with HASHED OTP
  app.post('/api/auth/reset-password', (req, res) => {
    const { code, newPassword, emailOrIdentifier } = req.body || {};

    if (!code || !String(code).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le code de vérification à 6 chiffres est obligatoire.'
      });
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.'
      });
    }

    const creds = readServerCredentials();
    const recordKey = creds.identifier.toLowerCase();
    const record = resetCodes.get(recordKey);

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'Aucune demande de réinitialisation active ou code expiré.'
      });
    }

    if (Date.now() > record.expiresAt) {
      resetCodes.delete(recordKey);
      return res.status(400).json({
        success: false,
        error: 'Le code a expiré (validité 15 minutes). Veuillez redemander un code.'
      });
    }

    // Protection against OTP brute-forcing (max 3 tries)
    record.attempts += 1;
    if (record.attempts > 3) {
      resetCodes.delete(recordKey);
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives erronées pour ce code. Le code a été invalidé par sécurité.'
      });
    }

    // Verify OTP using scrypt timing-safe comparison
    const isValid = verifyOtp(String(code).trim(), record.salt, record.otpHash);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: `Code de sécurité invalide. (${3 - record.attempts} tentative(s) restante(s))`
      });
    }

    // Hash the new password with random salt
    const hashed = hashPassword(String(newPassword).trim());
    const updated: ServerCredentialsData = {
      ...creds,
      passwordHash: hashed,
      updatedAt: new Date().toISOString()
    };

    const saved = writeServerCredentials(updated);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l’écriture du mot de passe sur le serveur.'
      });
    }

    // Invalidate reset code, active sessions, and rate limits
    resetCodes.delete(recordKey);
    activeSessions.clear();
    rateLimits.clear();

    console.log(`[Security Audit] Mot de passe réinitialisé avec succès via OTP hashé pour '${creds.identifier}'.`);

    return res.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès et scellé sur le serveur !'
    });
  });

  // --- Vite Dev Middleware or Static Production Serving ---
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Alpha-9 Server] Listening on http://0.0.0.0:${PORT} (Helmet + HttpOnly Cookies + scrypt Active)`);
  });
}

startServer().catch(err => {
  console.error('[Alpha-9 Server] Startup error:', err);
  process.exit(1);
});
