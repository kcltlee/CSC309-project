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
    return v === null || (typeof v === 'number' && Number.isFinite(v) && v > 0);
}
function isNonNegativeInteger(v) {
    return Number.isInteger(v) && v >= 0;
}

// parses and validates an event id
function parseId(id) {

    const num = Number(id);

    if (!Number.isInteger(num) || num < 0) {
        return "invalid";
    }
    return num;
}

// create event (manager or higher)
router.post('/', jwtAuth, async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
            return res.status(403).json({ error: "not permitted" });
        }
        if (!req.body) {
            console.log('events.create no body');
            return res.status(400).json({ error: "invalid payload" });
        }

        const { name, description, location, startTime, endTime, capacity, points } = req.body;

        if (!name || typeof name !== 'string' || !description || typeof description !== 'string'
            || !location || typeof location !== 'string') {
            console.log('events.create invalid payload');
            return res.status(400).json({ error: "invalid payload" });
        }

        const start = isoToDate(startTime);
        const end = isoToDate(endTime);
        if (!start || !end || end <= start) {
            console.log('events.create invalid dates');
            return res.status(400).json({ error: "invalid payload" });
        }

        if (!isNonNegativeInteger(points) || points <= 0) {
            console.log('events.create invalid points');
            return res.status(400).json({ error: "invalid payload" });
        }

        if (capacity !== undefined && capacity !== null && (typeof capacity !== 'number' || !Number.isFinite(capacity) || capacity <= 0)) {
            console.log('events.create invalid capacity');
            return res.status(400).json({ error: "invalid payload" });
        }

        const created = await prisma.event.create({
            data: {
                name,
                description,
                location,
                startTime: start,
                endTime: end,
                capacity: capacity === undefined ? null : capacity,
                pointsRemain: points,
                pointsAwarded: 0,
                published: false
            }
        });

        return res.status(201).json({
            id: created.id,
            name: created.name,
            description: created.description,
            location: created.location,
            startTime: created.startTime,
            endTime: created.endTime,
            capacity: created.capacity,
            pointsRemain: created.pointsRemain,
            pointsAwarded: created.pointsAwarded,
            published: created.published,
            organizers: [],
            guests: []
        });
    } catch (e) {
        console.log('events.create error:', e);
        return res.status(400).json({ error: "invalid payload" });
    }
});

// list events (regular users see only published; managers see extra filters)
router.get('/', jwtAuth, async (req, res) => {
    try {
        const q = req.query || {};
        const page = parseInt(q.page) || 1;
        if (page <= 0) {
            return res.status(400).json({ error: "invalid page" });
        }
        if (q.limit !== undefined && parseInt(q.limit) <= 0) {
            return res.status(400).json({ error: "invalid limit" });
        }
        const limit = Math.max(1, Math.min(100, parseInt(q.limit) || 10));
        const skip = (page - 1) * limit;

        if (q.started !== undefined && q.ended !== undefined) {
            return res.status(400).json({ error: "invalid payload" });
        }

        const where = {};
        // if (q.name) where.name = { contains: String(q.name), mode: 'insensitive' };
        // if (q.location) where.location = { contains: String(q.location), mode: 'insensitive' };
        if (q.name) where.name = { contains: String(q.name) };
        if (q.location) where.location = { contains: String(q.location) };
        if (q.id !== undefined) {
            const idNum = Number(q.id);
            if (!Number.isInteger(idNum)) return res.status(400).json({ error: "invalid event id" });
            where.id = idNum;  
        }

        const now = new Date();

        // manager extra filter: published
        if (req.user.role === 'manager' || req.user.role === 'superuser') {
            if (q.published !== undefined) {
                const flag = String(q.published) === 'true';
                where.published = flag;
            }
            if (q.started !== undefined) {
                const startedFlag = String(q.started) === 'true';
                where.startTime = startedFlag ? { lte: now } : { gt: now };
            }
            if (q.ended !== undefined) {
                const endedFlag = String(q.ended) === 'true';
                where.endTime = endedFlag ? { lte: now } : { gt: now };
            }
        } else {
            // regular: only published events and active/all depending on started/ended filters
            where.published = true;
            if (q.started !== undefined) {
                const startedFlag = String(q.started) === 'true';
                where.startTime = startedFlag ? { lte: now } : { gt: now };
            }
            if (q.ended !== undefined) {
                const endedFlag = String(q.ended) === 'true';
                where.endTime = endedFlag ? { lte: now } : { gt: now };
            }
        }

        // fetch candidates
        const candidates = await prisma.event.findMany({
            where,
            orderBy: { startTime: 'desc' },
            include: { guests: true } // compute numGuests
        });

        // compute numGuests and filter showFull if requested
        const showFull = String(q.showFull) === 'true';
        const filtered = candidates.filter(e => {
            const numGuests = (e.guests || []).length;
            if (!showFull && e.capacity !== null && numGuests >= e.capacity) return false;
            return true;
        });

        const total = filtered.length;
        const pageResults = filtered.slice(skip, skip + limit);

        const results = pageResults.map(e => {
            const numGuests = (e.guests || []).length;
            const base = {
                id: e.id,
                name: e.name,
                location: e.location,
                startTime: e.startTime,
                endTime: e.endTime,
                capacity: e.capacity,
                numGuests
            };
            if (req.user.role === 'manager' || req.user.role === 'superuser') {
                base.pointsRemain = e.pointsRemain;
                base.pointsAwarded = e.pointsAwarded;
                base.published = e.published;
            }
            return base;
        });

        return res.json({ count: total, results });
    } catch (e) {
        return res.status(400).json({ error: "invalid payload" });
    }
});

