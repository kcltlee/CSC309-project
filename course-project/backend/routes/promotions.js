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
    if (page <= 0) return res.status(400).json({ error: "invalid page" });
    const limit = Math.max(1, Math.min(100, parseInt(q.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filters
    const allowedKeys = [
        'id', 'name', 'type', 'minSpending', 'rate', 'points',
        'startAfter', 'endBefore', 'rateMin', 'minSpendingMin', 'pointsMin'
    ];
    const filters = {};
    for (const key of allowedKeys) {
        if (q[key] !== undefined && q[key] !== '') {
            filters[key] = q[key];
        }
    }

    // prisma where object
    const where = {};

    // name filter 
    if (filters.name) {
        where.name = { contains: String(filters.name), mode: 'insensitive' };
    }

    // type filter
    if (filters.type) {
        if (filters.type === 'one-time') {
            where.type = 'onetime';
        } else if (filters.type === 'automatic') {
            where.type = 'automatic';
        }
    }

    // numeric filters
    if (filters.rateMin) {
        where.rate = { gte: Number(filters.rateMin) };
    }
    if (filters.minSpendingMin) {
        where.minSpending = { gte: Number(filters.minSpendingMin) };
    }
    if (filters.pointsMin) {
        where.points = { gte: Number(filters.pointsMin) };
    }

    // date filters
    if (filters.startAfter) {
        const after = new Date(filters.startAfter);
        if (!isNaN(after.getTime())) {
            where.startTime = { gt: after };
        }
    }
    if (filters.endBefore) {
        const before = new Date(filters.endBefore);
        if (!isNaN(before.getTime())) {
            where.endTime = { lt: before };
        }
    }

    // role based filtering
    const now = new Date();
    if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
        where.startTime = { lte: now };
        where.endTime = { gt: now };
    }

    try {
        const [count, promos] = await Promise.all([
            prisma.promotion.count({ where }),
            prisma.promotion.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startTime: 'desc' }
            })
        ]);

        // Prepare results (omit description for regular users)
        const results = [];
        for (const p of promos) {
            if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
                try {
                    const used = await prisma.user.findFirst({
                        where: { id: req.user.id, promotions: { some: { id: p.id } } }
                    });
                    if (used) continue;
                } catch (e) {}
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

        res.json({
            count,
            results,
            page,
            limit,
            hasMore: results.length === limit
        });
    } catch (err) {
        console.error('promotion list error', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// get single promotion
router.get('/:promotionId', jwtAuth, async (req, res) => {
    // get promotion id
    const id = Number(req.params.promotionId);
    if (!Number.isInteger(id)) return res.status(404).json({ error: "invalid promotion id" });

    const p = await prisma.promotion.findUnique({ where: { id } });
    if (!p) return res.status(404).json({ error: "promotion not found" });

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
        if (!active) return res.status(404).json({ error: "Promotion not found (not active)" });

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
    if (!existing) return res.status(404).json({ error: "promotion id does not exist" });

    const now = new Date();

    let { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

    const update = {};

    const startedAlready = existing.startTime <= now;
    const endPassedAlready = existing.endTime <= now;

    if (name !== undefined && name !==null) {
        if (startedAlready) return res.status(400).json({ error: "Cannot edit, event already started" });
        if (!name || typeof name !== 'string') return res.status(400).json({ error: "Invalid name" });
        update.name = name;
    }
    if (description !== undefined && description !==null) {
        if (startedAlready) return res.status(400).json({ error: "Cannot edit, event already started" });
        if (!description || typeof description !== 'string') return res.status(400).json({ error: "invalid description" });
        update.description = description;
    }
    if (type !== undefined && type !==null) {
        if (startedAlready) return res.status(400).json({ error: "Cannot edit, event already started" });
        if (type !== 'automatic' && type !== 'one-time') return res.status(400).json({ error: "invalid type" });
        if (type === 'one-time') {
            type = 'onetime';
        }
        update.type = type;
    }
    if (startTime !== undefined && startTime !==null) {
        const s = isoToDate(startTime);
        if (!s) return res.status(400).json({ error: "invalid start time" });
        if (startedAlready) return res.status(400).json({ error: "Cannot edit, event already started" });
        if (s < now) return res.status(400).json({ error: "Cannot edit start time to be in the past" });
        update.startTime = s;
    }
    if (endTime !== undefined && endTime !==null) {
        const e = isoToDate(endTime);
        if (!e) return res.status(400).json({ error: "invalid payload" });
        if (endPassedAlready) return res.status(400).json({ error: "Cannot edit, event already finished" });
        const refStart = update.startTime || existing.startTime;
        if (e <= refStart) return res.status(400).json({ error: "Cannot edit end time to be before start time" });
        update.endTime = e;
    }
    if (minSpending !== undefined && minSpending !==null) {
        if (startedAlready) return res.status(400).json({ error: "Cannot edit, event already started" });
        if (!isPositiveNumber(minSpending)) return res.status(400).json({ error: "invalid min spending" });
        update.minSpending = minSpending;
    }
    if (rate !== undefined && rate !==null) {
        if (startedAlready) return res.status(400).json({ error: "Cannot edit, event already started" });
        if (!isPositiveNumber(rate)) return res.status(400).json({ error: "invalid rate" });
        update.rate = rate;
    }
    if (points !== undefined && points !==null) {
        if (startedAlready) return res.status(400).json({ error: "Cannot edit, event already started" });
        if (!isPositiveInteger(points)) return res.status(400).json({ error: "invalid points" });
        update.points = points;
    }

    // if nothing to update, just return basic promotion info
    if (Object.keys(update).length === 0) {
        return res.json({ id: existing.id, name: existing.name, type: existing.type });
    }

    const updated = await prisma.promotion.update({
        where: { id },
        data: update
    });

    // only return fields that have changed
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
    if (!p) return res.status(404).json({ error: "promotion not found" });

    const now = new Date();
    if (p.startTime <= now) {
        return res.status(403).json({ error: "not permitted, start time in the past" });
    }

    await prisma.promotion.delete({ where: { id } });
    return res.status(204).send();
});

module.exports = router;