const mongoose = require('mongoose');

let physioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        minlength: [2, 'Longitud mínima: 2 caracteres'],
        maxlength: [50, 'Longitud máxima: 50 caracteres']
    },
    surname: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        minlength: [2, 'Longitud mínima: 2 caracteres'],
        maxlength: [50, 'Longitud máxima: 50 caracteres']
    },
    specialty: {
        type: String,
        required: [true, 'Debes indicar especialidad'],
        enum: ['Sports', 'Neurological', 'Pediatric', 'Geriatric', 'Oncological']
    },
    licenseNumber: {
        type: String,
        required: [true, 'El número de licencia es obligatorio'],
        match: [/^[a-zA-Z0-9]{8}$/, 'Solo debe incluir 8 letras y/o números'],
        unique: true
    },
    image: {
        type: String
    }
});

let Physio = mongoose.model('physios', physioSchema);
module.exports = Physio;