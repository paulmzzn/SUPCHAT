import mongoose from 'mongoose';

const SpaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Liste des membres
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  });
  
export default mongoose.model('Space', space);