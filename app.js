var express = require("express");

var routes   = require("./routes/index");
var api      = require("./routes/api");
var errors   = require("./routes/errors");

var TelegramBot = require("./routes/telegramBot");

var app         = express();
var telegramBot = new TelegramBot("120408883:AAGanGi1NI7PmLk0zp4AifBjYPZOqqXbjOA");

app.set("port", (process.env.PORT || 3000));
app.set("view engine", "jade");
app.use(express.static("public"));

app.use("/", routes);
app.use("/api", api);
app.use("/telegram", telegramBot.router)
app.use("/", errors);

var server = app.listen(app.get("port"), function () {
	var host = server.address().address;
	var port = server.address().port;
	
	console.log("App is running at http://%s:%s", host, port);
});


module.exports = app;