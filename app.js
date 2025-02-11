const express = require("express");
const body_parser = require("body-parser");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const {  selectIssue, 
  sendClosingMessageTemplate, 
  sendWelcomeMessage, 
  sendWhatsAppMessage ,
  sendIssueTypeMessage,sendCustomerSupportList,sendconfirmationMessageTemplate} = require('./utils.js');
const {sendDescrErrorMessage} = require('./errorMessages.js')
const {validateNameInput,inputValidation} = require('./validation.js')




const app = express().use(body_parser.json());
const PORT = process.env.PORT || 3000;
const my_token = process.env.MY_TOKEN;


// MongoDB setup
const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI);
let database;

(async () => {
  try {
    await client.connect();
    database = client.db("customerSupport");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
})();


app.listen(PORT, () => {
  console.log(`Webhook is listening on port ${PORT}`);
});


// Store user sessions
const userSessions = {};
// Stores  issue description
const issuesMap = {
  Software: ["Application not responding", "Software installation issue", "Login/Password issue", "Update failure", "System error"],
  Hardware: ["Device not powering on", "Broken screen", "Peripheral not working", "Overheating", "Hardware compatibility"],
  Infrastructure: ["Network outage", "Server not responding", "Database connectivity issue", "Storage issue", "Backup failure"],
  Printing: ["Printer not responding", "Paper jam", "Low print quality", "Printer driver issue", "Connectivity problem"],
};


// To verify the callback URL
app.get("/webhooks", (req, res) => {
  let mode = req.query["hub.mode"];
  let challenge = req.query["hub.challenge"];
  let token = req.query["hub.verify_token"];

  if (mode && token) {
    if (mode === "subscribe" && token === my_token) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  }
});

  // Function to save session to MongoDB
  
  app.post("/webhooks", async (req, res) => {
    let body_param = req.body;
    console.log(JSON.stringify(body_param, null, 2));
  
    if (
      body_param.object &&
      body_param.entry &&
      body_param.entry[0].changes &&
      body_param.entry[0].changes[0].value.messages &&
      body_param.entry[0].changes[0].value.messages[0]
    ) {
      let phone_no_id =
        body_param.entry[0].changes[0].value.metadata.phone_number_id;
      let from = body_param.entry[0].changes[0].value.messages[0].from;
      let message = body_param.entry[0].changes[0].value.messages[0];
  
      let user_name =
        body_param.entry[0].changes[0].value.contacts &&
        body_param.entry[0].changes[0].value.contacts[0].profile.name
          ? body_param.entry[0].changes[0].value.contacts[0].profile.name
          : "Unknown";
  
      // Check if it's a text message or interactive reply
      let msg_body = message.text?.body || message.interactive?.list_reply
  
      // add session timer 
      if (!msg_body) {
        console.error("No valid message body found");
        return res.sendStatus(400);
      }
  
      // add email address
      // Check if user exists, if not send template message
      if (!userSessions[from]) {
        userSessions[from] = {
          ticketId: null,
          userName: user_name,
          fullName: null,
          email:null,
          phoneNumber: from,
          companyName: null,
          issueType: null,
          issueDescription: null,
          stage: "welcomeMessage",
        };
  
        sendWelcomeMessage(phone_no_id, from, user_name);
        userSessions[from].stage = "awaitingCompanyName";
        return res.sendStatus(200);
      }
  
      const userSession = userSessions[from];
      let reply = "";
      let regex;

      if( message.text?.body.toLowerCase() === "stop") {
        reply = "Thank you for contacting us. Goodbye!";
        sendWhatsAppMessage(phone_no_id, from, reply);
        delete userSessions[from]; // Clear the session
        return res.sendStatus(200);
    }
  
      // Return to main menu
      if (message.text?.body.toLowerCase() === "back") {
        sendCustomerSupportList(phone_no_id,from, user_name);
        userSession.stage = "issueType";
        return res.sendStatus(200);
      }
       
      // Get company name from user
      if (userSession.stage === "awaitingCompanyName") {
        // validate if company format is correct only letters and numbers included no special characters
         regex = /^[A-Za-z0-9&-]+(?: [A-Za-z0-9&-]+)*$/; 
        if(inputValidation(msg_body,regex,"awaitingCompanyName","awaitingName",userSession)){
          userSession.companyName = msg_body;
          reply= "Please provide us with your full name.\nSee EXAMPLE:\nThomas Roads"

        }else{
           reply ="Company names should contain only letters and numbers. Please remove any special symbols and try again."
        }


      }else if(userSession.stage == "awaitingName"){
        // function to check if the name is correct format
        if(validateNameInput(msg_body,userSession)){
          userSession.fullName = msg_body;
          reply= "Please provide us with your email address.\nSee EXAMPLE:\nthomasroads@gmail.com"

        }else{
          reply = "Oops! That doesn't look like a valid name. Please enter only letters (A-Z) without numbers or special characters. 😊";
        }
       
      }
      else if(userSession.stage == "awaitingEmail"){
        // check if the email is the correct format
         regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
         if(inputValidation(msg_body,regex,"awaitingEmail","issueType",userSession)){
          userSession.email = msg_body; 
          sendCustomerSupportList(phone_no_id, from, userSession.fullName);
         }else{
            reply = "Hmm… that doesn’t look like an email. Make sure it follows this format: yourname@example.com."
         }
      }
      else if (userSession.stage === "issueType") {
        msg_body = msg_body.id;
        userSession.issueType = msg_body;
        selectIssue(msg_body, userSession, phone_no_id, from, issuesMap,userSession.fullName)
        userSession.stage = "specificIssue";
      } else if (userSession.stage === "specificIssue") {
        
        if ( msg_body.interactive && msg_body.interactive.list_reply && msg_body.interactive.list_reply.title.toLowerCase().startsWith("other")) {
          userSession.ticketId = msg_body.id;
          reply = "Please describe the issue you are facing.";
          userSession.stage = "issueDescription";
        } else {
          const selectedMsg =  msg_body.description;
          userSession.ticketId = msg_body.id;
          const selectedDescription = selectedMsg || msg_body;
  
           // Both of these below should take to User Confirmation
           if (selectedDescription) {
            userSession.issueDescription = selectedDescription;
            userSession.stage = "confirmation"; 
          } else {
            sendDescrErrorMessage(phone_no_id, from);
          }
        }
      } else if (userSession.stage === "issueDescription") {
        userSession.issueDescription = msg_body;
        userSession.stage = "confirmation"; 
      }

 if(userSession.stage === "confirmation"){
// Send the confirmation message and move to the next stage
reply = `Confirm these details:
- Company name: ${userSession.companyName}
- Name: ${userSession.fullName}
- Email address: ${userSession.email}
- Bug type: ${userSession.issueType}
- Bug description: ${userSession.issueDescription}

By submitting this form, you consent to Green Enterprise Solutions storing and processing your information, including communicating with you via WhatsApp regarding our services. Type Yes to confirm or No to start over or Stop to opt out.`;
userSession.stage = "awaitingConfirmationResponse"; // New stage to wait for response
} else if (userSession.stage === "awaitingConfirmationResponse") { 
  // Handle the user's response to the confirmation message
  if (msg_body.toLowerCase() === "yes") {
      userSession.stage = "complete";
  } else if (msg_body.toLowerCase() === "no") {
      userSession.stage = "welcomeMessage";
      sendWelcomeMessage(phone_no_id, from, user_name);
      userSessions[from].stage = "awaitingCompanyName";
  } else {
      reply = "Hmm… that doesn’t look right. Make sure to write either yes or no";
  }
}  if (userSession.stage === "complete") {
       
        sendClosingMessageTemplate(
          phone_no_id,
          from,
          userSession.companyName,
          userSession.issueType,
          userSession.issueDescription
        );
        await saveSessionToDatabase(userSession);
        delete userSessions[from]; // Clear session after conversation ends
      } else {
        sendWhatsAppMessage(phone_no_id, from, reply);
      }
  
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });
  
  
  async function saveSessionToDatabase(session) {
    try {
      const collection = database.collection("userSessions");
      await collection.insertOne(session);
      console.log("User session saved to database:", session);
    } catch (error) {
      console.error("Failed to save session to database:", error);
    }
  }