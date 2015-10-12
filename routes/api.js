var express = require("express");
var router  = express.Router();

var __navigation = [
	{
		name: "Home",
		path: "/"
	},
	{
		name: "Telegram",
		path: "/telegram"
	}	
];

router.get("/navigation", function(req, res, next) {
	res.json(__navigation);
});


module.exports = router;