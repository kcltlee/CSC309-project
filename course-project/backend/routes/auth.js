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

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const bcrypt = require('bcryptjs');

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

    if (!user || (user.activated && !password) || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "UTORid or password is incorrect" });
    }

    const userData = {
        id: user.id,
        role: user.role
    }

    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d'}); 

    // update user's last login
    await prisma.user.update({
        data: { lastLogin: new Date() },
        where: { utorid: utorid }
    })

    res.cookie("jwt_token", token, {
        httpOnly: true,
        sameSite: "none", 
        secure: true, 
        path: '/'
    });

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
    const resetToken = uuid();
    const resetInfo = {
        expiresAt: new Date(now + 60 * 60 * 1000), // 1 hour later
        resetToken: resetToken
    }

    await prisma.user.update({
        where: { utorid: utorid },
        data: resetInfo
    });
    
    const msg = {
        to: user.email, 
        from: 'loyaltyprogram309@gmail.com', 
        subject: 'Reset Your Password',
        html: `<p>You requested a password reset. Please use the reset token below within 60 minutes to reset your password.</p> \
            <p>Reset token: <b>${resetToken}</b></p>`
    }

    sgMail.send(msg)
        .then(() => {
            return res.status(202).json({ message: "email sent successfully" });
        })
        .catch((error) => {
            return res.status(400).json({ error: error });
        })

    // res.status(202).json(resetInfo);
});

router.post('/resets/:resetToken', async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
        where: { utorid: utorid },
        data: { password: hashedPassword,
            resetToken: null,
            activated: true }
    });

    res.status(200).send({ message: "reset password successfully" });
});

router.post('/logout', async (req, res) => {
    res.clearCookie("jwt_token");
    res.send({ message: "logged out successfully" });
});

module.exports = router;