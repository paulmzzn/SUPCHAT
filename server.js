import express from 'express';
import { connect } from './config/dbConnection.js';
import http from 'http';


const app = express();
const server = http.createServer(app);

// Applique le middleware d'auth pour toutes les routes API
// app.use('/api' , loginRoutes);
// app.use('/api/columns', columnsRoutes);
// app.use('/api/cards', cardsRoutes);

// Connexion à la base de données
connect();

// Lancement du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});