// Code to connect to MongoDB
import mongoose from 'mongoose';

const connect = async () => {
  try {
    await mongoose.connect('mongodb+srv://REDACTED@cluster0.k0qt4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = { connect };