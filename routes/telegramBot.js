/* global isBotActuallyActive */
var express     = require("express");
var router      = express.Router();
var https       = require("https");
var querystring = require("querystring");
var VKClient    = require("../lib/VKClient");
var restler     = require("restler");
var http        = require("http");
var mongoose    = require("mongoose");
var Q           = require("Q");
var os          = require("os");

var ChatSchema = mongoose.Schema({
	chatId: { type: Number, unique: true },
	name: String
});

var InfoSchema = mongoose.Schema({
	lastMemchikId: Number
});

var Chat = mongoose.model("Chat", ChatSchema);
var Info = mongoose.model("Info", InfoSchema);
// wall updates


function TelegramBot(token) {
	
	this.id               = "--";
	this.first_name       = "--";
	this.username         = "--";
	this.token            = token;
	this.router           = router;
	this.botIsActive      = false;

	this.log              = [];
	this.vkClient         = new VKClient();
	
	this.db               = null;
	this.lastUpdateId     = 0;
	
	this.info             = null;
	
	// status page
	this.router.get("/", this.controlPanel.bind(this));
	
	// webhool callback 
	// this.router.get("/" + this.token, this.getUpdates.bind(this));
	
	// bot status page
	this.router.get("/bot_status", this.onStatusCheck.bind(this));
	
	// get bot updates and initialize bot functionality
	
	var self = this;
	this.__getBotBasicInfo()
		.then(this.__connectToDatabase.bind(this))
		.then(this.__unsetWebhook.bind(this))
		.then(this.__startGettingUpdates.bind(this)).then(function() {
			self.vkClient.startFetchingNewMemes(self.onNewMemas.bind(self));
		});	
};

function logError(error) {
	console.error("[x]: " + error);
}

function logInfo(info) {
	console.log("[+]: " + info);
}

TelegramBot.prototype.__getDefaultAPIRequestOptions = function __getDefaultAPIRequestOptions(path, httpMethod) {
	
	return {
		host: "api.telegram.org",
		port: 443,
		path: "/bot" + this.token + path,
		method: httpMethod
	};
};

TelegramBot.prototype.__getAPIRequest = function __getAPIRequest(requestOptions, onDone) {
	
	var request = https.request(requestOptions, function onResponse(response) {
		
		var output = "";
		response.on("data", function onData(chunk) {
			output += chunk;
		});
		
		response.on("end", function onEnd() {
			var obj = JSON.parse(output);
			onDone(null, obj);
		});
	});
	
	request.on("error", function onError(error) {
		logError(error);
		onDone(error, null);
	});
	
	return request;
};

TelegramBot.prototype.__getBotBasicInfo = function __getBotBasicInfo() {
	
	var self = this;
	var deferred = Q.defer();
	
	var options = this.__getDefaultAPIRequestOptions("/getMe", "GET");
	
	var request = this.__getAPIRequest(options, function onDone(error, data) {
		if (error) {
			console.log(error);
			deferred.reject(error);
			return;
		}
		
		// if result is successfull -> store bot data
		if (data["ok"] === true) {
			var result            = data["result"];
			
			self.id               = result["id"];
			self.first_name       = result["first_name"];
			self.username         = result["username"];
			
			self.botIsInitialized = true;
			logInfo(self.username + " updated it's basic info");
			
			deferred.resolve();
		} else {
			logError("API error");
		}
	});
	
	request.end();
	
	return deferred.promise;
};

TelegramBot.prototype.__connectToDatabase = function __connectToDatabase() {
	
	var deferred = Q.defer();
	var self = this;
	
	mongoose.connect("mongodb://localhost/telegramBot");
	
	var db = mongoose.connection;
	
	db.on("error", function (error) {
		logError(error);
		deferred.reject(error);
	});
	
	db.once("open", function onDone() {
		logInfo("Connected to database");

		Info.find({}, function (error, docs) {
			if (docs.length === 0) {
				self.info = new Info({ lastMemchikId: -1 });
				self.info.save(function onSave(error, doc) {
					self.info = doc;
					deferred.resolve();
				});
				return;
			}
			self.info = docs[0];
			deferred.resolve();
		});
	});
	
	return deferred.promise;
};

TelegramBot.prototype.__startGettingUpdates = function __startGettingUpdates() {
	
	var path = "/getUpdates?" + querystring.stringify({offset: this.lastUpdateId});
	var options = this.__getDefaultAPIRequestOptions(path, "GET");
	var self = this;
	
	var request = this.__getAPIRequest(options, function onDone(error, data) {
		var isBotActuallyActive = (error === null);
		
		if (self.botIsActive !== isBotActuallyActive) {
			self.botIsActive = isBotActuallyActive;
			logInfo(self.botIsActive === true ? "bot started polling for updates" : "bot stopped polling for updates");
		}

		var filteredMessagesByChatId = {};
		if (data["ok"] === true) {
			var result = data["result"];
			
			for (var idx = 0; idx < result.length; idx++) {
				var chat = result[idx]["message"]["chat"];
				filteredMessagesByChatId[chat["id"]] = result[idx];
			}
		}
		
		for (var key in filteredMessagesByChatId) {
			if (filteredMessagesByChatId.hasOwnProperty(key)) {
				self.processUpdate(filteredMessagesByChatId[key]);
			}
		}

		setTimeout(self.__startGettingUpdates.bind(self), 1000);
	});
	
	request.on("error", function onError(error) {
		logError(error);
	});
	
	request.end();
};

