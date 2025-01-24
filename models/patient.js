const mongoose = require('mongoose');

let patientSchema = new mongoose.Schema({
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
    birthDate: {
        type: Date,
        required: [true, 'La fecha de nacimiento es obligatoria'],
    },
    address: {
        type: String,
        maxlength: [100, 'Longitud máxima: 100 caracteres']
    },
    insuranceNumber: {
        type: String,
        required: [true, 'El número de seguro es obligatorio'],
        match: [/^[a-zA-Z0-9]{9}$/, 'Debe contener solo 9 letras y/o números'],
        unique: true
    },
    image: {
        type: String
    }
});

let Patient = mongoose.model('patients', patientSchema);
module.exports = Patient;