// get single event
router.get('/:eventId', jwtAuth, async (req, res) => {
    try {
        const id = Number(req.params.eventId);
        if (!Number.isInteger(id)) return res.status(404).json({ error: "invalid event id" });

        const e = await prisma.event.findUnique({
            where: { id },
            include: { organizers: true, guests: true }
        });
        if (!e) return res.status(404).json({ error: "not found" });

        const now = new Date();

        // manager or organizer can see full details
        const isManager = req.user && (req.user.role === 'manager' || req.user.role === 'superuser');
        const isOrganizer = e.organizers && e.organizers.some(o => o.id === req.user.id);

        if (!isManager && !isOrganizer && !e.published) {
            return res.status(404).json({ error: "not found" });
        }

        const numGuests = (e.guests || []).length;
        if (isManager || isOrganizer) {
            return res.json({
                id: e.id,
                name: e.name,
                description: e.description,
                location: e.location,
                startTime: e.startTime,
                endTime: e.endTime,
                capacity: e.capacity,
                pointsRemain: e.pointsRemain,
                pointsAwarded: e.pointsAwarded,
                published: e.published,
                organizers: (e.organizers || []).map(o => ({ id: o.id, utorid: o.utorid, name: o.name })),
                // Added userId for guest objects for deleting guests 
                guests: (e.guests || []).map(g => ({ id: g.id, utorid: g.utorid, name: g.name, userId: g.userId}))
            });
        }

        // regular user view
        return res.json({
            id: e.id,
            name: e.name,
            description: e.description,
            location: e.location,
            startTime: e.startTime,
            endTime: e.endTime,
            capacity: e.capacity,
            organizers: (e.organizers || []).map(o => ({ id: o.id, utorid: o.utorid, name: o.name })),
            numGuests
        });
    } catch (e) {
        return res.status(400).json({ error: "invalid payload" });
    }
});

