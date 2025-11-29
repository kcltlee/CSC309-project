#!/usr/bin/env node
'use strict'; 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// create pending notification when user is offline
const storeNotification = async (utorid, message) => {
    try {
        const result = await prisma.Notification.create({ 
            data: {utorid: utorid, message: message, time: new Date()}
        })
        return result;
    }
    catch (err) {
        console.log(err.message);
    }

};

const clearNotifications = async (utorid) => {
    try {
        console.log("clearing", utorid);
        await prisma.notification.deleteMany({where: { utorid: utorid }})
    }
    catch (err) {
        console.log(err.message);
    }

}

const retrieveNotifications = async (utorid) => {
    try {
        const result = await prisma.notification.findMany({ 
            where: { utorid: utorid }
        });
        return result;
    }
    catch (err) {
        console.log(err.message);
    }

}

const viewNotification = async (id) => {
    try {
        await prisma.notification.update({ 
            data: { seen: true },
            where: { id: id}
        });
    }
    catch (err) {
        console.log(err.message);
    }

}

module.exports = { storeNotification, clearNotifications, retrieveNotifications, viewNotification };