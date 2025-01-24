const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    login: {
        type: String,
        required: [true, "Debes introducir nombre de usuario"],
        minlength: [4, "Longitud mínima: 4 caracteres"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Debes introducir contraseña"],
        minlength: [7, "Longitud mínima: 7 caracteres"]
    },
    rol: {
        type: String,
        required: true,
        enum: ['admin', 'physio', 'patient']
    }
});

let User = mongoose.model('users', userSchema);
module.exports = User;