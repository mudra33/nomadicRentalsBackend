const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST ? process.env.REDIS_HOST : "127.0.0.1",
    port: process.env.REDIS_PORT ? process.env.REDIS_PORT : 6379,
    logErrors: true,
    enableOfflineQueue: false,
});
const { RateLimiterRedis } = require("rate-limiter-flexible");

const rateLimiterRedis = new RateLimiterRedis({
    storeClient: redisClient,
    points: 10,
    duration: 1,
});

const rateLimiter = (req, res, next) => {
    rateLimiterRedis
        .consume(req.ip)
        .then(() => {
            next();
        })
        .catch((_) => {
            res.status(429).send("Too Many Requests");
        });
};

module.exports = rateLimiter;
