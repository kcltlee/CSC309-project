#!/usr/bin/env node
'use strict';

const express = require('express'); 
const router = express.Router(); 

const { PrismaClient, TransactionType } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuid } = require('uuid');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const jwtAuth = require('../middleware/jwtAuth');
const { typeCheck, parseQuery } = require('../middleware/verifyInput');
const { objectEnumValues } = require('@prisma/client/runtime/library');

// helper function to extract appropriate info to return
function getUserInfo(user) {
    return {
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        role: user.role,
        points: user.points,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        verified: user.verified,
        suspicious: user.suspicious,
        avatarUrl: user.avatarUrl,
        promotions: user.promotions
    }
}

// helper function to display appropriate transaction fields based on its type
function formatTransactions(transactions) {

    // for each transaction type, list of fields to display
    const typeFields = {
        purchase: ["id", "utorid", "type", "remark", "createdBy", "amount", "spent", "promotionIds", "suspicious"],
        transfer: ["id", "utorid", "type", "remark", "createdBy", "sender", "recipient", "amount"],
        redemption: ["id", "utorid", "type", "remark", "createdBy", "amount", "promotionIds", "relatedId", "redeemed"],
        adjustment: ["id", "utorid", "amount", "type", "relatedId", "promotionIds", "suspicious", "remark", "createdBy"],
        event: ["id", "utorid", "recipient", "amount", "type", "eventId", "remark", "createdBy"]
    };

    return transactions.map(transaction => {
    const fields = typeFields[transaction.type];
    return Object.fromEntries(fields.map(field => [field, transaction[field]]));
    });

}

router.route('/')
    .post(jwtAuth, async (req, res) => {

        if (req.user.role === 'regular') {
            return res.status(403).json({ error: "not permitted" });
        }
        if (!req.body || !typeCheck(req.body, 3)) {
            return res.status(400).json({ error: "invalid payload" });
        }

        const { utorid, name, email } = req.body;
        if (!utorid || !/^[a-zA-Z0-9]{7,8}$/.test(utorid))  {
            return res.status(400).json({ error: "Invalid UTORid: must only contain letters or numbers, 7-8 characters" });
        } else if (await prisma.user.findUnique({ where: { utorid: utorid } })) {
            return res.status(409).json({ error: "UTORid already exists" });
        }
        
        if (!name || name.length < 1 || name.length > 50) {
            return res.status(400).json({ error: "Name must be between 1-50 characters" });
        }
        
        // Valid UofT email: allow mail.utoronto.ca or utoronto.ca variants
        if (!email || !/^.+@(?:mail\.)?utoronto\.ca$/.test(email)) {
           return res.status(400).json({ error: "Invalid UofT email" });
        }

        // add exising promotions
        const promotions = await prisma.promotion.findMany();
        const promotionIds = [];
        const now = Date.now();
        for (const promotion of promotions) {
            if (now <= promotion.end && promotion.type === "onetime") {
                promotionIds.push({ id: promotion.id });
            }
        }

        const new_user = await prisma.user.create({
            data: {
                utorid: utorid,
                name: name,
                email: email,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                promotions: { connect: promotionIds },
                resetToken: uuid()
            }
        });

        res.status(201).json({
            id: new_user.id,
            utorid: new_user.utorid,
            name: new_user.name,
            email: new_user.email,
            verified: new_user.verified,
            expiresAt: new_user.expiresAt,
            resetToken: new_user.resetToken
        });
    })
    .get(jwtAuth, async (req, res) => {
        if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
            return res.status(403).json({ error: "not permitted" });
        }

        const filters = parseQuery(req.query, ['name', 'role', 'verified', 'activated', 'page', 'limit']);
        if (filters === false) {
            return res.status(400).json({ error: "invalid filters" });
        }
        delete filters.page;
        delete filters.limit;

        const page = parseInt(req.query.page) || 1;
        const take = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * take;

        if (skip < 0) {
            return res.status(400).json({ error: "page must be positive"});
        }

        let count = await prisma.user.count({
            where: filters,
        });

        let users = await prisma.user.findMany({
            where: filters,
            skip: skip,
            take: take,
            include: { promotions: true }
        });

        users = users.map(user => getUserInfo(user));

        res.json({
            count: count,
            results: users
        });
    }); 
    
