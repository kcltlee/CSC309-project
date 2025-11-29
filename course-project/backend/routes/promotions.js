#!/usr/bin/env node
'use strict';

const express = require('express'); 
const router = express.Router(); 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const jwtAuth = require('../middleware/jwtAuth');
const { typeCheck, parseQuery } = require('../middleware/verifyInput');


// helpers
function isoToDate(s) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}
function isPositiveNumber(v) {
    return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}
function isPositiveInteger(v) {
    return Number.isInteger(v) && v >= 0;
}

// create promotion (manager or higher)
router.post('/', jwtAuth, async (req, res) => {
    // error check user & body
    if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
        return res.status(403).json({ error: "not permitted" });
    }
    if (!req.body) return res.status(400).json({ error: "invalid payload" });

    let { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

    // basic required fields
    if (!name || typeof name !== 'string' || !description || typeof description !== 'string') {
        return res.status(400).json({ error: "Promotion name or description incorrect" });
    }

    // normalize type
    if (type === 'one-time') type = 'onetime';
    if (type !== 'automatic' && type !== 'onetime') {
        return res.status(400).json({ error: "Type incorrect" });
    }

    // parse times
    const start = isoToDate(startTime);
    const end = isoToDate(endTime);
    if (!start || !end) return res.status(400).json({ error: "Start or end date empty" });

    const now = new Date();
    if (start < now) return res.status(400).json({ error: "Start date in the past" });
    if (end <= start) return res.status(400).json({ error: "End date before start date" });

    // validate optional numeric fields only when provided (not null/undefined)
    if (minSpending !== undefined && minSpending !== null && !isPositiveInteger(minSpending)) {
        return res.status(400).json({ error: "Minimum spend invalid payload" });
    }
    if (rate !== undefined && rate !== null && !isPositiveNumber(rate)) {
        return res.status(400).json({ error: "Rate invalid payload" });
    }
    if (points !== undefined && points !== null && !isPositiveInteger(points)) {
        return res.status(400).json({ error: "Points invalid payload" });
    }

    // add to existing users if onetime
    // automatic promotions are added to qualifying transactions already
    const userIds = [];
    if (type === "onetime") {
        const users = await prisma.user.findMany();
        for (const user of users) {
            userIds.push({ id: user.id });
        }
    }

    // build data object
    const data = {
        name,
        description,
        type,
        startTime: start,
        endTime: end,
        owners: { connect: userIds }
    };
    if (minSpending !== undefined && minSpending !== null) data.minSpending = minSpending;
    if (rate !== undefined && rate !== null) data.rate = rate;
    if (points !== undefined && points !== null) data.points = points;

    try {
        const created = await prisma.promotion.create({ data });

        return res.status(201).json({
            id: created.id,
            name: created.name,
            description: created.description,
            type: created.type,
            startTime: created.startTime,
            endTime: created.endTime,
            minSpending: created.minSpending,
            rate: created.rate,
            points: created.points
        });
    } catch (err) {
        console.error('promotion create error');
        return res.status(500).json({ error: 'internal server error' });
    }
});

// list promotions
router.get('/', jwtAuth, async (req, res) => {

    // get query parameters e.g. /promotions?page=2&limit=20&type=automatic
    const q = req.query || {};
    const page = parseInt(q.page) || 1;

    // error checks if page or limit invalid
    if (page <= 0) {
        return res.status(400).json({ error: "invalid page" });
    }
    if (q.limit !== undefined && parseInt(q.limit) <= 0) {
        return res.status(400).json({ error: "invalid limit" });
    }
    // limit = number of promotions per page, between 1-100, default 10 if not provided
    const limit = Math.max(1, Math.min(100, parseInt(q.limit) || 10));

    // num promotions to skip before starting current page
    const skip = (page - 1) * limit;

    // prisma object
    const where = {};

    // /promotions?name=summer: return names that contain string case-insensitive
    if (q.name) where.name = { contains: String(q.name), mode: 'insensitive' };

    // type
    if (q.type) {
        if (q.type !== 'automatic' && q.type !== 'one-time') return res.status(400).json({ error: "invalid payload" });
        if (q.type === 'one-time') {
            where.type = 'onetime';
        } else {
            where.type = q.type;
        }
        
    }

    const now = new Date();

    if (req.user.role === 'manager' || req.user.role === 'superuser') {
        if (q.started !== undefined && q.ended !== undefined) {
            return res.status(400).json({ error: "invalid payload" });
        }
        // for filtering: started=true/false
        if (q.started !== undefined) {
            const startedFlag = String(q.started) === 'true';
            where.startTime = startedFlag ? { lte: now } : { gt: now };
        }

        // for filtering: ended=true/false
        if (q.ended !== undefined) {
            const endedFlag = String(q.ended) === 'true';
            where.endTime = endedFlag ? { lte: now } : { gt: now };
        }
    } else {
        // regular user: only active promotions (started && not ended)
        where.startTime = { lte: now };
        where.endTime = { gt: now };
    }

    const [count, promos] = await Promise.all([
        prisma.promotion.count({ where }),
        prisma.promotion.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startTime: 'desc' }
        })
    ]);

    // prepare list results (omit description)
    const results = [];
    for (const p of promos) {
        // for regular users, exclude promotions user already used (if relation exists)
        if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
            try {
                const used = await prisma.user.findFirst({
                    where: { id: req.user.id, promotions: { some: { id: p.id } } } // req.user.id from jwtAuth, route protected by jwtAuth
                });
                if (used) continue;
            } catch (e) {
                // ignore if relation not present
            }
        }
        const item = {
            id: p.id,
            name: p.name,
            type: p.type,
            endTime: p.endTime,
            minSpending: p.minSpending,
            rate: p.rate,
            points: p.points
        };
        if (req.user.role === 'manager' || req.user.role === 'superuser') {
            item.startTime = p.startTime;
        }
        results.push(item);
    }

    return res.json({ count: results.length, results });
});

