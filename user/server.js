const express = require("express");
const app = express();
let rooter = express.Router();
const bodyparser = require("body-parser");
const DB_URI = require("./db.js");
console.log(DB_URI);
let cors = require("cors");
let oauth2Server = require("oauth2-server");
// let Request = new oauth2Server.Request;
// let Response = new oauth2Server.Response;
const mongoose = require("mongoose");
mongoose.connect(DB_URI);


app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended : true
}))

app.use(cors({
    optionSuccessStatus : 200
}))
app.oauth = new oauth2Server({
    model : require("./models/oauth")
})
require("./config/routes");

app.listen(4000, () => {
    console.log("user microservice running on port 4000");
})

module.exports = app;