var express = require("express");
var https   = require("https");

function VKClient() {
	this.owner_id = -45745333;
	this.offset   = 0;
	this.count    = 2;
	this.filter   = "owner";
	
	this.isFetchingMemes = false;
	this.onNewMemesCallback = null;
}

VKClient.prototype.startFetchingNewMemes = function startFetchingNewMemes(onNewMemes) {
	
	this.onNewMemesCallback = onNewMemes;
	this.getNewMemes();
	setInterval(this.getNewMemes.bind(this), 50000);
	this.getNewMemes();
};


VKClient.prototype.getNewMemes = function getNewMemes() {
	
	if (this.isFetchingMemes) {
		return;
	}
	
	this.isFetchingMemes = true;
	
	var self = this;
	var options = {
		host: "api.vk.com",
		port: 443,
		path: "/method/wall.get?owner_id=" + this.owner_id + "&offset=" + this.offset + "&count=" + this.count + "&filter=" + this.filter,
		method: "GET"
	};

	var request = https.request(options, function(response) {
		var output = "";
		response.on("data", function onData(chunk) {
			output += chunk;
		});
		
		response.on("end", function onEnd() {
			var obj = JSON.parse(output);
			var items = obj["response"];
			items.shift();
			items.shift();
			self.onNewMemesCallback(null, items);
			self.isFetchingMemes = false;
		});
	});
	
	request.on("error", function onError(error) {
		self.onNewMemesCallback(error, null);
		self.isFetchingMemes = false;
	});

	request.end();
}


module.exports = VKClient;