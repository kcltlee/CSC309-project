#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const express = require("express");
const path = require('path');
const cors = require('cors');
const app = express();

app.use(express.json());

// connect to frontend
app.use(cors({ origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// allow frontend to access uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ADD YOUR WORK HERE
const userRoutes = require('./routes/users'); 
app.use('/users', userRoutes);

const authRoutes = require('./routes/auth'); 
app.use('/auth', authRoutes);

const transactionRoutes = require('./routes/transactions'); 
app.use('/transactions', transactionRoutes);

const eventRoutes = require('./routes/events'); 
app.use('/events', eventRoutes);

const promotionRoutes = require('./routes/promotions'); 
app.use('/promotions', promotionRoutes);

// FOR TESTING ONLY
const devTestingRoute = require('./routes/devTesting');
app.use('/dev-testing', devTestingRoute);


// catch any unsupported method on any endpoint
app.all('*', (_, res) => {
  return res.status(405).json({ error: "Method Not Allowed" });
});

const http = require("http"); // TODO: change to https with certificate

const server = http.createServer(app);

const { initWebSocket } = require("./websocket");
initWebSocket(server);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});