// update event (manager or organizer)
router.patch('/:eventId', jwtAuth, async (req, res) => {
    try {
        if (!req.user) return res.status(403).json({ error: "not permitted" });

        const id = Number(req.params.eventId);
        if (!Number.isInteger(id)) return res.status(404).json({ error: "invalid event id" });

        const existing = await prisma.event.findUnique({
            where: { id },
            include: { organizers: true, guests: true }
        });
        if (!existing) return res.status(404).json({ error: "not found" });

        const isManager = req.user && (req.user.role === 'manager' || req.user.role === 'superuser');
        const isOrganizer = existing.organizers && existing.organizers.some(o => o.id === req.user.id);
        if (!isManager && !isOrganizer) {
            return res.status(403).json({ error: "not permitted" });
        }

        if (!req.body) return res.status(400).json({ error: "invalid payload" });

        const now = new Date();
        const startedAlready = existing.startTime <= now;
        const endPassedAlready = existing.endTime <= now;
        const numGuests = (existing.guests || []).length;

        const {
            name, description, location, startTime, endTime, capacity, points, published
        } = req.body;

        const update = {};

        if (points !== undefined && points !== null) {
            // only managers can set points
            if (!isManager) return res.status(403).json({ error: "not permitted" });
            if (!isNonNegativeInteger(points) || points <= 0) return res.status(400).json({ error: "invalid payload" });
            // ensure total allocated not reduced below already awarded
            if (points < existing.pointsAwarded) return res.status(400).json({ error: "invalid payload" });
            // adjust pointsRemain relative to new total:
            const totalAllocatedOld = (existing.pointsRemain || 0) + (existing.pointsAwarded || 0);
            const delta = points - totalAllocatedOld;
            update.pointsRemain = (existing.pointsRemain || 0) + delta;
        }
        if (published !== undefined && published !== null) {
            // only managers can change published; published can only be set to true
            if (!isManager) return res.status(403).json({ error: "not permitted" });
            if (published !== true) return res.status(400).json({ error: "invalid payload" });
            update.published = true;
        }
        if (name !== undefined && name !== null) {
            if (startedAlready) return res.status(400).json({ error: "invalid payload" });
            if (!name || typeof name !== 'string') return res.status(400).json({ error: "invalid payload" });
            update.name = name;
        }
        if (description !== undefined && description !== null) {
            if (startedAlready) return res.status(400).json({ error: "invalid payload" });
            if (!description || typeof description !== 'string') return res.status(400).json({ error: "invalid payload" });
            update.description = description;
        }
        if (location !== undefined && location !== null) {
            if (startedAlready) return res.status(400).json({ error: "invalid payload" });
            if (!location || typeof location !== 'string') return res.status(400).json({ error: "invalid payload" });
            update.location = location;
        }
        if (startTime !== undefined && startTime !== null) {
            const s = isoToDate(startTime);
            if (!s) return res.status(400).json({ error: "invalid payload" });
            if (startedAlready) return res.status(400).json({ error: "invalid payload" });
            if (s < now) return res.status(400).json({ error: "invalid payload" });
            update.startTime = s;
        }
        if (endTime !== undefined && endTime !== null) {
            const e = isoToDate(endTime);
            if (!e) return res.status(400).json({ error: "invalid payload" });
            if (endPassedAlready) return res.status(400).json({ error: "invalid payload" });
            const refStart = update.startTime || existing.startTime;
            if (e <= refStart) return res.status(400).json({ error: "invalid payload" });
            update.endTime = e;
        }
        if (capacity !== undefined && capacity !== null) {
            if (startedAlready) return res.status(400).json({ error: "invalid payload" });
            if (capacity !== null && (typeof capacity !== 'number' || !Number.isFinite(capacity) || capacity <= 0)) {
                return res.status(400).json({ error: "invalid payload" });
            }
            // capacity reduction check
            if (capacity !== null && existing.capacity !== null && capacity < numGuests) {
                return res.status(400).json({ error: "invalid payload" });
            }
            update.capacity = capacity === undefined ? undefined : capacity;
        }

        if (Object.keys(update).length === 0) {
            return res.json({ id: existing.id, name: existing.name, location: existing.location });
        }

        const updated = await prisma.event.update({
            where: { id },
            data: update
        });

        const response = { id: updated.id, name: updated.name, location: updated.location };
        for (const k of Object.keys(update)) response[k] = updated[k];
        return res.json(response);
    } catch (e) {
        return res.status(400).json({ error: "invalid payload" });
    }
});

// delete event (manager only)
router.delete('/:eventId', jwtAuth, async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
            return res.status(403).json({ error: "not permitted" });
        }
        const id = Number(req.params.eventId);
        if (!Number.isInteger(id)) return res.status(404).json({ error: "invalid event id" });

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: "not found" });

        if (existing.published) return res.status(400).json({ error: "invalid payload" });

        await prisma.event.delete({ where: { id } });
        return res.status(204).send();
    } catch (e) {
        return res.status(400).json({ error: "invalid payload" });
    }
});

