const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express().use(body_parser.json());

const PORT = process.env.PORT || 3000;
const token = process.env.TOKEN;
const my_token = process.env.MY_TOKEN;

// Map user sessions to track conversation states
const userSessions = {};

app.listen(PORT, () => {
  console.log(`Webhook is listening on port ${PORT}`);
});

// Verify callback URL
app.get("/webhooks", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === my_token) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle incoming messages
app.post("/webhooks", (req, res) => {
  const body = req.body;

  if (
    body.object === "whatsapp_business_account" &&
    body.entry[0]?.changes[0]?.value?.messages
  ) {
    const phone_no_id = body.entry[0].changes[0].value.metadata.phone_number_id;
    const from = body.entry[0].changes[0].value.messages[0].from;
    const message = body.entry[0].changes[0].value.messages[0].text.body;

    // Check if user has an active session
    if (!userSessions[from]) {
      userSessions[from] = { stage: "greeting" };
    }

    const userSession = userSessions[from];

    // Handle conversation flow
    let reply;

    if (userSession.stage === "greeting") {
      reply = `Hello! Welcome to Green Enterprise Customer Support. How can we assist you today?\n\nPlease select one of the following options to log your issue: e.g "1"\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Inquiries`;
      userSession.stage = "menu";
    } else if (userSession.stage === "menu") {
      switch (message) {
        case "1":
          reply = "You’ve selected Software Support. Please describe the issue you're experiencing with your software.";
          userSession.stage = "software";
          break;
        case "2":
          reply = "You’ve selected Hardware Support. Please describe the problem you're experiencing with your hardware.";
          userSession.stage = "hardware";
          break;
        case "3":
          reply = "You’ve selected Infrastructure Services. Please describe the issue you're facing.";
          userSession.stage = "infrastructure";
          break;
        case "4":
          reply = "You’ve selected Printing Support. Please describe the problem you're facing with your printer.";
          userSession.stage = "printing";
          break;
        case "5":
          reply = "You’ve selected Other Inquiries. Please describe the issue or inquiry you have.";
          userSession.stage = "other";
          break;
        default:
          reply = "Invalid option. Please select a number between 1 and 5. \n e.g. 1 ";
      }
    } else {
      reply = `Thank you for the details. Your issue has been logged and will be assigned to the appropriate team for resolution.\n\nIs there anything else I can help you with? (Yes/No)`;
      userSession.stage = "confirmation";
    }

    // Handle confirmation stage
    if (userSession.stage === "confirmation" && message.toLowerCase() === "no") {
      reply = "Thank you for contacting Green Enterprise Support. Have a great day!";
      delete userSessions[from];
    } else if (userSession.stage === "confirmation" && message.toLowerCase() === "yes") {
      reply = `Please select one of the following options to log your issue:\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Inquiries`;
      userSession.stage = "menu";
    }

    // Send reply
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
      data: {
        messaging_product: "whatsapp",
        to: from,
        text: {
          body: reply,
        },
      },
      headers: { "Content-Type": "application/json" },
    })
      .then(() => console.log("Reply sent successfully"))
      .catch((error) => console.error("Error sending reply:", error.response?.data || error.message));

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Webhook is live!");
});
