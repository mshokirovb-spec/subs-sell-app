"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const orders_1 = __importDefault(require("./routes/orders"));
const services_1 = __importDefault(require("./routes/services"));
const users_1 = __importDefault(require("./routes/users"));
const me_1 = __importDefault(require("./routes/me"));
dotenv_1.default.config({ override: true });
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/me', me_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/services', services_1.default);
app.use('/api/users', users_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
