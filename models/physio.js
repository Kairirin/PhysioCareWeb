const mongoose = require('mongoose');

let physioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Physio\'s name is mandatory'],
        minlength: [2, 'Physio\'s name is too short'],
        maxlength: [50, 'Physio\'s name is too long'],
    },
    surname: {
        type: String,
        required: [true, 'Physio\'s surname is mandatory'],
        minlength: [2, 'Physio\'s surname is too short'],
        maxlength: [50, 'Physio\'s surname is too long'],
    },
    specialty: {
        type: String,
        required: [true, 'Physio\'s specialty is mandatory'],
        enum: ['Sports', 'Neurological', 'Pediatric', 'Geriatric', 'Oncological']
    },
    licenseNumber: {
        type: String,
        required: [true, 'Physio\'s license number is mandatory'],
        match: [/^[a-zA-Z0-9]{8}$/, 'Physio\'s license number may only contain eight letters and/or numbers'],
        unique: true
    },
    image: {
        type: String
    }
});

let Physio = mongoose.model('physios', physioSchema);
module.exports = Physio;