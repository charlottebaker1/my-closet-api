const mongoose = require("mongoose");

const ClothesItemSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true, minlength: 2, maxlength: 80 },
    type:   { type: String, required: true },
    color:  { type: String, required: true, minlength: 3, maxlength: 20 },
    season: { type: String, required: true },
    img:    { type: String, required: true }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClothesItem", ClothesItemSchema);
