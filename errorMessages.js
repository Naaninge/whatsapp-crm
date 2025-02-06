const axios = require("axios");
require("dotenv").config();
const token = process.env.TOKEN;



// Function to send back invalid description error messeage
function sendDescrErrorMessage(phone_no_id,to) {
    axios({
      method: "POST",
      url: `https://graph.facebook.com/v21.0/${phone_no_id}/messages?access_token=${token}`,
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: "invalid_input_message", 
          language: { code: "en_US" },
          components: [
            
            {
              type: "body",
              parameters: [
                {
                  type: "text", 
                  text: "other",
                },
                {
                    type: "text", 
                    text: "0",
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



    module.exports ={sendDescrErrorMessage}