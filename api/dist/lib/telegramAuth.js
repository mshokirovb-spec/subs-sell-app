"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTelegramAuthConfigured = exports.getRequestTelegramUser = exports.requireTelegramAuth = exports.verifyTelegramInitData = void 0;
const crypto_1 = __importDefault(require("crypto"));
const getBotToken = () => { var _a, _b; return String((_b = (_a = process.env.TELEGRAM_BOT_TOKEN) !== null && _a !== void 0 ? _a : process.env.BOT_TOKEN) !== null && _b !== void 0 ? _b : '').trim(); };
const getMaxAgeSeconds = () => {
    var _a;
    const raw = Number((_a = process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS) !== null && _a !== void 0 ? _a : 86400);
    return Number.isFinite(raw) ? Math.max(60, raw) : 86400;
};
const toDataCheckString = (initData) => {
    const params = new URLSearchParams(initData.replace(/^\?/, ''));
    const entries = [];
    for (const [key, value] of params.entries()) {
        if (key === 'hash')
            continue;
        entries.push([key, value]);
    }
    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([key, value]) => `${key}=${value}`).join('\n');
};
const timingSafeEqualHex = (aHex, bHex) => {
    try {
        const a = Buffer.from(aHex, 'hex');
        const b = Buffer.from(bHex, 'hex');
        if (a.length !== b.length)
            return false;
        return crypto_1.default.timingSafeEqual(a, b);
    }
    catch (_a) {
        return false;
    }
};
const verifyTelegramInitData = (initData) => {
    var _a, _b, _c, _d;
    const botToken = getBotToken();
    if (!botToken) {
        return { ok: false, error: 'Telegram bot token is not configured' };
    }
    const params = new URLSearchParams(initData.replace(/^\?/, ''));
    const receivedHash = String((_a = params.get('hash')) !== null && _a !== void 0 ? _a : '').trim();
    if (!receivedHash) {
        return { ok: false, error: 'Missing hash' };
    }
    const authDateRaw = Number(params.get('auth_date'));
    if (!Number.isFinite(authDateRaw) || authDateRaw <= 0) {
        return { ok: false, error: 'Missing auth_date' };
    }
    const maxAgeSeconds = getMaxAgeSeconds();
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (authDateRaw < nowSeconds - maxAgeSeconds) {
        return { ok: false, error: 'Init data is too old' };
    }
    const userRaw = String((_b = params.get('user')) !== null && _b !== void 0 ? _b : '').trim();
    if (!userRaw) {
        return { ok: false, error: 'Missing user' };
    }
    let parsedUser;
    try {
        parsedUser = JSON.parse(userRaw);
    }
    catch (_e) {
        return { ok: false, error: 'Invalid user JSON' };
    }
    if (typeof parsedUser !== 'object' || parsedUser === null) {
        return { ok: false, error: 'Invalid user payload' };
    }
    const userRecord = parsedUser;
    const idValue = userRecord['id'];
    if (typeof idValue !== 'number') {
        return { ok: false, error: 'Invalid user payload' };
    }
    const usernameValue = userRecord['username'];
    const firstNameValue = (_c = userRecord['first_name']) !== null && _c !== void 0 ? _c : userRecord['firstName'];
    const lastNameValue = (_d = userRecord['last_name']) !== null && _d !== void 0 ? _d : userRecord['lastName'];
    const dataCheckString = toDataCheckString(initData);
    // Telegram WebApp validation:
    // secret_key = HMAC_SHA256("WebAppData", bot_token)
    // hash = HMAC_SHA256(data_check_string, secret_key)
    const secretKey = crypto_1.default
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
    const computedHash = crypto_1.default
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
    if (!timingSafeEqualHex(computedHash, receivedHash)) {
        return { ok: false, error: 'Invalid signature' };
    }
    const user = {
        id: String(idValue),
        username: typeof usernameValue === 'string' ? usernameValue : undefined,
        firstName: typeof firstNameValue === 'string' ? firstNameValue : undefined,
        lastName: typeof lastNameValue === 'string' ? lastNameValue : undefined,
    };
    return { ok: true, user, authDate: authDateRaw };
};
exports.verifyTelegramInitData = verifyTelegramInitData;
const requireTelegramAuth = (req, res, next) => {
    var _a;
    const botToken = getBotToken();
    // In production we never allow skipping Telegram verification.
    if (!botToken) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({
                success: false,
                error: 'Telegram bot token is not configured',
            });
        }
        // Dev fallback: if no token is configured, skip verification.
        return next();
    }
    const initData = String((_a = req.header('x-telegram-init-data')) !== null && _a !== void 0 ? _a : '').trim();
    if (!initData) {
        return res
            .status(401)
            .json({ success: false, error: 'Missing Telegram init data' });
    }
    const verified = (0, exports.verifyTelegramInitData)(initData);
    if (!verified.ok) {
        return res.status(401).json({ success: false, error: verified.error });
    }
    req.telegramUser = verified.user;
    return next();
};
exports.requireTelegramAuth = requireTelegramAuth;
const getRequestTelegramUser = (req) => {
    var _a, _b, _c, _d, _e;
    if (req.telegramUser)
        return req.telegramUser;
    // Never accept header/body identity in production.
    if (process.env.NODE_ENV === 'production')
        return null;
    // Dev fallback: allow explicit headers/body to behave like before.
    const telegramId = String((_c = (_a = req.header('x-telegram-id')) !== null && _a !== void 0 ? _a : (_b = req.body) === null || _b === void 0 ? void 0 : _b.telegramId) !== null && _c !== void 0 ? _c : '').trim();
    if (!telegramId)
        return null;
    const username = typeof ((_d = req.body) === null || _d === void 0 ? void 0 : _d.username) === 'string' ? req.body.username : undefined;
    const firstName = typeof ((_e = req.body) === null || _e === void 0 ? void 0 : _e.firstName) === 'string' ? req.body.firstName : undefined;
    return {
        id: telegramId,
        username,
        firstName,
    };
};
exports.getRequestTelegramUser = getRequestTelegramUser;
const isTelegramAuthConfigured = () => Boolean(getBotToken());
exports.isTelegramAuthConfigured = isTelegramAuthConfigured;
