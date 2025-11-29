const WebSocket = require("ws");

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// connected clients
const clients = new Map();

let wss; // websocket instance

const { storeNotification, clearNotifications, 
      retrieveNotifications, viewNotification, regularUsers } = require('../routes/notifications'); 

require('dotenv').config(); 
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Initialize WebSocket server
function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws, req) => {

    const utorid = new URL(req.url, FRONTEND_URL).searchParams.get("utorid");

    // add client connected clients map
    if (utorid) {
      clients.set(utorid, ws);
      console.log(`${utorid} connected via WebSocket`);
    }

    // get pending notifications from when the user was offline
    const pending = await retrieveNotifications(utorid);
    pending.map((notification) => ws.send(JSON.stringify(notification)));    

    // user sends request
    ws.on("message", async (data) => {
      const { utorid, message, clear, view, id } = JSON.parse(data);

      // notify another user
      if (message) {
          try {
              await notify(utorid, message);
              ws.send(JSON.stringify({ sent: true}));
          }
          catch (err) {
              ws.send(JSON.stringify({ error: err.message}));
          }
      }

      // clear notifications
      else if (clear) {
          clearNotifications(utorid);
      }

      else if (view) {
          viewNotification(id);
      }

    });

    ws.on("close", () => {
      if (utorid) {
        clients.delete(utorid);
        console.log(`${utorid} disconnected`);
      }
    });
  });
}

// sends a notification to a user
async function notify(utorid, message) {
    const ws = clients.get(utorid);

    // store in database
    const notification = await storeNotification(utorid, message);

    // send directly if user is online
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    } 
}

// Export functions
module.exports = {
  initWebSocket
};