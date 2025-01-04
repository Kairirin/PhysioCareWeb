const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    login: {
        type: String,
        required: [true, "Username is mandatory"],
        minlenght: [4, "Username is too short"],
        unique: [true, "Username must be unique"],
    },
    password: {
        type: String,
        required: [true, "Password is mandatory"],
        minlenght: [7, "Password is too short"]
    },
    rol: {
        type: String,
        required: true,
        enum: ['admin', 'physio', 'patient']
    }
});

let User = mongoose.model('users', userSchema);
module.exports = User;