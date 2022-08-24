const passport = require("passport");
const FacebookTokenStrategy = require("passport-facebook-token");
const User = require("../../models/user");
const dotenv = require("dotenv");
dotenv.config();

module.exports = () => {
    passport.use(
        new FacebookTokenStrategy(
            {
                clientID: process.env.FACEBOOK_CLIENT_ID,
                clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            },
            (accessToken, refreshToken, profile, done) => {
                User.findOne(
                    {
                        "facebook.id": profile.id,
                    },
                    function (err, user) {
                        if (!user) {
                            const newUser = new User({
                                name: {
                                    first: profile.name.givenName,
                                    last: profile.name.familyName,
                                },
                                email: {
                                    address: profile.emails[0]
                                        ? profile.emails[0].value
                                        : "",
                                },
                                userType: "rider",
                                gender: profile.gender,
                                photos: profile.photos,
                                facebook: {
                                    id: profile.id,
                                    token: accessToken,
                                },
                            });

                            newUser.save(function (error, savedUser) {
                                if (error) return done(error);

                                return done(error, savedUser);
                            });
                        } else {
                            return done(err, user);
                        }
                    }
                );
            }
        )
    );
};
