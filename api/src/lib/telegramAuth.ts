import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export type TelegramAuthUser = {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
};

type VerifyResult =
    | { ok: true; user: TelegramAuthUser; authDate: number }
    | { ok: false; error: string };

const getBotToken = () =>
    String(process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN ?? '').trim();

const getMaxAgeSeconds = () => {
    const raw = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS ?? 86400);
    return Number.isFinite(raw) ? Math.max(60, raw) : 86400;
};

const toDataCheckString = (initData: string) => {
    const params = new URLSearchParams(initData.replace(/^\?/, ''));
    const entries: Array<[string, string]> = [];

    for (const [key, value] of params.entries()) {
        if (key === 'hash') continue;
        entries.push([key, value]);
    }

    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([key, value]) => `${key}=${value}`).join('\n');
};

const timingSafeEqualHex = (aHex: string, bHex: string) => {
    try {
        const a = Buffer.from(aHex, 'hex');
        const b = Buffer.from(bHex, 'hex');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
};

export const verifyTelegramInitData = (initData: string): VerifyResult => {
    const botToken = getBotToken();
    if (!botToken) {
        return { ok: false, error: 'Telegram bot token is not configured' };
    }

    const params = new URLSearchParams(initData.replace(/^\?/, ''));
    const receivedHash = String(params.get('hash') ?? '').trim();
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

    const userRaw = String(params.get('user') ?? '').trim();
    if (!userRaw) {
        return { ok: false, error: 'Missing user' };
    }

    let parsedUser: unknown;
    try {
        parsedUser = JSON.parse(userRaw);
    } catch {
        return { ok: false, error: 'Invalid user JSON' };
    }

    if (typeof parsedUser !== 'object' || parsedUser === null) {
        return { ok: false, error: 'Invalid user payload' };
    }

    const userRecord = parsedUser as Record<string, unknown>;
    const idValue = userRecord['id'];
    if (typeof idValue !== 'number') {
        return { ok: false, error: 'Invalid user payload' };
    }

    const usernameValue = userRecord['username'];
    const firstNameValue = userRecord['first_name'] ?? userRecord['firstName'];
    const lastNameValue = userRecord['last_name'] ?? userRecord['lastName'];

    const dataCheckString = toDataCheckString(initData);

    // Telegram WebApp validation:
    // secret_key = HMAC_SHA256("WebAppData", bot_token)
    // hash = HMAC_SHA256(data_check_string, secret_key)
    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

    const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    if (!timingSafeEqualHex(computedHash, receivedHash)) {
        return { ok: false, error: 'Invalid signature' };
    }

    const user: TelegramAuthUser = {
        id: String(idValue),
        username: typeof usernameValue === 'string' ? usernameValue : undefined,
        firstName: typeof firstNameValue === 'string' ? firstNameValue : undefined,
        lastName: typeof lastNameValue === 'string' ? lastNameValue : undefined,
    };

    return { ok: true, user, authDate: authDateRaw };
};

export const requireTelegramAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

    const initData = String(req.header('x-telegram-init-data') ?? '').trim();
    if (!initData) {
        return res
            .status(401)
            .json({ success: false, error: 'Missing Telegram init data' });
    }

    const verified = verifyTelegramInitData(initData);
    if (!verified.ok) {
        return res.status(401).json({ success: false, error: verified.error });
    }

    req.telegramUser = verified.user;
    return next();
};

export const getRequestTelegramUser = (req: Request): TelegramAuthUser | null => {
    if (req.telegramUser) return req.telegramUser;

    // Never accept header/body identity in production.
    if (process.env.NODE_ENV === 'production') return null;

    // Dev fallback: allow explicit headers/body to behave like before.
    const telegramId = String(
        req.header('x-telegram-id') ?? req.body?.telegramId ?? ''
    ).trim();
    if (!telegramId) return null;

    const username =
        typeof req.body?.username === 'string' ? req.body.username : undefined;
    const firstName =
        typeof req.body?.firstName === 'string' ? req.body.firstName : undefined;

    return {
        id: telegramId,
        username,
        firstName,
    };
};

export const isTelegramAuthConfigured = () => Boolean(getBotToken());