// Add an organizer to the event (Manager or higher) 
router.post('/:eventId/organizers', jwtAuth, async (req, res) => {
    try {

        // Authenticate user and check clearance
        if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
            return res.status(403).json({ error: "not permitted" });
        }

        // Validate eventId 
        const eventId = Number(req.params.eventId);
        if (!Number.isInteger(eventId) || eventId < 1) return res.status(404).json({ error: "invalid event id" });

        // Load event and valid if event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organizers: true, guests: true }
        })
        if (!event) {
            return res.status(404).json({ error: "event not found" })
        }

        // Check to see if event has ended  
        const currDate = new Date();
        if (event.endTime <= currDate) {
            return res.status(410).json({ error: "event has ended" })
        }

        // Validate utorid 
        const utorid = req.body.utorid.trim();
        if (!utorid || typeof utorid !== 'string' || !/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ error: "invalid utorid" });
        }

        // Find user and check if user is registered as guest/ organizer to event 
        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }
        
        const alreadyGuest = event.guests.some(guest => guest.userId === user.id);
        if (alreadyGuest) {
            return res.status(400).json({ error: "user is already a guest; remove user as guest first, then retry" });
        }

        const alreadyOrganizer = (event.organizers || []).some(organizer => organizer.id === user.id);
        if (alreadyOrganizer) {
            return res.status(400).json({ error: "user is already an organizer" })
        }

        // Add user as organizer 
        const updatedEvent = await prisma.event.update({
            where: { id: event.id },
            data: { organizers: { connect: { id: user.id } } },
            include: { organizers: true }
        });

        // Each organizer object should have id, utorid, and name
        const organizers = (updatedEvent.organizers || []).map(organizer => ({
            id: organizer.id,
            utorid: organizer.utorid,
            name: organizer.name
        }));

        // Success 
        return res.status(201).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            organizers
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// Remove an organizer from the event (Manager or higher) 
router.delete('/:eventId/organizers/:userId', jwtAuth, async (req, res) => {
    try {

        // Authenticate and check clearance
        if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
            return res.status(403).json({ error: "not permitted" });
        }

        // Validate userId and eventId 
        const eventId = Number(req.params.eventId);
        const userId = Number(req.params.userId);
        if (!Number.isInteger(eventId) || eventId < 1) {
            return res.status(404).json({ error: "invalid eventId" });
        }
        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(404).json({ error: "invalid userId" });
        }

        // Load event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organizers: true }
        });
        if (!event) {
            return res.status(404).json({ error: "event not found" });
        }

        // Check to see if event has ended  
        const currDate = new Date();
        if (event.endTime <= currDate) {
            return res.status(410).json({ error: "event has ended" })
        }

        // Check if user is organizer 
        const isOrganizer = event.organizers.some(organizer => organizer.id === userId);
        if (!isOrganizer) {
            return res.status(400).json({ error: "user is not an organizer" });
        }

        // Disconnect user from the organizers 
        await prisma.event.update({
            where: { id: eventId },
            data: { organizers: { disconnect: { id: userId } } }
        });

        // Success
        return res.status(204).send();
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
})

