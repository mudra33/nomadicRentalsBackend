const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const dotenv = require("dotenv");
dotenv.config();

module.exports = () => {
    passport.use(
        new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: process.env.JWT_SECRET,
            },
            function (jwt_payload, done) {
                User.findOne({ id: jwt_payload.sub }, function (err, user) {
                    if (err) return done(err);

                    if (!user) return done(null, false);

                    return done(null, user);
                });
            }
        )
    );
};