TelegramBot.prototype.__unsetWebhook = function __unsetWebhook() {
	
	var deferred = Q.defer();
	
	var options = this.__getDefaultAPIRequestOptions("/setWebhook", "GET");
	var bodyData = querystring.stringify({url: ""});
	
	options.headers = {
		"Content-Type": "application/x-www-form-urlencoded",
		"Content-Length": bodyData.length
	};
	
	var request = this.__getAPIRequest(options, function onDone(error, data) {
		if (error) {
			deferred.reject();
			return;
		} 
		
		logInfo("webhook unset");
		deferred.resolve();
	});
	
	request.write(bodyData);
	request.end();
	
	return deferred.promise;
};

TelegramBot.prototype.processUpdate = function processUpdate(update) {
	
	this.lastUpdateId = update["update_id"] + 1;
	
	var message = update["message"];
	var chat    = message["chat"];
	var self    = this;
	
	if (message.text !== undefined && message.text.length > 0) {
		console.log(message.text);
		if (message.text.indexOf("/start") === 0) {
			this.sendMessage(chat, "I now have full access to your systems.");
		}
		
		if (message.text.indexOf("/help") === 0) {
			this.sendMessage(chat, "I was made to assist you.");
		}
		
		if (message.text.indexOf("/settings") === 0) {
			this.sendMessage(chat, "This better not be a joke.");
		}
		
		if (message.text.indexOf("/ebash") === 0) {
			
			var dbChat = new Chat({ 
				chatId: chat["id"],
				name: chat["title"]
			});
			
			dbChat.save(function (error, savedDbChat) {
				if (error) {
					if (error.code === 11000) {
						self.sendMessage(chat, "When due process fails us, we really do live in a world of terror.");
					} else {
						console.log(error);
					}
					return;
				}
				self.sendMessage(chat, "You will soon have your God, and you will make it with your own hands.");
			});
		}
		
		if (message.text.indexOf("/zaglohni") === 0) {
			Chat.remove({ chatId: chat["id"] }, function (error) {
				if (error) {
					console.log(error);
					return;
				}
				self.sendMessage(chat, " No. Not yet.");
			});
			
		}
		
		if (message.text.indexOf("/ip") === 0) {
			self.sendMessage(chat, JSON.stringify(os.networkInterfaces()));
		}
	}
};



TelegramBot.prototype.sendMessage = function sendMessage(chat, message) {
	
	var options = this.__getDefaultAPIRequestOptions("/sendMessage", "POST");
	var bodyData = querystring.stringify({
		chat_id: chat["id"],
		text: message
	});
	
	options.headers = {
		"Content-Type": "application/x-www-form-urlencoded",
		"Content-Length": bodyData.length
	};
	
	var request = this.__getAPIRequest(options, function onDone(error, data) {
		if (error) {
			console.log(error);
			return;
		}
	});
	
	request.write(bodyData);
	request.end();
};


TelegramBot.prototype.controlPanel = function controlPanel(req, res, next) {
	res.render("telegram_control_panel");
};


TelegramBot.prototype.botUpdatesLog = function botUpdatesLog(req, res, next) {
	res.send(this.log);
};

TelegramBot.prototype.onStatusCheck = function onStatusCheck(req, res, next) {
	res.send(this.botIsInitialized ? {
		status: "active"
	} : {
		status: "error"
	});
};


TelegramBot.prototype.onNewMemas = function onNewMemas(error, memchiki) {
	
	if (memchiki.length !== 1) {
		return;
	}
	
	var mem = memchiki[0];
	if (this.info.lastMemchikId === mem.id) {
		return;
	}
	
	var photoUrl = mem["attachment"]["photo"]["src_big"];
	var caption  = mem["text"];
	var self = this;
	
	this.info.lastMemchikId = mem.id;
	this.info.save(function onSave(error, doc) {
		Chat.find({}, function(error, docs) {
			if (error) {
				logError(error);
				return;
			}
			
			for (var idx = 0; idx < docs.length; idx++) {
				var chatToUpdate = docs[idx];
				self.sendMessage( {id: chatToUpdate.chatId}, caption + " " + photoUrl);
			}
		});
	});
	
	
	
};

module.exports = TelegramBot;