// check the logged-in user's RSVP status
router.get('/:eventId/guests/me', jwtAuth, async (req, res) => {
    try { 
        if (!req.user) {
            return res.status(401).json({ error: "not authenticated" });
        }
        // check eventId
        const eventId = Number(req.params.eventId);
        if (!Number.isInteger(eventId) || eventId < 1) {
            return res.status(404).json({ error: "invalid event id" });
        }
        const isGuest = await prisma.eventGuest.findUnique({
            where: {
                userId_eventId: {
                    userId: req.user.id,
                    eventId
                }
            }
        });
        if (isGuest) {
            return res.json({ hasRSVP: true, confirmed: isGuest.confirmed });
        } else {
            return res.json({ hasRSVP: false });
        }
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// Add the logged-in user to the event (Regular user)
router.post('/:eventId/guests/me', jwtAuth, async (req, res) => {
    try {

        // Authenticate 
        if (!req.user) {
            return res.status(401).json({ error: "not permitted" });
        }

        // Validate eventId
        const eventId = Number(req.params.eventId);
        if (!Number.isInteger(eventId) || eventId < 1) {
            return res.status(404).json({ error: "invalid eventId" });
        }

        // Load event 
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true }
        });
        if (!event) {
            return res.status(404).json({ error: "event not found" });
        }

        // Check if event is full or has ended  
        const currDate = new Date();
        if (event.endTime <= currDate) {
            return res.status(410).json({ error: "event has ended" });
        }
        if (event.capacity && event.numGuests >= event.capacity) {
            return res.status(410).json({ error: "event is full" });
        }

        // Check if user is guest 
        const alreadyGuest = event.guests.some(guest => guest.userId === req.user.id);
        if (alreadyGuest) {
            return res.status(400).json({ error: "user is already a guest" });
        }

        // Add user as guest 
        const updatedEvent = await prisma.event.update({
            where: { id: event.id },
            data: {
                guests: {
                    create: {
                        user: { connect: { id: req.user.id } }, 
                        confirmed: true
                    }
                }
            },
            include: { guests: { include: { user: true } } }
        });

        // Success
        return res.status(201).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            guestAdded: {
                id: req.user.id,
                utorid: req.user.utorid,
                name: req.user.name
            },
            numGuests: updatedEvent.guests.length
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// Remove the logged-in user from this event (Regular user)
router.delete('/:eventId/guests/me', jwtAuth, async (req, res) => {
    try {

        // Authenticate 
        if (!req.user) {
            return res.status(401).json({ error: "not permitted" });
        }

        // Validate eventId 
        const eventId = Number(req.params.eventId);
        if (!Number.isInteger(eventId) || eventId < 1) {
            return res.status(404).json({ error: "invalid eventId" });
        }

        // Load event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true }
        });
        if (!event) {
            return res.status(404).json({ error: "event not found" });
        }

        // Check to see if event has ended  
        const currDate = new Date();
        if (event.endTime <= currDate) {
            return res.status(410).json({ error: "event has ended" })
        }

        // Check if user RSVP 
        const isGuest = await prisma.eventGuest.findUnique({
            where: {
                userId_eventId: {
                    userId: req.user.id,
                    eventId
                }
            }
        });
        if (!isGuest) {
            return res.status(404).json({ error: "user did not RSVP to this event" });
        }

        // Delete user from the guests
        await prisma.eventGuest.delete({
            where: {
                userId_eventId: {
                    userId: req.user.id,
                    eventId: eventId
                }
            }
        });

        // Success
        return res.status(204).send();

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
})


// Add a guest to this event (Manager or higher, or an organizer for this event)
router.post('/:eventId/guests', jwtAuth, async (req, res) => {
    try {

        // Authenticate 
        if (!req.user) {
            return res.status(401).json({ error: "not permitted" });
        }

        // Validate eventId 
        const eventId = Number(req.params.eventId);
        if (!Number.isInteger(eventId) || eventId < 1) {
            return res.status(404).json({ error: "invalid eventId" });
        }

        // Load event 
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organizers: true, guests: true }
        });
        if (!event) {
            return res.status(404).json({ error: "event not found" });
        }

        // Check clearance 
        const isOrganizer = (event.organizers || []).some(organizer => organizer.id === req.user.id);
        if (req.user.role !== 'manager' && req.user.role !== 'superuser' && !isOrganizer) {
            return res.status(403).json({ error: "not permitted" });
        }

        // Check if event is full or has ended  
        const currDate = new Date();
        if (event.endTime <= currDate) {
            return res.status(410).json({ error: "event has ended" });
        }
        if (event.capacity && event.guests.length >= event.capacity) {
            return res.status(410).json({ error: "event is full" });
        }

        // Validate utorid 
        const utorid = req.body.utorid.trim();
        if (!utorid || typeof utorid !== 'string' || !/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ error: "invalid utorid" });
        }

        // Find user and check if user is registered as an organizer/ guest
        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }
        const alreadyOrganizer = (event.organizers || []).some(organizer => organizer.id === user.id);
        if (alreadyOrganizer) {
            return res.status(400).json({ error: "user is already an organizer; remove user as organizer first, then retry" })
        }
        const alreadyGuest = event.guests.some(guest => guest.userId === user.id);
        if (alreadyGuest) {
            return res.status(400).json({ error: "user is already a guest" });
        }

        // Add as guest to event 
        const updatedEvent = await prisma.event.update({
            where: { id: event.id },
            data: {
                guests: {
                    create: {
                        user: { connect: { id: user.id } }, 
                        confirmed: true
                    }
                }
            },
            include: { guests: { include: { user: true } } }
        });

        // Success 
        return res.status(201).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            guestAdded: {
                id: user.id,
                utorid: user.utorid,
                name: user.name
            },
            numGuests: updatedEvent.guests.length
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
})

// Remove a guest from this event (Manager or higher, not organizers for this event)
router.delete('/:eventId/guests/:userId', jwtAuth, async (req, res) => {
    try {

        // Authenticate and check clearance
        if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'superuser')) {
            return res.status(403).json({ error: "not permitted" });
        }

        // Validate userId and eventId 
        const eventId = Number(req.params.eventId);
        const userId = Number(req.params.userId);
        if (!Number.isInteger(eventId) || eventId < 1) {
            return res.status(404).json({ error: "invalid eventId" });
        }
        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(404).json({ error: "invalid userId" });
        }

        // Load event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true }
        });
        if (!event) {
            return res.status(404).json({ error: "event not found" });
        }

        // Check to see if event has ended  
        const currDate = new Date();
        if (event.endTime <= currDate) {
            return res.status(410).json({ error: "event has ended" })
        }

        // Check if user is guest 
        const isGuest = event.guests.some(guest => guest.userId === userId);
        if (!isGuest) {
            return res.status(400).json({ error: "user is not a guest" });
        }

        // Delete user from event 
        await prisma.eventGuest.delete({
            where: {
                userId_eventId: {
                    userId: userId,
                    eventId: event.id
                }
            }
        });

        // Success
        return res.status(204).send();

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
})

