const hpp = require("hpp");
const cors = require("cors");
const http = require("http");
const morgan = require("morgan");
const helmet = require("helmet");
const express = require("express");
const cluster = require("cluster");
const bodyParser = require("body-parser");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const path = require("path");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");

const dotenv = require("dotenv");
dotenv.config();

// const database = require("./src/config/database");
// const verifyToken = require("./src/config/verifyToken");

// const rateLimiter = require("./src/config/rate-limiter");

const app = express();
const port = process.env.APP_PORT || 3000;
const numCPUs = require("os").cpus().length;

app.use(express.urlencoded({ extended: false }));

app.set("view-engine", "ejs");
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(compression());
// app.use(rateLimiter);
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(
    bodyParser.json({
        type: "application/json",
    })
);
app.use(hpp());
app.use(methodOverride());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.disable("x-powered-by");

require("./src/config/passport")(app);

const User = require("./src/models/user");

authRouter = require("./src/routes/auth")(User);

app.use("/auth", authRouter);

app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!");
});

app.get("/", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

let workers = [];

/**
 * Setup number of worker processes to share port which will be defined while setting up server
 */
const setupWorkerProcesses = () => {
    let numCores = require("os").cpus().length;
    console.log("------------------------------------------");
    console.log(`| Nomadic Rentals API ${port}               |`);
    console.log(`| Master cluster setting up ${numCores} workers    |`);
    console.log("------------------------------------------");

    for (let i = 0; i < numCores; i++) {
        workers.push(cluster.fork());

        workers[i].on("message", function (message) {
            console.log(message);
        });
    }

    cluster.on("online", function (worker) {
        console.log("Worker " + worker.process.pid + " is listening");
    });

    cluster.on("exit", function (worker, code, signal) {
        console.log(
            "Worker " +
                worker.process.pid +
                " died with code: " +
                code +
                ", and signal: " +
                signal
        );
        console.log("Starting a new worker");
        cluster.fork();
        workers.push(cluster.fork());

        workers[workers.length - 1].on("message", function (message) {
            console.log(message);
        });
    });
};

/**
 * Setup an express server and define port to listen all incoming requests for this application
 */
const setUpExpress = () => {
    app.server = http.createServer(app);

    app.server.listen(port, () => {
        console.log(`Started server for Process Id ${process.pid}`);
    });

    app.on("error", (appErr, appCtx) => {
        console.error("app error", appErr.stack);
        console.error("on url", appCtx.req.url);
        console.error("with headers", appCtx.req.headers);
    });
};

/**
 * Setup server either with clustering or without it
 * @param isClusterRequired
 * @constructor
 */
const setupServer = (isClusterRequired) => {
    if (isClusterRequired && cluster.isMaster) {
        setupWorkerProcesses();
    } else {
        setUpExpress();
    }
};

setupServer(true);
