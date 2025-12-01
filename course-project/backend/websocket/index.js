const WebSocket = require("ws");

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
const JWT_SECRET = process.env.JWT_SECRET; 
const PAGELIMIT = 5;
// connected clients
const clients = new Map();

let wss; // websocket instance

const { storeNotification, clearNotifications, 
      retrieveNotifications, viewNotification } = require('../services/notifications'); 

require('dotenv').config(); 
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Initialize WebSocket server
function initWebSocket(server) {

  // verify user before connecting to ws
  wss = new WebSocket.Server({ noServer: true });
  
  server.on("upgrade", async (req, socket, head) => {
      const searchParams = new URL(req.url, FRONTEND_URL).searchParams;
      const utorid = searchParams.get("utorid");

      try {

         // reject unknown origins
        const origin = req.headers.origin;
        if (origin !== FRONTEND_URL) {
          throw new Error('403 Forbidden');
        }

        // pasrse cookies to get jwt token
        const cookieHeader = req.headers.cookie || "";
        const cookies = Object.fromEntries(
          cookieHeader.split(";").map(c => {
            const [k, v] = c.trim().split("=");
            return [k, v];
          })
        );

        const token = cookies.jwt_token;

        if (!token) {
          throw new Error("Invalid token");
        }

        // check validity of token
        const user = await new Promise((resolve, reject) => jwt.verify(token, JWT_SECRET, (err, userData) => {
           if (err) return reject(new Error("Invalid or expired token"));

          prisma.user.findUnique({ where: { id: userData.id } })
          .then(user => {
            if (!user) return reject(new Error("User not found"));
            resolve(user);
          })
          .catch(err => reject(err));
        }));

        // check intended user
        if (user.utorid !== utorid) {
            throw new Error('utorid does not match credentials');
        }

        // upgrade to ws connection
        wss.handleUpgrade(req, socket, head, ws => {
          ws.user = user; 
          wss.emit("connection", ws, req);
        });

      } 

      catch (err) {
          socket.write(`HTTP/1.1 401 Unauthorized \r\n\r\n`);
          socket.destroy();
      }
  });

  wss.on("connection", async (ws, req) => {

    // add client connected clients map
    const utorid = ws.user.utorid;
    if (utorid) {
      clients.set(utorid, ws);
      console.log(`${utorid} connected via WebSocket`);
    }
 
    // user sends request
    ws.on("message", async (data) => {
      const { utorid, message, clear, view, id, retrieve, page } = JSON.parse(data);

      // send message to another user
      if (message) {

        if (ws.user.role === 'regular') {
            console.log(ws.user);
            ws.send(JSON.stringify({ error: 'Regular users cannot send messages.'}));
            return;
        }

          try {
              await notify(utorid, message, ws.user.utorid);
              ws.send(JSON.stringify({ sent: true}));
          }
          catch (err) {
              ws.send(JSON.stringify({ error: err.message}));
          }
      }

      // clear notifications
      if (clear) {
          clearNotifications(utorid);
      }

      else if (view) {
          viewNotification(id);
      }

      else if (retrieve) {

        // retrieve older notifications
        const pending = await retrieveNotifications(ws.user.utorid, page, PAGELIMIT);
        const end = (!pending || pending.length < PAGELIMIT);
        pending.map((notification) =>{ 
          notification.old = true; // append to end
          ws.send(JSON.stringify(notification))
        }); 

        // signal end
        if (end) ws.send(JSON.stringify({ end: true }));
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
async function notify(utorid, message, sender) {

    const ws = clients.get(utorid);
    const fullMessage = sender ? `${sender}: ${message}` : message;

    // store in database
    const notification = await storeNotification(utorid, fullMessage);

    // send directly if user is online
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    } 
}

// Export functions
module.exports = {
  initWebSocket, notify
};