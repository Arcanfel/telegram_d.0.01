var express = require("express");
var router  = express.Router();

/**
 * Express.js middleware works in top down fashion. If your 
 * route calls next() method then it will be passed down to the next
 * handler in a hierarchy
 */

/**
 * This middleware is used for logging all requests
 */
router.use(function(req, res, next) {
	console.log("%s %s", req.method, req.path);
	next();
});

/**
 * Home page route
 */
router.get("/", function(req, res, next) {
	res.render("index");
});


module.exports = router;