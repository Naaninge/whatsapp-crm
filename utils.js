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
        text: {body: message },
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
// function sendIssueDescriptionMessage(phone_no_id, to, category, descriptionList) {
//     if (!descriptionList[category] || descriptionList[category].length < 5) {
//         console.error(`Invalid category or insufficient descriptions for: ${category}`);
//         return;
//     }

//     try {
//         axios.post(
//             `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
//             {
//                 messaging_product: "whatsapp",
//                 to: to,
//                 type: "template",
//                 template: {
//                     name: "issue_description_message", 
//                     language: { code: "en" },
//                     components: [
//                         {
//                             type: "body",
//                             parameters: [
//                                 { type: "text", text: `${category.toUpperCase()} SUPPORT` },
//                                 ...descriptionList[category].slice(0, 5).map(text => ({ type: "text", text })),
//                                 { type: "text", text: "Other (Please describe)" },
//                             ],
//                         },
//                     ],
//                 },
//             },
//             { headers: { "Content-Type": "application/json" } }
//         );
//         console.log("Template message sent successfully");
//     } catch (error) {
//         console.error("Error sending template message:", error.response ? error.response.data : error.message);
//     }
// }



function sendIssueDescriptionMessage(phone_no_id, to, category,descriptionList) {
  // Get issues from issuesMap
  const issues = descriptionList[category];
 
  if (!issues || issues.length === 0) {
    console.error(`No issues found for category: ${category}`);
    return;
  }
  

  console.log(issues)
  // Maps issues into WhatsApss Interactive List format
  const rows = issues.map((issue, index) => ({
    id: `${category.toLowerCase()}_issue_${index + 1}`,
    title:category,
    description: issue
  }));
  console.log(rows)
 
   // If no issues exist for the category, send a fallback message
   if (rows.length === 0) {
    console.error(`No issues found for category: ${category}`);
    return;
  }
  axios({
    method: "POST",
    url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
    data: {
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: `${category} Issues`
        },
        body: {
          text: `Please select a ${category} description below: `
        },
        footer: {
          text: "Powered by Green Enterprise "
        },
        action: {
          button: "Select Description",
          sections: [
            {
              
              title: `${category}`,
              rows: rows
            }
          ]
        }
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(() => console.log("Customer support list message sent successfully"))
  .catch(error => console.error("Error sending message:", error.response ? error.response.data : error.message));
}


// Function to show the description of the issueType
function selectIssue(msg_body, userSession, phone_no_id, to, descriptionList,username) {
  
    if (msg_body === "0") {
        // User wants to go back to issue type selection
        sendCustomerSupportList(phone_no_id,to, username);
        userSession.stage = "issueType";
        return;
    }

    let category = "";

    switch (msg_body) {
        case "software_support":
            userSession.issueType = "Software Issue";
            break;
        case "hardware_support":
            userSession.issueType = "Hardware Issue";
            break;
        case "infrastructure":
            userSession.issueType = "Infrastructure Issue";
            break;
        case "printing":
            userSession.issueType = "Printing Issue";
            break;
        case "other":
            userSession.issueType = "Other";
            userSession.stage = "issueDescription";
            reply = "Please describe the issue you are facing.";
            sendWhatsAppMessage(phone_no_id, to, reply);
            
            return;
        default:
            // error message 
            reply = "Oops! It looks like you typed instead of selecting from the list. Please tap on one of the options to proceed. 😊";
            sendWhatsAppMessage(phone_no_id, to, reply);
            return;
    }

    category = userSession.issueType.split(" ")[0];
    sendIssueDescriptionMessage(phone_no_id, to, category, descriptionList);
    userSession.stage = "specificIssue";
}
  
 
          
// Function to send whatsapp list
function sendCustomerSupportList(phone_no_id, to, username) {
  axios({
    method: "POST",
    url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
    data: {
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: "Customer Support Services"
        },
        body: {
          text: `${username}, how can we assist you today? Please select a service below.`
        },
        footer: {
          text: "Powered by Green Enterprise "
        },
        action: {
          button: "Select Service",
          sections: [
            {
              title: "Support Categories",
              rows: [
                { id: "software_support", title: "Software Support", description: "Assistance with software installation, troubleshooting, and updates." },
                { id: "hardware_support", title: "Hardware Support", description: "Issues related to computers, servers, and other hardware." },
                { id: "infrastructure", title: "Infrastructure Support", description: "Networking, cloud services, and IT infrastructure solutions." },
                { id: "printing", title: "Printing Support", description: "Printer setup, maintenance, and troubleshooting." },
                { id: "other", title: "Other Inquiries", description: "General IT support and consultations." }
              ]
            }
          ]
        }
      }
    },
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(() => console.log("Customer support list message sent successfully"))
  .catch(error => console.error("Error sending message:", error.response ? error.response.data : error.message));
}





module.exports = {selectIssue,sendWelcomeMessage,sendClosingMessageTemplate,sendWhatsAppMessage,sendIssueTypeMessage,sendIssueDescriptionMessage,sendCustomerSupportList}