router.route('/me')
    .patch(jwtAuth, upload.single('avatar'), async (req, res) => {

        // reemove null values
        req.body = Object.fromEntries(
            Object.entries(req.body).filter(([_, value]) => value !== null)
        );

        if (!req.body || !typeCheck(req.body) || Object.keys(req.body).length > 3 ||  Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "invalid payload" });
        }

        const { name, email, birthday } = req.body;
        const avatar = req.file;
        const update_data = {};

        if (name !== undefined) {
            if (name.length < 1 || name.length > 50) {
                return res.status(400).json({ error: "Name must be between 1-50 characters" });
            }
            update_data.name = name;
        }
        
        if (email !== undefined) {
            if (!/^.+@(?:mail\.)?utoronto\.ca$/.test(email)) {
                return res.status(400).json({ error: "Invalid UofT email" });
            }

            const user = await prisma.user.findUnique({ where: { email: email } }) ;
            if (user.id != req.user.id) {
                return res.status(400).json({ error: "Email already in use" });
            }

            update_data.email = email;
        }

        if (birthday !== undefined) {
            // check format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
                return res.status(400).json({ error: "Invalid birthday (yyyy-mm-dd)" });
            }
            // check for valid date
            const [y, m, d] = birthday.split("-").map(Number);
            const date = new Date(y, m - 1, d); // month starts at 0 in Date
            // check if it matches its corresponding date conversion (since Date auto formats incorrect dates)
            if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
                return res.status(400).json({ error: "Invalid birthday" });
            }

            update_data.birthday = birthday;
        }

        if (avatar !== undefined) {
            update_data.avatarUrl = avatar.path;
        }

        const updated_user = await prisma.user.update({
            where: { id: req.user.id },
            data: update_data
        });

        res.json(getUserInfo(updated_user));
    })
    .get(jwtAuth, async (req, res) => {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { promotions: true} });
        if(!user) {
            return res.status(404).json({ error: "User not found" }); // should not be possible
        }

        const userInfo = getUserInfo(user);
        userInfo.password = user.password;

        res.json(userInfo);
    });

router.patch('/me/password', jwtAuth, async (req, res) => {
    if (!req.body || !typeCheck(req.body, 2)) {
        return res.status(400).json({ error: "invalid payload" });
    }

    const { old, new: newPassword } = req.body;

    if (old !== req.user.password) {
        return res.status(403).json({ error: "Current password is incorrect" });
    }
    
    if (!newPassword || newPassword.length < 8 || newPassword.length > 20
        || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/.test(newPassword)) {
        return res.status(400).json({ error: "New password must have 8-20 characters and \
            include at least 1 number, 1 uppercase, 1 lowercase, and 1 special character." });
    }

    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: newPassword }
    });

    res.status(200).send({ message: "updated password successfully" });
});

router.route('/:userId')
    .get(jwtAuth, async (req, res) => {
        if (req.user.role === 'regular') {
            return res.status(403).json({ error: "not permitted" });
        }

        const id = Number(req.params.userId);
        if (!Number.isInteger(id)) {
            return res.status(404).json({ error: "invalid user id" });
        } 

        const user = await prisma.user.findUnique({ where: { id: id }, include: { promotions: true} });
        if(!user) {
            return res.status(404).json({ error: "user not found" });
        }

        let result = getUserInfo(user);
        if (req.user.role === 'cashier') {
            result = {
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                points: user.points,
                verified: user.verified,
                promotions: user.promotions
            }
        }

        res.json(result);
    })
    .patch(jwtAuth, async (req, res) => {
        if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
            return res.status(403).json({ error: "Must be manager or superuser to perform this action" });
        }
        
        const id = Number(req.params.userId);
        if (!Number.isInteger(id)) {
            return res.status(404).json({ error: "invalid user id" });
        } 

        const user = await prisma.user.findUnique({ where: { id: id } });
        if(!user) {
            return res.status(404).json({ error: "user not found" });
        }

        // check for correct fields
        const allowedKeys = ['role', 'suspicious', 'verified', 'email'];
        for (const key of Object.keys(req.body)) {
            if (!allowedKeys.includes(key)) {
                return res.status(400).json({ error: `Bad Request. Unexpected field: ${key}` });
            }
        }

        if (Object.keys(req.body).length < 1 || Object.keys(req.body).length > 4) {
            return res.status(400).json({ error: "invalid number of fields" });
        }

        const update_data = {};
        const { email, verified, suspicious, role } = req.body;

        if (email !== undefined && email !== null) {
            if (typeof email !== 'string' || !/^[A-Za-z0-9._%+-]+@(?:mail\.)?utoronto\.ca$/i.test(email)) {
                return res.status(400).json({ error: "Invalid UofT email" });
            }
            update_data.email = email;
        }

        if (verified !== undefined && verified !== null) {
            if (typeof verified !== 'boolean' || verified !== true) {
                return res.status(400).json({ error: "Cannot unverify user" });
            }
            update_data.verified = verified;
        }

        if (role !== undefined && role !== null) {
            if (typeof role === 'string') {
                if (role !== 'regular' && role !== 'cashier' && role !== 'manager' && role !== 'superuser') {
                    return res.status(400).json({ error: "invalid role" });
                }
                if (req.user.role === 'manager' && (role === 'manager' || role === 'superuser')) {
                    return res.status(403).json({ error: "You are only permitted to set the role to regular or cashier" });
                }
                if (role === 'cashier' && user.suspicious === true) {
                    return res.status(400).json({ error: "Cannot promote suspicious users to be cashiers" });
                }
                update_data.role = role;
            }  else {
                return res.status(400).json({ error: "role must be a string"});
            }
        }
        if (suspicious !== undefined && suspicious !== null) {
            if (typeof suspicious === 'boolean') {
                update_data.suspicious = suspicious;
            } else {
                return res.status(400).json({ error: "suspicious must be a boolean"});
            }
        }

        await prisma.user.update({
            where: { id: id },
            data: update_data
        });

        update_data.id = user.id;
        update_data.utorid = user.utorid;
        update_data.name = user.name;

        res.json(update_data);
    });


