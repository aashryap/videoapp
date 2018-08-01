let db = require("./models/oauth");
let client = db.OAuthClientsModel();
console.log("--------------", client);
client.clientId = "ABC";
client.clientSecret = "ABC123";
client.save(function(err, client){
    console.log(client);
    if(err){
        console.log(err);
        return console.log(err);
    }
    else{
        console.log(client);
    }
})