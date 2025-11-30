#!/usr/bin/env node
'use strict';

const express = require('express'); 
const router = express.Router(); 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const jwtAuth = require('../middleware/jwtAuth');
const { typeCheck, parseQuery } = require('../middleware/verifyInput');

const { notify } = require('../websocket');

router.route('/')
    .post(jwtAuth, async (req, res) => {
        if (req.user.role === 'regular') {
            return res.status(403).json({ error: "not permitted" });
        }

        // format req.body for typeCheck
        if (req.body.promotionIds === null) {
            req.body.promotionIds = [];
        }

        if (!req.body || !typeCheck(req.body)) {
            return res.status(400).json({ error: "invalid payload" });
        }

        let { utorid, type, spent, amount, relatedId, promotionIds, remark } = req.body;
        if (!utorid || !type) {
            return res.status(400).json({ error: "invalid payload" });
        }
        const user = await prisma.user.findUnique({
            where: { utorid: utorid },
            include: { promotions: true }
        });
        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }
        
        if (type === "purchase") {
            if (spent == undefined || spent <= 0) {
                return res.status(400).json({ error: "spent must be > 0" });
            }
        } else if (type === "adjustment") {
            if (req.user.type === "cashier") {
                return res.status(403).json({ error: "not permitted" });
            }
            if (!amount || !relatedId) {
                return res.status(400).json({ error: "invalid payload" });
            }
            if (await prisma.transaction.findUnique({ where: { id: relatedId } }) == undefined) {
                return res.status(404).json({ error: "related transaction not found" });
            }
            spent = 0;
        } else {
            return res.status(400).json({ error: "invalid type" });
        }

        if (!remark) {
            remark = "";
        }
        
        let earned = Math.round(spent / 0.25);
        if (promotionIds !== undefined) {
            try {
                await prisma.$transaction(async (pm) => {
                    const now = Date.now()

                    for (const pid of promotionIds) {
                        let promotion = await pm.promotion.findUnique({ where: { id: pid } });

                        if (!promotion || promotion.end < now || (spent < promotion.minSpending && type !== "adjustment")) { 
                            throw new Error();
                        }

                        if (promotion.type === "onetime") {
                            if (user.promotions.some(p => p.id == pid)) {
                                await pm.user.update({
                                    where: { id: user.id },
                                    data: { promotions: { disconnect: { id: pid } } } // use promotion
                                });
                            } else { // already used
                                throw new Error();
                            }
                        }
                        earned += Math.round(spent * (promotion.rate * 100)) + promotion.points;
                    }

                    promotionIds = promotionIds.map(pid => ({ id: pid }));
                });
            } catch (err) {
                return res.status(400).json({ error: "invalid promotion" });
            }
        }

        const transaction_data = {
            data: {
                utorid: user.utorid,
                type: type,
                spent: spent,
                remark: remark,
                promotionIds: { connect: promotionIds },
                createdBy: req.user.utorid,
            },
            include: { promotionIds: true }
        }

        let new_transaction;
        let updatePoints;
        if (type === "purchase") {
            transaction_data.data.earned = earned;
            if (req.user.role === 'cashier' && req.user.suspicious === true) {
                transaction_data.data.earned = 0;
                transaction_data.data.suspicious = true;
            }
            transaction_data.data.amount = earned;
            updatePoints = earned;
        } else { // type === "adjustment"
            transaction_data.data.amount = amount;
            transaction_data.data.relatedId = relatedId;
            updatePoints = amount;
        }

        new_transaction = await prisma.transaction.create(transaction_data);

        await prisma.user.update({
            where: { id: user.id },
            data: { points: user.points + updatePoints }
        });

        const response = {
            id: new_transaction.id,
            utorid: new_transaction.utorid,
            type: new_transaction.type,
            spent: new_transaction.spent,
            amount: new_transaction.amount,
            relatedId: new_transaction.relatedId,
            remark: new_transaction.remark,
            createdBy: new_transaction.createdBy,
            earned: new_transaction.earned,
            promotionIds: new_transaction.promotionIds.map(p => p.id) 
        };

        // notify user
        if (type === 'adjustment') {
            notify(utorid, `ID${new_transaction.id}: Adjusted Transaction ${new_transaction.relatedId} by ${new_transaction.amount} pts.`);
        }

        else if (type === 'purchase') {
             notify(utorid, `ID${new_transaction.id}: Earned ${new_transaction.amount} pts from purchase of $${new_transaction.spent}.`);
        }

        return res.status(201).json(response);
    })
    .get(jwtAuth, async (req, res) => {
        if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
            return res.status(403).json({ error: "not permitted" });
        }

        const filters = parseQuery(req.query, ['id', 'utorid', 'createdBy', 'suspicious',
            'promotionId', 'type', 'relatedId', 'amount', 'operator', 'page', 'limit']);
        if (filters === false) {
            return res.status(400).json({ error: "invalid filters" });
        }
        delete filters.page;
        delete filters.limit;

        if (filters.relatedId !== undefined && (filters.type == undefined || filters.type === "purchase")) {
            return res.status(400).json({ error: "relatedId must be used with appropriate type" });
        }
        if (!(filters.amount === undefined) && (filters.operator === undefined)) {
            return res.status(400).json({ error: "amount must be used with operator" });
        } else if (filters.operator !== undefined && filters.operator !== "lte" && filters.operator !== "gte"){
            return res.status(400).json({ error: "invalid operator" });
        } else if (filters.amount !== undefined && filters.operator !== undefined) {
            const { operator, amount } = filters;
            filters.amount = { [operator]: amount };
            delete filters.operator;
        }
        else if (filters.operator){
            delete filters.operator;
        }

        const page = parseInt(req.query.page) || 1;
        const take = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * take;

        if (filters.promotionId !== undefined) {
            if (isNaN(filters.promotionId)) {
                return res.status(400).json({ error: "Bad Request. 'promotionId' must be a number."})
            }
            else {
                filters.promotionIds = {
                    some: {
                        id: filters.promotionId
                    }
                };
                delete filters.promotionId;
            }
        }

        let transactions = await prisma.transaction.findMany({
            where: filters,
            skip: skip,
            take: take,
            include: { promotionIds : true, event: true },
            orderBy: { id: 'desc'}
        });

        res.json({
            count: transactions.length,
            results: transactions
        });
    });

