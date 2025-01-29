const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express().use(body_parser.json());
const PORT = process.env.PORT || 3000;
const token = process.env.TOKEN;
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
    let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

    let user_name =
      body_param.entry[0].changes[0].value.contacts &&
      body_param.entry[0].changes[0].value.contacts[0].profile.name
        ? body_param.entry[0].changes[0].value.contacts[0].profile.name
        : "Unknown";

    // Check if user exists, if not send template message
    if (!userSessions[from]) {
      userSessions[from] = {
        userName: user_name,
        phoneNumber: from,
        companyName: null,
        issueType: null,
        issueDescription: null,
        stage: "welcomeMessage", // Start with template message
      };

      // Send WhatsApp Template Message instead of text
      sendWhatsAppTemplateMessage(phone_no_id, from);
      userSessions[from].stage = "companyName"; // Move to next stage
      return res.sendStatus(200);
    }

    const userSession = userSessions[from];
    let reply = "";

    if (userSession.stage === "companyName") {
      reply = "Please provide your company name to proceed.";
      userSession.stage = "awaitingCompanyName";
    } else if (userSession.stage === "awaitingCompanyName") {
      userSession.companyName = msg_body;
      reply = `Thank you! How can we assist ${userSession.companyName} today?\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Issues`;
      userSession.stage = "issueType";
    } else if (userSession.stage === "issueType") {
      switch (msg_body) {
        case "1":
          userSession.issueType = "Software Issue";
          reply = "You’ve selected Software Issue. Is this related to:\n1. Application not responding\n2. Software installation issue\n3. Login/Password issue\n4. Update failure\n5. System error\n6. Other (Please describe)";
          userSession.stage = "specificIssue";
          break;
        case "2":
          userSession.issueType = "Hardware Issue";
          reply = "You’ve selected Hardware Issue. Is this related to:\n1. Device not powering on\n2. Broken screen\n3. Peripheral not working\n4. Overheating\n5. Hardware compatibility\n6. Other (Please describe)";
          userSession.stage = "specificIssue";
          break;
        case "3":
          userSession.issueType = "Infrastructure Issue";
          reply = "You’ve selected Infrastructure Issue. Is this related to:\n1. Network outage\n2. Server not responding\n3. Database connectivity issue\n4. Storage issue\n5. Backup failure\n6. Other (Please describe)";
          userSession.stage = "specificIssue";
          break;
        case "4":
          userSession.issueType = "Printing Issue";
          reply = "You’ve selected Printing Issue. Is this related to:\n1. Printer not responding\n2. Paper jam\n3. Low print quality\n4. Printer driver issue\n5. Connectivity problem\n6. Other (Please describe)";
          userSession.stage = "specificIssue";
          break;
        case "5":
          userSession.issueType = "Other";
          reply = "You’ve selected Other. Please describe the issue you are facing.";
          userSession.stage = "issueDescription";
          break;
        default:
          reply = "Invalid option. Please select a valid option:\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Issues";
      }
    } else if (userSession.stage === "specificIssue") { 
      if (msg_body === "6") {
        reply = "Please describe the issue you are facing.";
        userSession.stage = "issueDescription";
      } else {
        const issuesMap = {
          Software: ["Application not responding", "Software installation issue", "Login/Password issue", "Update failure", "System error"],
          Hardware: ["Device not powering on", "Broken screen", "Peripheral not working", "Overheating", "Hardware compatibility"],
          Infrastructure: ["Network outage", "Server not responding", "Database connectivity issue", "Storage issue", "Backup failure"],
          Printing: ["Printer not responding", "Paper jam", "Low print quality", "Printer driver issue", "Connectivity problem"],
        };

        const category = userSession.issueType.split(" ")[0];
        const issueList = issuesMap[category];
        const selectedIndex = parseInt(msg_body) - 1;

        if (issueList && selectedIndex >= 0 && selectedIndex < issueList.length) {
          userSession.issueDescription = issueList[selectedIndex];
          reply = `Thank you. Your ${userSession.issueType} (${userSession.issueDescription}) has been logged. It will be assigned to the appropriate team for resolution. `;
          userSession.stage = "endSession";
        } else {
          reply = "Invalid option. Please select a valid issue or type 6 for Other.";
        }
      }
    } else if (userSession.stage === "issueDescription") {
      userSession.issueDescription = msg_body;
      reply = `Thank you for the details. Your issue with ${userSession.issueType} has been logged.`;
      userSession.stage = "endSession";
    } else if (userSession.stage === "endSession") {

      // last reply to the conversation
      sendClosingMessageTemplate(phone_no_id, from)

        // Save session data to MongoDB
        try {
          const collection = database.collection("userSessions");
          await collection.insertOne(userSession);
          console.log("User session saved to database:", userSession);
        } catch (error) {
          console.error("Failed to save session to database:", error);
        }

        delete userSessions[from]; // Clear session after conversation ends
      
    }
    
    sendWhatsAppMessage(phone_no_id, from, reply);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});


