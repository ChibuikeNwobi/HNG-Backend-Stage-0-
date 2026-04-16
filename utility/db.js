require('dotenv').config();
const mongoose = require('mongoose');

const databaseConnection = () => {
    // console.log(process.env.MONGODB_URI);
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB!'))
        .catch((error) => console.error('Error connecting to MongoDB:', error));

};

module.exports = databaseConnection;