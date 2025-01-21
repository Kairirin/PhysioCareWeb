const mongoose = require('mongoose');

let appointmentSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'The date is mandatory']
    },
    physio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'physios',
        required: [true, 'The physio is mandatory']
    },
    diagnosis: {
        type: String,
        required: [true, 'The diagnosis is mandatory'],
        minlength: [10, 'The min length is 10'],
        maxlength: [500, 'The max length is 500']
    },
    treatment: {
        type: String,
        required: [true, 'The treatment is mandatory']
    },
    observations: {
        type: String,
        maxlength: [500, 'The max length is 500']
    }
});

let recordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'patients',
        required: true,
        unique: true
    },
    medicalRecord: {
        type: String,
        maxlength: [1000, 'The max length is 1000']
    },
    appointments: [appointmentSchema]
});

let Record = mongoose.model('records', recordSchema);
let Appointment = mongoose.model('appointments', appointmentSchema);
module.exports = { Record, Appointment };
