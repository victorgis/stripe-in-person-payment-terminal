// require("dotenv").config({ path: "./.env" });
const dotenv = require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
app.use(express.json({}));
const cors = require("cors");
app.use(express.static(process.env.STATIC_DIR));
app.use(
  cors({
    origin: "*",
  })
);

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
  appInfo: {
    // For sample support and debugging, not required for production:
    name: "stripe-samples/terminal-series/stripe-terminal-collect-payments",
    version: "0.0.1",
    url: "https://github.com/stripe-samples",
  },
});

console.log("stripe", stripe);

app.get("/api/readers", async (req, res) => {
  try {
    const { data: readers } = await stripe.terminal.readers.list();
    res.json({ readersList: readers });
  } catch (e) {
    res.send({ error: { message: e.message } });
  }
});

app.post("/api/readers/process-payment", async (req, res) => {
  try {
    const { amount, readerId, description, invoice } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount,
      payment_method_types: ["card_present"],
      capture_method: "manual",
      description: description,
      invoice: invoice,
    });

    const reader = await stripe.terminal.readers.processPaymentIntent(
      readerId,
      {
        payment_intent: paymentIntent.id,
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
  } catch (error) {
    res.send({ error: { message: e.message } });
  }
});

app.post("/api/payments/capture", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    res.send({ paymentIntent });
  } catch (error) {
    res.send({ error: { message: e.message } });
  }
});

app.post("/api/readers/cancel-action", async (req, res) => {
  try {
    const { readerId } = req.body;
    const reader = await stripe.terminal.readers.cancelAction(readerId);
    res.send({ reader });
  } catch (error) {
    res.send({ error: { message: e.message } });
  }
});

console.log("stripe", stripe);

app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
