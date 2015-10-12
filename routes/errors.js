var express = require("express");
var router  = express.Router();

/**
 * 404 error page route
 */
router.use(function(req, res, next) {
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

/**
 * Route for handling all app errors.
 */
router.use(function (err, req, res, next) {
	if (err.status === 404) {
		res.status(err.status).send(err.message);
	} else {
		res.status(500).send("Application error");
	}
	next();
});

module.exports = router;