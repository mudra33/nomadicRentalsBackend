const passport = require("passport");
const crypto = require("crypto");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const passwordValidator = require("password-validator");

const dotenv = require("dotenv");
dotenv.config();
// const email = require("../config/email");

const passwordSchema = new passwordValidator();
passwordSchema
    .is()
    .min(8)
    .is()
    .max(20)
    .has()
    .lowercase()
    .has()
    .digits()
    .has()
    .symbols()
    .has()
    .not()
    .spaces()
    .is()
    .not()
    .oneOf(["Passw0rd", "Password123"]);

const authController = (User) => {
    const signup = (req, res) => {
        if (!req.body.email)
            return res.status(400).send({
                message: "Email address is required",
            });

        if (!validator.isEmail(req.body.email))
            return res.status(400).send({
                message: "Email address is not valid",
            });

        if (!req.body.phone)
            return res.status(400).send({
                message: "Phone Number is required",
            });

        if (!validator.isNumeric(req.body.phone))
            return res.status(400).send({
                message: "Phone Number is not valid",
            });

        if (req.body.phone.length !== 10)
            return res.status(400).send({
                message: "Phone Number must be of valid length",
            });

        if (!req.body.role)
            return res.status(400).send({
                message: "User type is required",
            });

        if (!passwordSchema.validate(req.body.password))
            return res.status(400).send({
                message:
                    "Password is must be between 8 to 20 characters and must contain alpha numeric and contain special character.",
            });

        User.findOne(
            { "email.address": req.body.email },
            function (err, result) {
                if (err)
                    return res.status(500).send({
                        message: err.name + ": " + err.message,
                    });

                if (result)
                    return res.status(400).send({
                        message: "User already registered.",
                    });

                const token = Math.floor(1000 + Math.random() * 9000);

                const user = User({
                    email: {
                        address: req.body.email,
                        verified: false,
                        token: token,
                    },
                    phone: {
                        countryCode: "+91",
                        number: req.body.phone,
                        verified: false,
                    },
                    role: req.body.role,
                    password: req.body.password,
                });

                user.save(function (err) {
                    if (err)
                        return res.status(400).send({
                            message: err.name + ": " + err.message,
                        });

                    email
                        .userVerify(user.email.address, token)
                        .then((result) => {
                            res.status(200).send({
                                message: "Registeration successful.",
                                data: result.response,
                            });
                        })
                        .catch((err) => {
                            res.status(404).send({
                                message: err.name + ": " + err.message,
                            });
                        });
                });
            }
        );
    };

    const signin = (req, res) => {
        if (!req.body.email)
            return res.status(400).send({
                message: "Email address is required",
            });

        if (!validator.isEmail(req.body.email))
            return res.status(400).send({
                message: "Email address is not valid",
            });

        if (!req.body.password)
            return res.status(400).send({
                message: "Password is required",
            });

        User.findOne({ "email.address": req.body.email }, function (err, user) {
            if (err)
                return res.status(500).send({
                    message: err.name + ": " + err.message,
                });

            if (!user)
                return res.status(404).send({
                    message: "User not found.",
                });

            user.passwordIsValid(
                req.body.password,
                function (errPass, results) {
                    if (errPass)
                        return res.status(500).send({
                            message: errPass.name + ": " + errPass.message,
                        });

                    if (!results)
                        return res.status(400).send({
                            message: "Authentication failed. Wrong password.",
                        });

                    const token = jwt.sign({ id: user._id }, config.secret, {
                        expiresIn: 86400,
                    });

                    res.status(201).send({
                        auth: true,
                        token: token,
                    });
                }
            );
        }).select("+password");
    };

    const signout = (req, res) => {
        res.status(200).send({
            auth: false,
            token: null,
        });
    };

    const forgot = (req, res) => {
        if (!req.body.email)
            return res.status(400).send({
                message: "Email address is required",
            });

        if (!validator.isEmail(req.body.email))
            return res.status(400).send({
                message: "Email address is not valid",
            });

        User.findOne({ "email.address": req.body.email }, function (err, user) {
            if (err)
                return res.status(500).send({
                    message: err.name + ": " + err.message,
                });

            if (!user)
                return res.status(400).send({
                    message: "User not found.",
                });

            const token = Math.floor(1000 + Math.random() * 9000);

            user.resetPassword.token = token;
            user.resetPassword.expires = new Date() + 3600000;

            user.save(function (err) {
                if (err)
                    return res.status(400).send({
                        message: err.name + ": " + err.message,
                    });

                email
                    .resetPassword(user.email.address, token)
                    .then((result) => {
                        return res.status(200).send({
                            message: "Email sent.",
                            data: result,
                        });
                    })
                    .catch((err) => {
                        return res.status(404).send({
                            message: err.name + ": " + err.message,
                        });
                    });
            });
        });
    };

    const resetLink = (req, res) => {
        if (!req.body.password && !passwordSchema.validate(req.body.password))
            return res.status(400).send({
                message: "A valid password is required",
            });

        if (
            !req.body.confirmPassword &&
            !passwordSchema.validate(req.body.confirmPassword)
        )
            return res.status(400).send({
                message: "A valid confirm password is required",
            });

        if (
            req.body.password &&
            req.body.confirmPassword &&
            req.body.password != req.body.confirmPassword
        )
            return res.status(400).send({
                message: "Password and Confirm password not matching",
            });

        User.findOne(
            {
                "resetPassword.token": req.params.token,
                // 'resetPassword.expires': {
                // 	$gt: Date.now()
                // }
            },
            function (err, user) {
                if (err)
                    return res.status(500).send({
                        message: err.name + ": " + err.message,
                    });

                if (!user)
                    return res.status(400).send({
                        message: "Not a valid Token.",
                    });

                user.password = req.body.password;
                user.resetPassword.token = undefined;
                user.resetPassword.expires = undefined;

                user.save(function (err) {
                    if (err)
                        return res.status(400).send({
                            message: err.name + ": " + err.message,
                        });

                    email
                        .passwordChanged(user.email.address)
                        .then((result) => {
                            return res.status(200).send({
                                message: "Password changed successful.",
                                data: result,
                            });
                        })
                        .catch((err) => {
                            return res.status(400).send({
                                message: err.name + ": " + err.message,
                            });
                        });
                });
            }
        );
    };

    const resetToken = (req, res) => {
        if (!req.body.token)
            return res.status(400).send({
                message: "Verification token not provided.",
            });

        if (!req.body.password && !passwordSchema.validate(req.body.password))
            return res.status(400).send({
                message: "A valid password is required",
            });

        if (
            !req.body.confirmPassword &&
            !passwordSchema.validate(req.body.confirmPassword)
        )
            return res.status(400).send({
                message: "A valid confirm password is required",
            });

        if (
            req.body.password &&
            req.body.confirmPassword &&
            req.body.password != req.body.confirmPassword
        )
            return res.status(400).send({
                message: "Password and Confirm password not matching",
            });

        User.findOne(
            {
                "resetPassword.token": req.body.token,
                // 'resetPassword.expires': {
                // 	$gt: Date.now()
                // }
            },
            function (err, user) {
                if (err)
                    return res.status(500).send({
                        message: err.name + ": " + err.message,
                    });

                if (!user)
                    return res.status(400).send({
                        message: "Not a valid Token.",
                    });

                user.password = req.body.password;
                user.resetPassword.token = undefined;
                user.resetPassword.expires = undefined;

                user.save(function (err) {
                    if (err)
                        return res.status(400).send({
                            message: err.name + ": " + err.message,
                        });

                    email
                        .passwordChanged(user.email.address)
                        .then((result) => {
                            return res.status(200).send({
                                message: "Password changed successful.",
                                data: result,
                            });
                        })
                        .catch((err) => {
                            return res.status(400).send({
                                message: err.name + ": " + err.message,
                            });
                        });
                });
            }
        );
    };

    const verifyLink = (req, res) => {
        if (!req.params.token)
            return res.status(400).send({
                message: "Verification token not provided.",
            });

        User.findOneAndUpdate(
            {
                "email.token": req.params.token,
            },
            {
                $set: {
                    "email.token": "",
                    "email.verified": true,
                },
            },
            function (err, user) {
                if (err)
                    return res.status(500).send({
                        message: err.name + ": " + err.message,
                    });

                if (!user)
                    return res.status(400).send({
                        message: "Not a valid Token.",
                    });

                email
                    .emailVerified(user.email.address)
                    .then((result) => {
                        return res.status(200).send({
                            message: "Email verified successful.",
                            data: result,
                        });
                    })
                    .catch((err) => {
                        return res.status(404).send({
                            message: err.name + ": " + err.message,
                        });
                    });
            }
        );
    };

    const verifyToken = (req, res) => {
        if (!req.body.token)
            return res.status(400).send({
                message: "Verification token not provided.",
            });

        User.findOneAndUpdate(
            {
                "email.token": req.body.token,
            },
            {
                $set: {
                    "email.token": "",
                    "email.verified": true,
                },
            },
            function (err, user) {
                if (err)
                    return res.status(500).send({
                        message: err.name + ": " + err.message,
                    });

                if (!user)
                    return res.status(400).send({
                        message: "Not a valid Token.",
                    });

                email
                    .emailVerified(user.email.address)
                    .then((result) => {
                        return res.status(200).send({
                            message: "Email verified successful.",
                            data: result,
                        });
                    })
                    .catch((err) => {
                        return res.status(404).send({
                            message: err.name + ": " + err.message,
                        });
                    });
            }
        );
    };

    const resendToken = (req, res) => {
        if (!req.body.email)
            return res.status(400).send({
                message: "Email address is required",
            });

        if (!validator.isEmail(req.body.email))
            return res.status(400).send({
                message: "Email address is not valid",
            });

        User.findOne({ "email.address": req.body.email }, function (err, user) {
            if (err)
                return res.status(500).send({
                    message: err.name + ": " + err.message,
                });

            if (!user)
                return res.status(400).send({
                    message: "User not found.",
                });

            const token = Math.floor(1000 + Math.random() * 9000);

            user.resetPassword.token = token;
            user.resetPassword.expires = new Date() + 3600000;

            user.save(function (err) {
                if (err)
                    return res.status(400).send({
                        message: err.name + ": " + err.message,
                    });

                email
                    .resetPassword(user.email.address, user.resetPassword.token)
                    .then((result) => {
                        return res.status(200).send({
                            message: "Email sent.",
                            data: result,
                        });
                    })
                    .catch((err) => {
                        return res.status(404).send({
                            message: err.name + ": " + err.message,
                        });
                    });
            });
        });
    };

    return {
        signup: signup,
        signin: signin,
        signout: signout,
        forgot: forgot,
        resetLink: resetLink,
        resetToken: resetToken,
        verifyLink: verifyLink,
        verifyToken: verifyToken,
        resendToken: resendToken,
    };
};

module.exports = authController;
