const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    createdAt: {
        type: Number,
        default: () => Date.now(),
    },
    updatedAt: {
        type: Number,
        default: () => Date.now(),
    },
    exercises: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'exercises',
    }],
});

const exerciseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "users",
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    date: {
        type: Number,
        default: () => Date.now(),
    },
});

userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = {
    "userModel" : mongoose.model('users', userSchema),
    "exerciseModel": mongoose.model('exercises', exerciseSchema),
};