router.get('/:transactionId', jwtAuth, async (req, res) => {
    if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
        return res.status(403).json({ error: "not permitted" });
    }

    const id = Number(req.params.transactionId);
    if (!Number.isInteger(id)) {
        return res.status(404).json({ error: "invalid transaction id" });
    } 

    const transaction = await prisma.transaction.findUnique({ where: { id: id }, include: { promotionIds: true, event: true} });
    if(!transaction) {
        return res.status(404).json({ error: "transaction not found" });
    }

    res.json(transaction);
});

router.patch('/:transactionId/suspicious', jwtAuth, async (req, res) => {
    if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
        return res.status(403).json({ error: "not permitted" });
    }

    if (!req.body || !typeCheck(req.body, 1)) {
        return res.status(400).json({ error: "invalid payload" });
    }

    const { suspicious } = req.body;
    if (suspicious === undefined) {
        return res.status(400).json({ error: "invalid payload" });
    }

    const id = Number(req.params.transactionId);
    if (!Number.isInteger(id)) {
        return res.status(404).json({ error: "invalid transaction id" });
    } 

    const transaction = await prisma.transaction.findUnique({ where: { id: id } });
    if(!transaction) {
        return res.status(404).json({ error: "transaction not found" });
    }

    let { utorid, amount, suspicious: init_sus } = transaction;
    if (init_sus === suspicious) { // no change
        amount = 0
    } else if (!init_sus && suspicious) { // false to true
        amount = -amount;
    }

    const updated_transaction = await prisma.transaction.update({
        where: { id: id },
        data: { suspicious: suspicious },
        include: { promotionIds: true }
    });

    await prisma.user.update({
        where: { utorid: utorid },
        data: { points: { increment: amount } }
    });

    return res.json({
        id: updated_transaction.id,
        utorid: updated_transaction.utorid,
        type: updated_transaction.type,
        spent: updated_transaction.spent,
        amount: updated_transaction.amount,
        promotionIds: updated_transaction.promotionIds,
        suspicious: updated_transaction.suspicious,
        remark: updated_transaction.remark,
        createdBy: updated_transaction.createdBy
    });
});

// set a redemption transaction as being completed (cashier or higher)
router.patch('/:transactionId/processed', jwtAuth, async (req, res) => {

    // check clearance level
    const role = req.user.role;
    if (!['cashier', 'manager', 'superuser'].includes(role)) {
        return res.status(403).json({ error: "Forbidden. Clearance level not met."});
    }

    // validate transactionId
    const transactionId = Number(req.params.transactionId);
    if (!Number.isInteger(transactionId) || transactionId < 1) {
        return res.status(404).json({ error: "Not Found. 'transactionId' is invalid."})
    }

    // find transaction
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
    if (!transaction) {
        return res.status(404).json({ error: `Not Found. Could not find transaction with id ${transactionId}`});
    }

    // validate payload fields
    const allowedKeys = ['processed'];
    for (const key of Object.keys(req.body)) {
        if (!allowedKeys.includes(key)) {
            return res.status(400).json({ error: `Bad Request. Unexpected field: ${key}` });
        }
    }

    // validate processed
    if (req.body.processed !== true) {
        return res.status(400).json({ error: "Bad Request. 'processed' must be true."})
    }

    // check that transaction type is 'redemption'
    if (transaction.type !== 'redemption') {
        return res.status(400).json({ error: "Bad Request. 'type' must be 'redemption'."})
    }

    // check if transaction was processed
    if (transaction.processed === true) {
        return res.status(400).json({ error: "Bad Request. Transaction already processed."})
    }

    let result;

    // atomic transaction
    try {
        await prisma.$transaction(async (db) => {

            // mark transaction as processed
            result = await db.transaction.update({
                data: { 
                    processed: true,
                    processedBy: req.user.utorid,
                    relatedId: req.user.id
                },
                where: { id: transactionId },
                select: {
                    id: true,
                    utorid: true,
                    type: true,
                    processedBy: true,
                    remark: true,
                    createdBy: true
                }
            })

            result.redeemed = transaction.amount;

            // deduct reedemed amount from user's points
            await db.user.update({
                data: { 
                    points: { decrement: transaction.amount }},
                where: { utorid: transaction.utorid }
            })

         });

    } catch (err) {
        return res.status(400).json({ error: err.message});
    }

    // notify user
    notify(result.utorid, `ID${result.id}: Redemption of ${result.redeemed} pts processed.`);

    return res.json(result);
});

module.exports = router;
