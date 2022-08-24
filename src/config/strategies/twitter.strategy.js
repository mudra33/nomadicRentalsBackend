const passport = require('passport')
const TwitterStrategy = require('passport-twitter').Strategy
const dotenv = require("dotenv");
dotenv.config();

module.exports = () => {
	passport.use(new TwitterStrategy({
		consumerKey: process.env.TWITTER_CONSUMER_KEY,
		consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
		callbackURL: process.env.TWITTER_CONSUMER_CALLBACK_URL,
	},
	function(token, tokenSecret, profile, done) {
		User.findOrCreate(..., function(err, user) {
			if (err) { return done(err) }
				done(null, user);
		})
	}))
}