router.route('/me/transactions')

   // create a new redemption transaction
    .post(jwtAuth, async (req, res) => {

        // check if user is verified
        if (req.user.verified !== true) {
            return res.status(403).json({ error: "Forbidden. User is not verified."});
        }

        // validate payload
        var { type, amount, remark } = req.body;
        if (typeof type !== 'string' || type !== 'redemption') {
            return res.status(400).json({ error: "Bad Request. 'type' must be 'redemption'."})
        }
        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ error: "Bad Request. 'amount' must be a positive integer."})
        }
        if ((remark === undefined && Object.keys(req.body).length > 2)
            || (remark !== undefined && Object.keys(req.body).length > 3)) {
            return res.status(400).json({ error: "Bad Request. Received more fields than expected."})
        } 
        else if (remark === undefined) {
            remark = '';
        }
        else if (typeof remark !== 'string') {
            return res.status(400).json({ error: "Bad Request. Remark must be of type string."})
        }

        // check if user has enough points
        if (req.user.points < amount) {
            return res.status(400).json({ error: "Bad Request. Insufficient points."})
        }

        // create redemption transaction
        const redemption = await prisma.transaction.create({
            data: {
                utorid: req.user.utorid,
                type: 'redemption',
                processedBy: null,
                processed: false,
                amount: amount,
                remark: remark,
                createdBy: req.user.utorid
            },
            select: {
                id: true,
                utorid: true,
                type: true,
                processedBy: true,
                processed: true,
                amount: true,
                remark: true,
                createdBy: true
            }
        });

        return res.status(201).json(redemption);
    })

    // retrieve a list of filtered transactions owned by the currently logged in user
    .get(jwtAuth, async (req, res) => {
               
        // check for correct fields
        const allowedKeys = ['type', 'relatedId', 'promotionId', 'amount', 'operator', 'pagination', 'limit'];
        for (const key of Object.keys(req.query)) {
            if (!allowedKeys.includes(key)) {
                return res.status(400).json({ error: `Bad Request. Unexpected field: ${key}` });
            }
            // convert string to number
            if (['relatedId', 'promotionId', 'amount', 'pagination', 'limit'].includes(key)) {
                req.query[key] = Number(req.query[key]);

            }
        }

        const { type, relatedId, promotionId, amount, operator, pagination, limit } = req.query;
        
        let query = {};
        query.include = { promotionIds: true};
        let filters = {}
        filters.utorid = req.user.utorid; // only include user's transactions

        // type
        if (type !== undefined) {
            if (!Object.values(TransactionType).includes(type)) {
                return res.status(400).json({ error: "Bad Request. Invalid transaction type."})
            }
            else {
                filters.type = type;
            }

        }
        // relatedId
        if (relatedId !== undefined) {
            if (!filters.type) {
                return res.status(400).json({ error: "Bad Request. 'relatedId' must be used with 'type'."})
            }
            else if (isNaN(relatedId)) {
                return res.status(400).json({ error: "Bad Request. 'relatedId' must be a number."})
            }
            else {
                filters.relatedId = relatedId;
            }
        }

        // promotionId
        if (promotionId !== undefined) {
            if (isNaN(promotionId)) {
                return res.status(400).json({ error: "Bad Request. 'promotionId' must be a number."})
            }
            else {
                filters.promotionIds = {
                    some: {
                        id: promotionId
                    }
                };
            }
        }

        // amount, operator
        if (amount !== undefined) {
            if (operator === undefined) {
                return res.status(400).json({ error: "Bad Request. 'amount' must be used with 'operator'."})
            }
            else if (isNaN(amount)) {
                return res.status(400).json({ error: "Bad Request. 'amount' must be a number."})
            }
            else if (!['gte', 'lte'].includes(operator)) {
                return res.status(400).json({ error: "Bad Request. 'operator' must be 'gte' or 'lte'."})
            }
            else {
                filters.amount = { [operator]: amount};
            }

        }

        query.where = filters;

        let pageSize = 10;

        // limit
        if (limit !== undefined) {
            if (!Number.isInteger(limit) || limit < 0) {
                return res.status(400).json({ error: "Bad Request. 'limit' must be a non-negative integer."})
            }
            else {
                pageSize = limit;
                query.take = limit;
            }
        }
        else {
            query.take = 10;
        }

        // pagination
        if (pagination !== undefined) {
            if (!Number.isInteger(pagination) || pagination <= 0) {
                return res.status(400).json({ error: "Bad Request. 'pagination' must be a positive integer. \
                                                    pages start at 1. "})
            }
            else {
                query.skip = (pagination - 1) * pageSize; // pages start at 1 but prisma rows start at 0
            }
        }

        // get total count of filtered results
        const count = await prisma.transaction.count({ where: filters });

        // get paginated results
        const result = await prisma.transaction.findMany(query);

        const formattedTransactions = formatTransactions(result);
        return res.json({ count: count, results: formattedTransactions });

    });

