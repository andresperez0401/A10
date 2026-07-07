"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const issuesService_1 = require("../services/issuesService");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const issues = await (0, issuesService_1.getIssues)({
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        priority: typeof req.query.priority === 'string' ? req.query.priority : undefined,
        ownerId: typeof req.query.owner_id === 'string' ? req.query.owner_id : undefined,
        weekNumber: typeof req.query.week_number === 'string' ? Number(req.query.week_number) : undefined
    });
    res.json({ data: issues });
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    const { title, description, priority, dueDate, meetingWeekNumber } = req.body;
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!title || !description || !priority || !dueDate || !meetingWeekNumber) {
        return res.status(400).json({ error: 'title, description, priority, dueDate and meetingWeekNumber are required' });
    }
    try {
        const issue = await (0, issuesService_1.createIssue)({
            title,
            description,
            priority,
            dueDate,
            meetingWeekNumber,
            ownerId: req.user.userId
        });
        return res.status(201).json({ data: issue });
    }
    catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Could not create issue' });
    }
});
exports.default = router;
