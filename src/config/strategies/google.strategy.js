const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuthStrategy;
const dotenv = require("dotenv");
dotenv.config();

module.exports = () => {
    passport.use(
        new GoogleStrategy(
            {
                consumerKey: process.env.GOOGLE_CONSUMER_KEY,
                consumerSecret: process.env.GOOGLE_CONSUMER_SECRET,
                callbackURL: process.env.GOOGLE_CONSUMER_CALLBACK_URL,
            },
            (token, tokenSecret, profile, done) => {
                User.findOrCreate(
                    { googleId: profile.id },
                    function (err, user) {
                        return done(err, {
                            profile: profile,
                            token: token,
                        });
                    }
                );
            }
        )
    );
};
