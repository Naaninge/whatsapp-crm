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
          name: "initial_message", 
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
                  text:`Dear ${username}`,
                },
                {
                  type: "text",
                  text: "Green Enterprise Solutions"
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
  
    // Function to send  IssueTypes such as Software ,Hardware etc message
function sendIssueTypeMessage(phone_no_id,to,username) {
        axios({
          method: "POST",
          url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
          data: {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
              name: "issue_type_message", 
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

    
        // Function to send the final confrimation message 
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
                          text: company.toUpperCase(),
                        },
                        {
                          type: "text",
                          text: issue,
                        },
                        {
                          type: "text",
                          text: description.toUpperCase(),
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

// Function  to send the issue description message
function sendIssueDescriptionMessage(phone_no_id, to, category, descriptionList) {
    if (!descriptionList[category] || descriptionList[category].length < 5) {
        console.error(`Invalid category or insufficient descriptions for: ${category}`);
        return;
    }

    try {
        axios.post(
            `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "template",
                template: {
                    name: "issue_description_message", 
                    language: { code: "en" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: `${category.toUpperCase()} SUPPORT` },
                                ...descriptionList[category].slice(0, 5).map(text => ({ type: "text", text })),
                                { type: "text", text: "Other (Please describe)" },
                            ],
                        },
                    ],
                },
            },
            { headers: { "Content-Type": "application/json" } }
        );
        console.log("Template message sent successfully");
    } catch (error) {
        console.error("Error sending template message:", error.response ? error.response.data : error.message);
    }
}

// Function to show the description of the issueType
function selectIssue(msg_body, userSession, phone_no_id, to, descriptionList) {
  
    if (msg_body === "0") {
        // User wants to go back to issue type selection
        sendIssueTypeMessage(phone_no_id, to, userSession.userName);
        userSession.stage = "issueType";
        return;
    }

    let category = "";

    switch (msg_body) {
        case "0":
            sendIssueTypeMessage(phone_no_id, to, userSession.userName);
            break;
        case "1":
            userSession.issueType = "Software Issue";
            break;
        case "2":
            userSession.issueType = "Hardware Issue";
            break;
        case "3":
            userSession.issueType = "Infrastructure Issue";
            break;
        case "4":
            userSession.issueType = "Printing Issue";
            break;
        case "5":
            userSession.issueType = "Other";
            userSession.stage = "issueDescription";
            sendIssueDescriptionMessage(phone_no_id, to, userSession.issueType.split(" ")[0], descriptionList);
            return;
        default:
            sendIssueTypeMessage(phone_no_id, to, userSession.userName);
            return;
    }

    category = userSession.issueType.split(" ")[0];
    sendIssueDescriptionMessage(phone_no_id, to, category, descriptionList);
    userSession.stage = "specificIssue";
}
  
 
 
  


module.exports = {selectIssue,sendWelcomeMessage,sendClosingMessageTemplate,sendWhatsAppMessage,sendIssueTypeMessage,sendIssueDescriptionMessage}