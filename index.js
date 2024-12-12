const express = require('express');
const mongoose = require('mongoose');

const patients = require(__dirname + '/routes/patients');
const physios = require(__dirname + '/routes/physios');
const records = require(__dirname + '/routes/records');
const auth = require(__dirname + '/routes/auth');

let app = express();

mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Successful connection to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

app.use(express.json());
app.use('/public', express.static(__dirname + '/public'));
app.use('/patients', patients);
app.use('/physios', physios);
app.use('/records', records);
app.use('/auth', auth);

app.get('/', (req, res) => {
  res.redirect('/public/index.html'); //Acceso a la página príncipal de índice
  });

app.listen(process.env.PUERTO);