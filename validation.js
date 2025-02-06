
function validateNameInput(message,session){
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/; 
    //  reply = "";
     isValid = false;

    // get message
    // check if it is alphabet A-Z
    // return true if alphabet
     
    if(nameRegex.test(message) && session.stage == "awaitingName"){
        // reply = successMessage; 
        isValid = true;
        session.stage = "awaitingEmail";
        
    }else{
        // reply = errorMessage;
        isValid = false;
        session.stage = "awaitingName";
       
    }

    
    return isValid;
}


module.exports= {validateNameInput}