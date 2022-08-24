const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const verifyToken = (req, res, next) => {
    const token = req.headers["x-access-token"];

    if (!token)
        return res.status(401).send({
            auth: false,
            message: "No token provided.",
        });

    jwt.verify(token, process.env.secret, function (err, decoded) {
        if (err)
            return res.status(500).send({
                auth: false,
                message: "Failed to authenticate token.",
            });

        req.userId = decoded.id;
        next();
    });
};

module.exports = verifyToken;
