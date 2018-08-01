let mongoose = require("mongoose");
let oauthServer = require("oauth2-server");

let Request = oauthServer.Request;
let Response = oauthServer.Response;

let userController = require("../controller/user");
module.exports = function(app, router)
{
    app.post("/login", function(req, res, next){
        let request = new Request(req);
        let response = new Response(res);
        app.oauth.token(request, response).then(function(token){
            return res.json(token);
        })
        .catch(function(err){
            console.log(err);
            return res.status(400).send(err);
        })
    })

    router.route("/addUser").post(function(req, res){
        
    })

}