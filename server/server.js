// require("dotenv").config({ path: "./.env" });
const dotenv = require("dotenv").config();
const path = require("path");
const express = require("express");

const app = express();
app.use(express.json({}));
const cors = require("cors");
const { read } = require("fs");

//Persisting data to the front
const WebSocket = require("ws");
const http = require("http");
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));
app.use(express.static(process.env.STATIC_DIR));
app.use(
  cors({
    origin: "*",
  })
);

let WEBHOOK_EVENT;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
  appInfo: {
    // For sample support and debugging, not required for production:
    name: "stripe-samples/terminal-series/stripe-terminal-collect-payments",
    version: "0.0.1",
    url: "https://github.com/stripe-samples",
  },
});

app.get("/api/readers", async (req, res) => {
  try {
    const { data: readers } = await stripe.terminal.readers.list();
    res.json({ readersList: readers });
  } catch (e) {
    res.send({ error: { message: e.message } });
  }
});

let intent;
app.post("/api/readers/process-payment", async (req, res) => {
  try {
    const { amount, readerId, description } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount,
      payment_method_types: ["card_present"],
      capture_method: "manual",
      description: description,
    });

    intent = paymentIntent;

    const reader = await stripe.terminal.readers.processPaymentIntent(
      readerId,
      {
        payment_intent: paymentIntent.id,
        process_config: {
          enable_customer_cancellation: true,
        },
      }
    );
    res.send({ reader, paymentIntent });
  } catch (error) {
    res.send({ error: { message: error.message } });
  }
});

app.post("/api/readers/simulate-payment", async (req, res) => {
  try {
    const { readerId } = req.body;
    const reader =
      await stripe.testHelpers.terminal.readers.presentPaymentMethod(readerId);
    res.send({ reader });
  } catch (e) {
    res.send({ error: { message: e.message } });
  }
});

app.post("/api/payments/capture", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    res.send({ paymentIntent });
  } catch (e) {
    res.send({ error: { message: e.message } });
  }
});

app.post("/api/readers/cancel-action", async (req, res) => {
  try {
    const { paymentIntent } = req.body;
    const reader = await stripe.paymentIntents.cancel(paymentIntent);
    res.send({ reader });
  } catch (e) {
    res.send({ error: { message: e.message } });
  }
});

// app.post("/webhook", (req, res) => {
//   const payload = req.body;

//   const payloadString = JSON.stringify(payload, null, 2);
//   const secret = process.env.STRIPE_WEBHOOK_SECRET;

//   const header = stripe.webhooks.generateTestHeaderString({
//     payload: payloadString,
//     secret,
//   });
//   const event = stripe.webhooks.constructEvent(payloadString, header, secret);
//   WEBHOOK_EVENT = stripe.webhooks.constructEvent(payloadString, header, secret);

// wss.on("connection", (ws) => {
//   console.log("WebSocket client connected");
//   if (WEBHOOK_EVENT) {
//     ws.send(JSON.stringify(WEBHOOK_EVENT));
//   }
//   ws.on("close", () => {
//     console.log("WebSocket client disconnected");
//   });
// });

//   wss.clients.forEach((client) => {
//     console.log("client", client);
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify(event));
//     }
//   });

//   res.sendStatus(200);
// });

app.post("/webhook", (req, res) => {
  const event = req.body;
  WEBHOOK_EVENT = req.body;

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    if (WEBHOOK_EVENT) {
      ws.send(JSON.stringify(WEBHOOK_EVENT));
    }
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  wss.clients.forEach((client) => {
    console.log("client", client);
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });

  res.sendStatus(200);
});


server.listen(3001, () =>
  console.log(`Node server listening at http://localhost:3001`)
);
