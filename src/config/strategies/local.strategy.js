const passport = require("passport");
const { Strategy } = require("passport-local");

module.exports = () => {
    passport.use(
        new Strategy(
            {
                usernameField: "email",
                passwordField: "password",
            },
            (email, password, done) => {
                User.findOne({ "email.address": email }, function (err, user) {
                    if (err) return done(err);

                    if (!user)
                        return done(null, false, {
                            message: "Incorrect username.",
                        });

                    if (!user.validPassword(password))
                        return done(null, false, {
                            message: "Incorrect password.",
                        });

                    return done(null, user);
                });
            }
        )
    );
};
