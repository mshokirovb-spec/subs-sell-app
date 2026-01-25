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

app.use(cors());
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
