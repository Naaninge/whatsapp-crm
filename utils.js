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


// Function to send an interactive list message for issueType
// function sendIssueTypeInteractiveList(phone_no_id, to) {
//   const messageData = {
//     messaging_product: "whatsapp",
//     recipient_type: "individual",
//     to: to,
//     type: "interactive",
//     interactive: {
//       type: "list",
//       header: {
//         type: "text",
//         text: "Choose Issue Type"
//       },
//       body: {
//         text: "Please select the type of issue you are facing."
//       },
//       footer: {
//         text: "Support Center"
//       },
//       action: {
//         button: "Issue Types",
//         sections: [
//           {
//             title: "Software Issues",
//             rows: [
//               {
//                 id: "software_1",
//                 title: "Application not responding",
//                 description: "Application is not opening or freezing"
//               },
//               {
//                 id: "software_2",
//                 title: "Software installation issue",
//                 description: "Issue with installing software"
//               },
//               {
//                 id: "software_3",
//                 title: "Login/Password issue",
//                 description: "Login or password-related issues"
//               },
//               {
//                 id: "software_4",
//                 title: "Update failure",
//                 description: "Issue with software update"
//               }
//             ]
//           },
//           {
//             title: "Hardware Issues",
//             rows: [
//               {
//                 id: "hardware_1",
//                 title: "Device not powering on",
//                 description: "Device won't turn on"
//               },
//               {
//                 id: "hardware_2",
//                 title: "Broken screen",
//                 description: "Physical damage to screen"
//               },
//               {
//                 id: "hardware_3",
//                 title: "Peripheral not working",
//                 description: "External devices not working"
//               }
//             ]
//           },
//           {
//             title: "Infrastructure Issues",
//             rows: [
//               {
//                 id: "infrastructure_1",
//                 title: "Network outage",
//                 description: "No internet or network issues"
//               },
//               {
//                 id: "infrastructure_2",
//                 title: "Server not responding",
//                 description: "Issue with server downtime"
//               },
//               {
//                 id: "infrastructure_3",
//                 title: "Database connectivity issue",
//                 description: "Issue connecting to the database"
//               }
//             ]
//           },
//           {
//             title: "Printing Issues",
//             rows: [
//               {
//                 id: "printing_1",
//                 title: "Printer not responding",
//                 description: "Printer is not turning on"
//               },
//               {
//                 id: "printing_2",
//                 title: "Paper jam",
//                 description: "Issue with paper stuck in the printer"
//               },
//               {
//                 id: "printing_3",
//                 title: "Low print quality",
//                 description: "Issue with print quality"
//               }
//             ]
//           }
//         ]
//       }
//     }
//   };

//   axios({
//     method: "POST",
//     url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
//     data: messageData,
//     headers: {
//       "Content-Type": "application/json"
//     }
//   })
//     .then(() => console.log("Interactive list message sent successfully"))
//     .catch((error) => console.error("Error sending interactive list message:", error.response ? error.response.data : error.message));
// }