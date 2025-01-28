const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
const { saveSession } = require("./db/db");
require("dotenv").config();

const app = express().use(body_parser.json());
const PORT = process.env.PORT || 3000;
const token = process.env.TOKEN;
const my_token = process.env.MY_TOKEN;

app.listen(PORT, () => {
  console.log(`Webhook is listening on port ${PORT}`);
});

const userSessions = {};

app.get("/webhooks", (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const token = req.query["hub.verify_token"];

  if (mode && token) {
    if (mode === "subscribe" && token === my_token) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  }
});

app.post("/webhooks", async (req, res) => {
  const body_param = req.body;
  console.log(JSON.stringify(body_param, null, 2));

  if (
    body_param.object &&
    body_param.entry &&
    body_param.entry[0].changes &&
    body_param.entry[0].changes[0].value.messages &&
    body_param.entry[0].changes[0].value.messages[0]
  ) {
    const phone_no_id =
      body_param.entry[0].changes[0].value.metadata.phone_number_id;
    const from = body_param.entry[0].changes[0].value.messages[0].from;
    const msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

    const user_name =
      body_param.entry[0].changes[0].value.contacts &&
      body_param.entry[0].changes[0].value.contacts[0].profile.name
        ? body_param.entry[0].changes[0].value.contacts[0].profile.name
        : "Unknown";

    if (!userSessions[from]) {
      userSessions[from] = {
        userName: user_name,
        phoneNumber: from,
        issueType: null,
        issueDescription: null,
        stage: "menu",
      };
    }

    const userSession = userSessions[from];
    let reply = "";

    if (userSession.stage === "menu") {
      reply = "Hello! Welcome to Green Enterprise Customer Support. How can we assist you today?\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Inquiries";
      userSession.stage = "issueType";
    } else if (userSession.stage === "issueType") {
      switch (msg_body) {
        case "1":
          userSession.issueType = "Software Support";
          reply = "You’ve selected Software Support. Please describe the issue you're experiencing.";
          userSession.stage = "issueDescription";
          break;
        case "2":
          userSession.issueType = "Hardware Support";
          reply = "You’ve selected Hardware Support. Please describe the problem you're experiencing.";
          userSession.stage = "issueDescription";
          break;
        case "3":
          userSession.issueType = "Infrastructure Services";
          reply = "You’ve selected Infrastructure Services. Please describe the issue you're facing.";
          userSession.stage = "issueDescription";
          break;
        case "4":
          userSession.issueType = "Printing Support";
          reply = "You’ve selected Printing Support. Please describe the problem you're facing with your printer.";
          userSession.stage = "issueDescription";
          break;
        case "5":
          userSession.issueType = "Other Inquiries";
          reply = "You’ve selected Other Inquiries. Please describe the issue or inquiry you have.";
          userSession.stage = "issueDescription";
          break;
        default:
          reply = "Invalid option. Please select a valid option:\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Inquiries";
      }
    } else if (userSession.stage === "issueDescription") {
      userSession.issueDescription = msg_body;
      reply = `Thank you for the details. Your issue with ${userSession.issueType} has been logged. It will be assigned to the appropriate team for resolution. Is there anything else I can help you with? (Yes/No)`;
      userSession.stage = "confirmation";
    } else if (userSession.stage === "confirmation") {
      if (msg_body.toLowerCase() === "no") {
        reply = "Thank you for contacting Green Enterprise Support. Have a great day!";
        await saveSession(userSession);
        delete userSessions[from];
      } else {
        reply = "Please select one of the following options:\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Inquiries";
        userSession.stage = "issueType";
      }
    }

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
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        console.log("Message sent successfully");
      })
      .catch((error) => {
        console.error("Error sending message:", error.response ? error.response.data : error.message);
      });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Webhook");
});
