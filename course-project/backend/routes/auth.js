#!/usr/bin/env node
'use strict';

const express = require('express'); 
const router = express.Router(); 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { v4: uuid } = require('uuid');

const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
const JWT_SECRET = process.env.JWT_SECRET; 

const { typeCheck } = require('../middleware/verifyInput');

const ipRequests = {};

router.post('/tokens', async (req, res) => {
    if (!req.body || !typeCheck(req.body, 2)) {
        return res.status(400).json({ error: "invalid payload" });
    }

    const { utorid, password } = req.body;
    if (!utorid || password === undefined)  {
        return res.status(400).json({ error: "Missing UTORid or password" });
    }

    const user = await prisma.user.findUnique({
        where: {
            utorid: utorid
        }
    });

    if (!user || user.password !== password) {
        return res.status(401).json({ error: "UTORid or password is incorrect" });
    }

    const userData = {
        id: user.id,
        role: user.role
    }

    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d'}); 

    // update user's last login
    await prisma.user.update({
        data: { 
            lastLogin: new Date(),
            activated: true },
        where: { utorid: utorid }
    })

    res.json({
        token,
        expiresAt: (new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString()
    }); 
});

router.post('/resets', async (req, res) => {
    const ip = req.ip;
    const now = Date.now();

    if (!req.body || !typeCheck(req.body, 1)) {
        return res.status(400).json({ error: "invalid payload" });
    }

    const { utorid } = req.body;
    if (!utorid)  {
        return res.status(400).json({ error: "invalid payload" });
    }

    const user = await prisma.user.findUnique({ where: { utorid: utorid } });
    if (!user) {
        return res.status(404).json({ error: "UTORid does not match any existing account" });
    }

    if (ipRequests[ip] && now - ipRequests[ip] < 60000) { // request made < 60 secs ago
        return res.status(429).json({ error: "Too many requests. Please wait 1 minute before trying again." });
    } 

    ipRequests[ip] = now;
    const resetInfo = {
        expiresAt: new Date(now + 60 * 60 * 1000), // 1 hour later
        resetToken: uuid()
    }

    await prisma.user.update({
        where: { utorid: utorid },
        data: resetInfo
    });

    res.status(202).json(resetInfo);
});

router.post('/resets/:resetToken', async (req, res) => {
    console.log(req.body)
    const resetToken = req.params.resetToken;
    if (!resetToken) {
        return res.status(404).json({ error: "Missing reset token" });
    }

    const { utorid, password } = req.body;
    if (!utorid)  {
        return res.status(400).json({ error: "invalid payload" });
    }

    const user = await prisma.user.findUnique({ where: { utorid: utorid } });
    if (!user) {
        return res.status(404).json({ error: "user not found" });
    }

    const resetUsers = await prisma.user.findMany({ where: { resetToken: resetToken }});
    if (resetUsers.length !== 0 && (resetUsers.length > 1 || resetUsers[0].utorid !== utorid)) {
        return res.status(401).json({ error: "Invalid reset token" });
    }

    if (resetToken !== user.resetToken) {
        return res.status(404).json({ error: "Invalid reset token" });
    } else if (Date.now() > user.expiresAt) {
        return res.status(410).json({ error: "Reset token expired" });
    }

    // if (!req.body || !typeCheck(req.body, 2)) {
    //     return res.status(400).json({ error: "invalid payload" });
    // }

    if (!password || password.length < 8 || password.length > 20
        || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/.test(password)) {
        return res.status(400).json({ error: "New password must have 8-20 characters and \
            include at least 1 number, 1 uppercase, 1 lowercase, and 1 special character" });
    }

    await prisma.user.update({
        where: { utorid: utorid },
        data: { password: password,
            resetToken: null }
    });

    res.status(200).send({ message: "reset password successfully" });
});

module.exports = router;