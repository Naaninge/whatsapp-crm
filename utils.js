const axios = require("axios");
require("dotenv").config();
const token = process.env.TOKEN;

 

 // Function to send a response text message
function sendWhatsAppMessage(phone_no_id,to, message) {
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
  
  // Function to send Welcome message
function sendWelcomeMessage(phone_no_id,to,username) {
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: "initial_message", // Ensure that the template name matches what is created on WhatsApp Business
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
                  type: "text", 
                  text: username,
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
  
    function sendIssueTypeMessage(phone_no_id,to,username) {
        axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
          data: {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
              name: "issue_type_message", // Ensure that the template name matches what is created on WhatsApp Business
              language: { code: "en" },
              components: [
               
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text", 
                      text: username,
                    },

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
  
    // Function to send closing off message
    function sendClosingMessageTemplate(phone_no_id,to,company,issue,description) {
      axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
          data: {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: to,
              type: "template",
              template: {
                  name: "confirmation_message",
                  language: { code: "en_US" },
                  components: [
                    {
                      type: "body",
                      parameters: [
                        {
                          type: "text",
                          text: company,
                        },
                        {
                          type: "text",
                          text: issue,
                        },
                        {
                          type: "text",
                          text: description,
                        }
                      ]
                  },
      
                  ]
              }
          },
          headers: {
              "Content-Type": "application/json"
          }
      })
          .then(() => console.log("Closing message template sent successfully"))
          .catch(error => console.error("Error sending closing message template:", JSON.stringify(error.response?.data || error.message, null, 2)));
  }
  
 

 
 
 // function to select issue description
  function selectIssue(msg_body, userSession) {
    let reply = ""; 
  
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
        reply = `Invalid option. Please select a valid option (e.g., "1" for Software Support):\n1. Software Support\n2. Hardware Support\n3. Infrastructure Services\n4. Printing Support\n5. Other Issues`;
    }
  
    return reply;
  }
  



module.exports = {selectIssue,sendWelcomeMessage,sendClosingMessageTemplate,sendWhatsAppMessage,sendIssueTypeMessage}