// get single promotion
router.get('/:promotionId', jwtAuth, async (req, res) => {
    const id = Number(req.params.promotionId);
    if (!Number.isInteger(id)) return res.status(404).json({ error: "invalid promotion id" });

    const p = await prisma.promotion.findUnique({ where: { id } });
    if (!p) return res.status(404).json({ error: "not found" });

    const now = new Date();

    if (req.user.role === 'manager' || req.user.role === 'superuser') {
        return res.json({
            id: p.id,
            name: p.name,
            description: p.description,
            type: p.type,
            startTime: p.startTime,
            endTime: p.endTime,
            minSpending: p.minSpending,
            rate: p.rate,
            points: p.points
        });
    } else {
        // regular user: promotion must be active and not used
        const active = p.startTime <= now && p.endTime > now;
        if (!active) return res.status(404).json({ error: "not found" });

        return res.json({
            id: p.id,
            name: p.name,
            description: p.description,
            type: p.type,
            endTime: p.endTime,
            minSpending: p.minSpending,
            rate: p.rate,
            points: p.points
        });
    }
});

// update promotion (manager or higher)
router.patch('/:promotionId', jwtAuth, async (req, res) => {
    if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
        return res.status(403).json({ error: "not permitted" });
    }
    if (!req.body) return res.status(400).json({ error: "invalid payload" });

    const id = Number(req.params.promotionId);
    if (!Number.isInteger(id)) return res.status(404).json({ error: "invalid promotion id" });

    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "not found" });

    const now = new Date();

    let { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

    const update = {};

    const startedAlready = existing.startTime <= now;
    const endPassedAlready = existing.endTime <= now;

    if (name !== undefined && name !==null) {
        if (startedAlready) return res.status(400).json({ error: "invalid payload" });
        if (!name || typeof name !== 'string') return res.status(400).json({ error: "invalid payload" });
        update.name = name;
    }
    if (description !== undefined && description !==null) {
        if (startedAlready) return res.status(400).json({ error: "invalid payload" });
        if (!description || typeof description !== 'string') return res.status(400).json({ error: "invalid payload" });
        update.description = description;
    }
    if (type !== undefined && type !==null) {
        if (startedAlready) return res.status(400).json({ error: "invalid payload" });
        if (type !== 'automatic' && type !== 'one-time') return res.status(400).json({ error: "invalid payload" });
        if (type === 'one-time') {
            type = 'onetime';
        }
        update.type = type;
    }
    if (startTime !== undefined && startTime !==null) {
        const s = isoToDate(startTime);
        if (!s) return res.status(400).json({ error: "invalid payload" });
        if (startedAlready) return res.status(400).json({ error: "invalid payload" });
        if (s < now) return res.status(400).json({ error: "invalid payload" });
        update.startTime = s;
    }
    if (endTime !== undefined && endTime !==null) {
        const e = isoToDate(endTime);
        if (!e) return res.status(400).json({ error: "invalid payload" });
        if (endPassedAlready) return res.status(400).json({ error: "invalid payload" });
        const refStart = update.startTime || existing.startTime;
        if (e <= refStart) return res.status(400).json({ error: "invalid payload" });
        update.endTime = e;
    }
    if (minSpending !== undefined && minSpending !==null) {
        if (startedAlready) return res.status(400).json({ error: "invalid payload" });
        if (!isPositiveNumber(minSpending)) return res.status(400).json({ error: "invalid payload" });
        update.minSpending = minSpending;
    }
    if (rate !== undefined && rate !==null) {
        if (startedAlready) return res.status(400).json({ error: "invalid payload" });
        if (!isPositiveNumber(rate)) return res.status(400).json({ error: "invalid payload" });
        update.rate = rate;
    }
    if (points !== undefined && points !==null) {
        if (startedAlready) return res.status(400).json({ error: "invalid payload" });
        if (!isPositiveInteger(points)) return res.status(400).json({ error: "invalid payload" });
        update.points = points;
    }

    if (Object.keys(update).length === 0) {
        return res.json({ id: existing.id, name: existing.name, type: existing.type });
    }

    const updated = await prisma.promotion.update({
        where: { id },
        data: update
    });

    const response = { id: updated.id, name: updated.name, type: updated.type };
    for (const k of Object.keys(update)) response[k] = updated[k];
    return res.json(response);
});

// delete promotion (manager or higher)
router.delete('/:promotionId', jwtAuth, async (req, res) => {
    if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
        return res.status(403).json({ error: "not permitted" });
    }
    const id = Number(req.params.promotionId);
    if (!Number.isInteger(id)) return res.status(404).json({ error: "invalid promotion id" });

    const p = await prisma.promotion.findUnique({ where: { id } });
    if (!p) return res.status(404).json({ error: "not found" });

    const now = new Date();
    if (p.startTime <= now) {
        return res.status(403).json({ error: "not permitted" });
    }

    await prisma.promotion.delete({ where: { id } });
    return res.status(204).send();
});

module.exports = router;