/**
 * Description: Create a new transfer transaction between the current logged-in user (sender) 
 *              and the user specified by userId (the recipient)
 * Clearance: regular or higher
 */
router.post('/:userId/transactions', jwtAuth, async (req, res) => {    

    // validate userId
    const recipientId = Number(req.params.userId);
    if (!Number.isInteger(recipientId) || recipientId < 1) {
        return res.status(404).json({ error: "Not Found. 'userId' is invalid."})
    }
    
    // find recipient
    const recipient = await prisma.user.findUnique({ where: { id: recipientId }});
    if (!recipient) {
        return res.status(404).json({ error: `Not Found. Could not find user with id ${recipientId}.`});
    }

    // validate payload
    var { type, amount, remark } = req.body;
    if (typeof type !== 'string' || type !== 'transfer') {
        return res.status(400).json({ error: "Bad Request. 'type' must be 'transfer'."})
    }
    if (!Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({ error: "Bad Request. 'amount' must be a positive integer."})
    }
    if ((remark === undefined && Object.keys(req.body).length > 2)
        || (remark !== undefined && Object.keys(req.body).length > 3)) {
        return res.status(400).json({ error: "Bad Request. Received more fields than expected."})
    } 
    else if (remark === undefined) {
        remark = '';
    }
    else if (typeof remark !== 'string') {
        return res.status(400).json({ error: "Bad Request. Remark must be of type string."})
    }

    // check if sender is verified
    if (req.user.verified !== true) {
        return res.status(403).json({ error: "Forbidden. Sender is not verified."});
    }

    // don't allow transferring points to self
    if (req.user.id === recipientId) {
        return res.status(400).json({ error: "Bad Request. Cannot transfer to self."});
    }

    try {

        var result;
        const sender = req.user;

        await prisma.$transaction(async (db) => {
            // check if sender has enough points
            if (sender.points < amount) {
                throw new Error("Bad Request. Not enough points to send.")
            }

            // deduct sender's points
            await db.user.update({
                data: { points: { decrement: amount }},
                where: { id: sender.id }
            });

            // record send transaction
            result = await db.transaction.create({
                data : {
                    utorid: sender.utorid,
                    amount: -amount,
                    type: type,
                    relatedId: recipientId,
                    remark: remark,
                    createdBy: sender.utorid,
                    sender: sender.utorid,
                    recipient: recipient.utorid,
                    sent: amount
                },
                select: {
                    id: true,
                    utorid: true,
                    remark: true,
                    createdBy: true,
                    sender: true,
                    recipient: true,
                    sent: true,
                    type: true
                }
            });

            // increase recipient's points
            await db.user.update({
                data: { points: { increment: amount }},
                where: { id: recipientId}
            });

            // record receive transaction
            await db.transaction.create({
                data : {
                    utorid: recipient.utorid,
                    amount: amount,
                    type: type,
                    relatedId: sender.id,
                    remark: remark,
                    createdBy: sender.utorid,
                    sender: sender.utorid,
                    recipient: recipient.utorid
                }
            });

        });

    } catch (err) {
        return res.status(400).json({ error: err.message});
    }

    return res.status(201).json(result);

});

module.exports = router;