const passport = require("passport");

require("./strategies/jwt.strategy")();
require("./strategies/local.strategy")();
// require("./strategies/google.strategy")();
require("./strategies/facebook.strategy")();

module.exports = (app) => {
    app.use(passport.initialize());

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });
};
