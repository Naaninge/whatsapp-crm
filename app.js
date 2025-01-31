const express = require("express");
const body_parser = require("body-parser");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const {  selectIssue, 
  sendClosingMessageTemplate, 
  sendWelcomeMessage, 
  sendWhatsAppMessage ,
  sendIssueTypeMessage,sendCustomerSupportList} = require('./utils.js');
const {sendDescrErrorMessage} = require('./errorMessages.js')


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



//   let body_param = req.body;
//   console.log(JSON.stringify(body_param, null, 2));

//   if (
//     body_param.object &&
//     body_param.entry &&
//     body_param.entry[0].changes &&
//     body_param.entry[0].changes[0].value.messages &&
//     body_param.entry[0].changes[0].value.messages[0]
//   ) {
//     let phone_no_id =
//       body_param.entry[0].changes[0].value.metadata.phone_number_id;
//     let from = body_param.entry[0].changes[0].value.messages[0].from;
//     let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

//     let user_name =
//       body_param.entry[0].changes[0].value.contacts &&
//       body_param.entry[0].changes[0].value.contacts[0].profile.name
//         ? body_param.entry[0].changes[0].value.contacts[0].profile.name
//         : "Unknown";

//     // Check if user exists, if not send template message
//     if (!userSessions[from]) {
//       userSessions[from] = {
//         userName: user_name,
//         phoneNumber: from,
//         companyName: null,
//         issueType: null,
//         issueDescription: null,
//         stage: "welcomeMessage", // Start with template message
//       };

//        // Send WhatsApp Template Message instead of text
       
//        sendWelcomeMessage(phone_no_id, from,user_name);
//        userSessions[from].stage = "awaitingCompanyName"; // Move to next stage
     
//       return res.sendStatus(200);
//     }
    
//     const userSession = userSessions[from];
//     let reply = "";

//     // return to main menu
//     if (msg_body === "0") {
//       sendIssueTypeMessage(phone_no_id, from, userSession.userName);
//       userSession.stage = "issueType";
//       return res.sendStatus(200);
//   }
//    // get companyName from user 
//    if (userSession.stage === "awaitingCompanyName") {
//       userSession.companyName = msg_body;
//       // select the type of issue e.g. Software, Hardware
//       sendCustomerSupportList(phone_no_id, from, user_name)
//       userSession.stage = "issueType";
//     } else if (userSession.stage === "issueType") {
//       // select type of issue description 
//       selectIssue(msg_body, userSession, phone_no_id, from, issuesMap);
//     } else if (userSession.stage === "specificIssue") { 
//       if (msg_body === "6") {
//         reply = "Please describe the issue you are facing.";
//         userSession.stage = "issueDescription";
//       } else {
//         const category = userSession.issueType.split(" ")[0];
//         const issueList = issuesMap[category];
//         const selectedIndex = parseInt(msg_body) - 1;

//         if (issueList && selectedIndex >= 0 && selectedIndex < issueList.length) {
//           userSession.issueDescription = issueList[selectedIndex];

//          // close  off conversation
//          userSession.stage = "complete";
//         } else {
//           sendDescrErrorMessage(phone_no_id,from)
//         }
//       }
//     } else if (userSession.stage === "issueDescription") {
//       userSession.issueDescription = msg_body;
//       // close off conversation
//       userSession.stage = "complete";
//     } 
//    if (userSession.stage === "complete") {
//       sendClosingMessageTemplate(phone_no_id, from, userSession.companyName, userSession.issueType, userSession.issueDescription);
//       await saveSessionToDatabase(userSession);
//       delete userSessions[from]; // Clear session after conversation ends
//     } else {
//       sendWhatsAppMessage(phone_no_id, from, reply);
//     }
//     res.sendStatus(200);
//   } else {
//     res.sendStatus(404);
//   }
// });


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
      let msg_body = message.text?.body || message.interactive?.list_reply?.id;
  
      if (!msg_body) {
        console.error("No valid message body found");
        return res.sendStatus(400);
      }
  
      // Check if user exists, if not send template message
      if (!userSessions[from]) {
        userSessions[from] = {
          userName: user_name,
          fullName: null,
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
  
      // Return to main menu
      if (msg_body === "0") {
        sendCustomerSupportList(phone_no_id,from, user_name);
        userSession.stage = "issueType";
        return res.sendStatus(200);
      }
    
       
      // Get company name from user
      if (userSession.stage === "awaitingCompanyName") {
        userSession.companyName = msg_body;
        userSession.stage = "awaitingName";
         reply = "Please provide us with your full name.\nSee EXAMPLE:\nThomas Roads"
      
      } else if(userSession.stage == "awaitingName"){
       userSession.fullName = msg_body;
       userSession.stage = "issueType";
      sendCustomerSupportList(phone_no_id, from, userSession.fullName);
       
      }
      else if (userSession.stage === "issueType") {
        userSession.issueType = msg_body; // Store the selected category
        selectIssue(msg_body, userSession, phone_no_id, from, issuesMap,userSession.fullName)
        userSession.stage = "specificIssue";
      } else if (userSession.stage === "specificIssue") {
        if (msg_body === "6") {
          reply = "Please describe the issue you are facing.";
          userSession.stage = "issueDescription";
        } else {
          const category = userSession.issueType.split(" ")[0];
          const issueList = issuesMap[category];
          const selectedIndex = parseInt(msg_body) - 1;
  
          if (issueList && selectedIndex >= 0 && selectedIndex < issueList.length) {
            userSession.issueDescription = issueList[selectedIndex];
            userSession.stage = "complete";
          } else {
            sendDescrErrorMessage(phone_no_id, from);
          }
        }
      } else if (userSession.stage === "issueDescription") {
        userSession.issueDescription = msg_body;
        userSession.stage = "complete";
      }
  
      if (userSession.stage === "complete") {
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