// create a new reward transaction (managager or higher, or organizer for the event)
router.post('/:eventId/transactions', jwtAuth, async (req, res) => {

    // validate eventId
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId < 1) {
        return res.status(404).json({ error: "Not Found. 'eventId' is invalid." })
    }

    // retrieve event information with confirmed guests
    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
            guests: {
                include: { user: true },
                where: { confirmed: true }
            },

            organizers: true
        }
    });

    if (!event) {
        return res.status(404).json({ error: `Not Found. Could not find event with id ${eventId}.` });
    }

    // check clearance level
    const role = req.user.role;
    if (role !== 'manager' && role !== 'superuser' && !event.organizers.some(o => o.id === req.user.id)) {
        return res.status(403).json({ error: "Forbidden. Clearance level not met." });
    }

    const { type, utorid, amount } = req.body;
    // validate event type
    if (typeof type !== 'string' || type !== 'event') {
        return res.status(400).json({ error: "Bad Request. Type must be 'event'." });
    }

    // validate amount
    if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({ error: "Bad Request. 'amount' must be a positive integer." });
    }

    const confirmed_guests = event.guests.map(guest => guest.user);
    let remaining_guests = [...confirmed_guests]; // guests that haven't been awarded

    // check recipient(s)
    let curr_guest;

    // if utorid is not specified
    if (!utorid) {

        const num_fields = Object.keys(req.body).filter(k => !(k === 'utorid' && (req.body.utorid === null || req.body.utorid === undefined)));

        curr_guest = remaining_guests.pop();
        if (!curr_guest) {
            return res.json({}); 
        }

    }
    // if utorid is specified
    else if (typeof utorid === 'string') {
        // validate utorid
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ error: "Bad Request. Invalid utorid." });
        }
        // find matching user
        curr_guest = await prisma.user.findUnique({ where: { utorid: utorid } });
        if (!curr_guest) {
            return res.status(400).json({ error: "Bad Request. Could not find user." });
        }
        // check if user is a confirmed guest
        else {
            if (!confirmed_guests.some(g => g.id === curr_guest.id)) {
                return res.status(400).json({ error: "Bad Request. User is not a confirmed guest." });
            }
        }

    }
    else {
        return res.status(400).json({ error: "Bad Request. utorid must be of type string." });
    }

    let result = [];

    try {

        await prisma.$transaction(async (db) => {

            do {
                // check for sufficient event points remaining
                if (event.pointsRemain < amount) {
                    throw new Error("Bad Request. Not enough points remaining in event.");
                }

                // otherwise, award points to guest
                else {
                    // subtract points from event
                    event.pointsRemain -= amount;

                    await db.event.update({
                        data: { pointsRemain: { decrement: amount }, pointsAwarded: { increment: amount } },
                        where: { id: event.id }
                    });

                    // add points to user
                    await db.user.update({
                        data: { points: { increment: amount } },
                        where: { id: curr_guest.id }
                    });

                    // record event transaction
                    let new_transaction = await db.transaction.create({
                        data: {
                            utorid: curr_guest.utorid,
                            recipient: curr_guest.utorid,
                            type: 'event',
                            relatedId: event.id,
                            remark: event.name,
                            createdBy: req.user.utorid,
                            awarded: amount,
                            amount: amount,
                            eventId: event.id
                        },
                        select: {
                            id: true,
                            recipient: true,
                            type: true,
                            relatedId: true,
                            remark: true,
                            createdBy: true,
                            awarded: true,
                            event: { select: { name: true}}
                        }
                    })

                    // return single transaction (if utorid specified)
                    if (utorid) {
                        result = new_transaction; // return a single transaction
                        curr_guest = null;
                    }

                    // otherwise, return list of transactions
                    else {
                        result.push(new_transaction); // return list of transactions

                        // check if there is another guest to award
                        curr_guest = remaining_guests.pop();
                    }
                }
            } while (curr_guest);
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
    
    return res.json(result);
});

module.exports = router;