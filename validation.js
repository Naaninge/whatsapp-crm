
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
//This function checks whether user entered correct format of messages
function inputValidation(message,regex,currentStage,nextStage,session){
  
    
     isValid = false;
     
    if(regex.test(message) && session.stage == currentStage){
        isValid = true;
        session.stage = nextStage;
        
    }else{
        isValid = false;
        session.stage = currentStage;
       
    }

    
    return isValid;
}


module.exports= {validateNameInput,inputValidation}