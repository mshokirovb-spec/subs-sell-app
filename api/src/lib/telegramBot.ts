import https from 'https';

function getBotToken(): string {
    return String(process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN ?? '').trim();
}

function getAdminIds(): string[] {
    return (process.env.ADMIN_TELEGRAM_IDS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

/**
 * Sends a message to a Telegram user/chat using the bot token.
 */
export async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
    const botToken = getBotToken();
    if (!botToken || !chatId) {
        console.warn('Telegram Bot: Token or Chat ID is missing', { hasToken: !!botToken, chatId });
        return false;
    }

    const data = JSON.stringify({
        chat_id: String(chatId),
        text: text,
        parse_mode: 'HTML',
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${botToken}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
        },
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    console.error('Telegram API Error:', body);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Telegram Request Error:', error);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

/**
 * Sends a notification to all configured admins.
 */
export async function notifyAdmins(text: string): Promise<void> {
    const adminIds = getAdminIds();
    if (adminIds.length === 0) {
        console.warn('Telegram Bot: No admin IDs configured to notify.');
        return;
    }

    await Promise.all(adminIds.map((id) => sendTelegramMessage(id, text)));
}

/**
 * Helper to format order items for Telegram messages.
 */
export function formatOrderItems(items: { serviceName: string; durationLabel: string; quantity: number }[]): string {
    return items
        .map((item) => `• ${item.serviceName} (${item.durationLabel}) x${item.quantity}`)
        .join('\n');
}
