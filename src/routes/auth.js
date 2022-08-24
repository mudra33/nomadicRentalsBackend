const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const routes = (User) => {
    const authController = require("../controllers/auth")(User);

    router.route("/signup").post(authController.signup);

    router.route("/signin").post(authController.signin);

    router.route("/signout").get(authController.signout);

    router.route("/forgot").post(authController.forgot);

    router.route("/resetLink/:token").post(authController.resetLink);

    router.route("/resetToken").post(authController.resetToken);

    router.route("/verifyLink/:token").get(authController.verifyLink);

    router.route("/verifyToken").post(authController.verifyToken);

    router.route("/resendToken").post(authController.resendToken);

    router
        .route("/facebook")
        .post(
            passport.authenticate("facebook-token", { session: false }),
            function (req, res, next) {
                if (!req.user)
                    return res.status(401).send("User Not Authenticated");

                const token = jwt.sign({ id: req.user._id }, config.secret, {
                    expiresIn: 86400,
                });

                res.status(200).send({
                    auth: true,
                    token: token,
                });
            }
        );

    router.route("/google").get(
        passport.authenticate("google", {
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
        })
    );

    router.route("/twitter").get(passport.authenticate("twitter"));

    return router;
};

module.exports = routes;
