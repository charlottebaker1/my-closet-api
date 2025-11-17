const express = require("express");
const cors = require("cors");
const path = require("path");
const Joi = require("joi");
const clothes = require("./data/clothes"); 

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/", express.static(path.join(__dirname, "public")));

app.get("/api/clothes", (req, res) => {
  res.json(clothes);
});

app.get("/api/clothes/:id", (req, res) => {
  const item = clothes.find((i) => i._id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

const itemSchema = Joi.object({
  title: Joi.string().min(2).max(80).required(),
  type: Joi.string()
    .valid("Top", "Pants", "Shorts", "Sweater", "Sweatshirt", "Shoes", "Dress", "Skirt", "Jacket", "Accessory")
    .required(),
  color: Joi.string().min(3).max(20).required(),
  season: Joi.string().valid("Spring", "Summer", "Fall", "Winter").required(),
  imgName: Joi.string().pattern(/^[\w\-.]+\.(png|jpe?g|webp|gif)$/i).required()
});

app.post("/api/clothes", (req, res) => {
  const { error, value } = itemSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: error.details.map((d) => d.message)
    });
  }

  const newItem = {
    _id: String(Date.now()),
    title: value.title,
    type: value.type,
    color: value.color,
    season: value.season,
    img: `/images/${value.imgName}` 
  };

  clothes.unshift(newItem);

  return res.status(201).json({ success: true, item: newItem });
});

app.listen(PORT, () => console.log(`API listening on ${PORT}`));
