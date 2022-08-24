const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

let UserSchema = new mongoose.Schema({
    email: {
        address: {
            type: String,
            unique: true,
            required: true,
        },
        verified: Boolean,
        token: String,
    },
    role: {
        type: String,
        required: true,
    },
    phone: {
        countryCode: String,
        number: {
            type: Number,
            unique: true,
            minlength: 10,
            maxlength: 10,
        },
        verified: Boolean,
        token: String,
    },
    password: {
        type: String,
        select: false,
    },
    resetPassword: {
        token: String,
        expires: Date,
    },
    name: {
        first: String,
        last: String,
    },
    gender: String,
    provider: String,
    facebook: {
        type: {
            id: String,
            token: String,
        },
        select: false,
    },
    twitter: {
        type: Object,
        select: false,
    },
    google: {
        type: Object,
        select: false,
    },
    created_at: {
        type: Date,
        default: Date.now,
        select: false,
    },
    updated_at: {
        type: Date,
        default: Date.now,
        select: false,
    },
});

UserSchema.pre("save", function (next) {
    if (!this.isModified("password")) return next();

    bcrypt.hash(this.password, 16.5, (err, hash) => {
        if (err) return next(err);

        this.password = hash;
        next();
    });
});

UserSchema.methods.passwordIsValid = async function (password, callback) {
    bcrypt.compare(password, this.password, function (err, results) {
        if (err) return callback(err);

        callback(null, results);
    });
};

UserSchema.pre("save", function (next) {
    var currentDate = new Date();
    this.updated_at = currentDate;

    if (!this.created_at) this.created_at = currentDate;

    next();
});

module.exports = mongoose.model("User", UserSchema);
