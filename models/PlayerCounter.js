import mongoose from "mongoose";

const PlayerCounterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const PlayerCounter =
  mongoose.models.PlayerCounter ||
  mongoose.model("PlayerCounter", PlayerCounterSchema);

export default PlayerCounter;