import { Schema, model } from "mongoose";
import { isEmail } from "validator";

let bookingSchema = new Schema({
    pick: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: (value) => {
            return isEmail(value);
        },
    },
    drop: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: (value) => {
            return isEmail(value);
        },
    },
    date: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: (value) => {
            return isEmail(value);
        },
    },
    time: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: (value) => {
            return isEmail(value);
        },
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

export default model("Booking", bookingSchema);
