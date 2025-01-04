const mongoose = require('mongoose');

let patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Patient\'s name is mandatory'],
        minlength: [2, 'Patient\'s name is too short'],
        maxlength: 50
    },
    surname: {
        type: String,
        required: [true, 'Patient\'s surname is mandatory'],
        minlength: [2, 'Patient\'s surname is too short'],
        maxlength: 50
    },
    birthDate: {
        type: Date,
        required: [true, 'Patient\'s birthdate is mandatory'],
    },
    address: {
        type: String,
        maxlength: [100, 'Patient\'s address is too long']
    },
    insuranceNumber: {
        type: String,
        required: [true, 'Patient\'s insurance number is mandatory'],
        match: [/^[a-zA-Z0-9]{9}$/, 'Patient\'s insurance number may only contain nine letters and/or numbers'],
        unique: [true, 'Patient\'s insurance number must be unique']
    },
    image: {
        type: String
    }
});

let Patient = mongoose.model('patients', patientSchema);
module.exports = Patient;