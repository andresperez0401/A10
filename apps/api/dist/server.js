"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const issues_1 = __importDefault(require("./routes/issues"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 4000);
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' }));
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
app.use('/api/auth', auth_1.default);
app.use('/api/issues', issues_1.default);
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