// Function to send a text message
function sendWhatsAppMessage(phone_no_id, to, message) {
  axios({
    method: "POST",
    url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
    data: {
      messaging_product: "whatsapp",
      to: to,
      text: { body: message },
    },
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(() => console.log("Message sent successfully"))
    .catch((error) => console.error("Error sending message:", error.response ? error.response.data : error.message));
}



// Function to send a WhatsApp template message
// function sendWhatsAppTemplateMessage(phone_no_id, to) {
//   axios({
//     method: "POST",
//     url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
//     data: {
//       messaging_product: "whatsapp",
//       to: to,
//       type: "template",
//       template: {
//         name: "welcome_prompt", // Ensure that the template name matches what is created on WhatsApp Business
//         language: { code: "en_US" },
//         components: [
//           {
//             type: "header",
//             parameters: [
//               {
//                 type: "image",
//                 image: {
//                   link: "https://i.imgur.com/38Ml4DW.png" 
//                 }
//               }
//             ]
//           },
//           {
//             type: "body",
//             parameters: [
//               {
//                 type: "text", // Ensure you are sending the correct number of parameters here
//                 text: "Welcome to our Support Center!"
//               },
//               {
//                 type: "text",
//                 text: "Please select the type of issue you would like to report."
//               }
//             ]
//           }
//         ]
//       }
//     },
//     headers: {
//       "Content-Type": "application/json"
//     }
//   })
//     .then(() => console.log("Template message sent successfully"))
//     .catch(error => console.error("Error sending template message:", error.response ? error.response.data : error.message));
// }

function sendClosingMessageTemplate(phone_no_id, to) {
  axios({
    method: "POST",
    url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
    data: {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "closing_message", // Ensure that the template name matches what is created on WhatsApp Business
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: "Green Enterprise Solutions"
              }
            ]
          },
          {
            type: "button",
            sub_type: "url", // For website button
            index: 0,
            parameters: [
              {
                type: "text",
                text: "Visit Website"
              },
              {
                type: "text",
                text: "https://green.com.na/" // Replace with your website URL
              }
            ]
          },
          {
            type: "button",
            sub_type: "phone_number", // For call button
            index: 1,
            parameters: [
              {
                type: "text",
                text: "Contact Us"
              },
              {
                type: "text",
                text: "+26461 416 300" // Replace with your phone number
              }
            ]
          }
        ]
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(() => console.log("Closing message template sent successfully"))
    .catch(error => console.error("Error sending closing message template:", error.response ? error.response.data : error.message));
}



function sendWhatsAppTemplateMessage(phone_no_id, to) {
  axios({
    method: "POST",
    url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
    data: {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "welcome_prompt", // Ensure that the template name matches what is created on WhatsApp Business
        language: { code: "en_US" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: "https://i.imgur.com/38Ml4DW.png" 
                }
              }
            ]
          },
          {
            type: "body",
            parameters: [
              {
                type: "text", // Ensure you are sending the correct number of parameters here
                text: "Green Enterprise Solutions"
              },
              {
                type: "text",
                text: "Green Support"
              }
            ]
          }
        ]
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(() => console.log("Template message sent successfully"))
    .catch(error => console.error("Error sending template message:", error.response ? error.response.data : error.message));
}




// Function to send an interactive list message for issueType
function sendIssueTypeInteractiveList(phone_no_id, to) {
  const messageData = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: "Choose Issue Type"
      },
      body: {
        text: "Please select the type of issue you are facing."
      },
      footer: {
        text: "Support Center"
      },
      action: {
        button: "Issue Types",
        sections: [
          {
            title: "Software Issues",
            rows: [
              {
                id: "software_1",
                title: "Application not responding",
                description: "Application is not opening or freezing"
              },
              {
                id: "software_2",
                title: "Software installation issue",
                description: "Issue with installing software"
              },
              {
                id: "software_3",
                title: "Login/Password issue",
                description: "Login or password-related issues"
              },
              {
                id: "software_4",
                title: "Update failure",
                description: "Issue with software update"
              }
            ]
          },
          {
            title: "Hardware Issues",
            rows: [
              {
                id: "hardware_1",
                title: "Device not powering on",
                description: "Device won't turn on"
              },
              {
                id: "hardware_2",
                title: "Broken screen",
                description: "Physical damage to screen"
              },
              {
                id: "hardware_3",
                title: "Peripheral not working",
                description: "External devices not working"
              }
            ]
          },
          {
            title: "Infrastructure Issues",
            rows: [
              {
                id: "infrastructure_1",
                title: "Network outage",
                description: "No internet or network issues"
              },
              {
                id: "infrastructure_2",
                title: "Server not responding",
                description: "Issue with server downtime"
              },
              {
                id: "infrastructure_3",
                title: "Database connectivity issue",
                description: "Issue connecting to the database"
              }
            ]
          },
          {
            title: "Printing Issues",
            rows: [
              {
                id: "printing_1",
                title: "Printer not responding",
                description: "Printer is not turning on"
              },
              {
                id: "printing_2",
                title: "Paper jam",
                description: "Issue with paper stuck in the printer"
              },
              {
                id: "printing_3",
                title: "Low print quality",
                description: "Issue with print quality"
              }
            ]
          }
        ]
      }
    }
  };

  axios({
    method: "POST",
    url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
    data: messageData,
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(() => console.log("Interactive list message sent successfully"))
    .catch((error) => console.error("Error sending interactive list message:", error.response ? error.response.data : error.message));
}
