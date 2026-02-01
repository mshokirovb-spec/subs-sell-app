import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ordersRouter from './routes/orders';
import servicesRouter from './routes/services';
import usersRouter from './routes/users';
import meRouter from './routes/me';

dotenv.config({ override: true });

const app = express();
const port = process.env.PORT || 3000;

const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN ?? '').trim();

if (process.env.NODE_ENV === 'production') {
    if (!botToken) {
        console.warn(
            'TELEGRAM_BOT_TOKEN is not set; protected endpoints will respond with 500.'
        );
    }

    if (corsOrigins.length === 0) {
        console.warn(
            'CORS_ORIGIN is not set; API will allow requests from any origin.'
        );
    }
}

app.use(
    cors({
        origin: corsOrigins.length > 0 ? corsOrigins : true,
    })
);
app.use(express.json());

app.use('/api/me', meRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/users', usersRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
