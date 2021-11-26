const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');



mongoose.connect('mongodb+srv://JuliusMinus:Chercheur.93@cluster0.mszxr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

  const app = express();

  app.use(express.json());

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

  app.post('/api/auth', (req, res, next) => {
    console.log(req.body);
    res.status(201).json({
      message: 'Utilisateur créé !'
    });
  });

  app.get('/api/auth', (req, res, next) => {
    const auth = [
      {
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
      },
    ];
    res.status(200).json(sauces);
  });


app.use('/api/auth', userRoutes);

module.exports = app;