"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const passwordMatches = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET ?? 'dev-secret-change-me', { expiresIn: '8h' });
    return res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});
exports.default = router;
