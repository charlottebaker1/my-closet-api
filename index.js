require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const Joi = require("joi");
const mongoose = require("mongoose");
const multer = require("multer");
const ClothesItem = require("./models/ClothesItem");

const app = express();
const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.MONGODB_URI, { dbName: "mycloset" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "public/images")));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, Date.now() + "_" + safe);
  },
});
const upload = multer({ storage });

const TYPE_VALUES   = ["Top","Pants","Shorts","Sweatshirt","Sweater","Shoes","Dress","Skirt","Jacket","Accessory"];
const SEASON_VALUES = ["Spring","Summer","Fall","Winter"];

const createSchema = Joi.object({
  title:  Joi.string().min(2).max(80).required(),
  type:   Joi.string().valid(...TYPE_VALUES).required(),
  color:  Joi.string().min(3).max(20).required(),
  season: Joi.string().valid(...SEASON_VALUES).required(),
  img:     Joi.string().pattern(/^\/(images|uploads)\/[\w.\-]+\.(png|jpe?g|webp|gif)$/i),
  imgName: Joi.string().pattern(/^[\w.\-]+\.(png|jpe?g|webp|gif)$/i),
}).xor("img","imgName");

const updateSchema = Joi.object({
  title:  Joi.string().min(2).max(80),
  type:   Joi.string().valid(...TYPE_VALUES),
  color:  Joi.string().min(3).max(20),
  season: Joi.string().valid(...SEASON_VALUES),
  img:     Joi.string().pattern(/^\/(images|uploads)\/[\w.\-]+\.(png|jpe?g|webp|gif)$/i),
  imgName: Joi.string().pattern(/^[\w.\-]+\.(png|jpe?g|webp|gif)$/i),
});

app.post("/api/upload-image", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success:false, message:"No file" });
  res.json({ success: true, img: `/uploads/${req.file.filename}` });
});

app.get("/api/clothes", async (_req, res) => {
  const items = await ClothesItem.find().sort({ createdAt: -1 }).lean();
  res.json(items.map(i => ({ ...i, _id: String(i._id) })));
});

app.get("/api/clothes/:id", async (req, res) => {
  try {
    const item = await ClothesItem.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ ...item, _id: String(item._id) });
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.post("/api/clothes", async (req, res) => {
  const { error, value } = createSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success:false,
      message:"Validation failed",
      details: error.details.map(d => d.message)
    });
  }
  const img = value.img || `/images/${value.imgName}`;
  const doc = await ClothesItem.create({
    title: value.title,
    type: value.type,
    color: value.color,
    season: value.season,
    img,
  });
  res.status(201).json({ success:true, item: { ...doc.toObject(), _id: String(doc._id) } });
});

app.put("/api/clothes/:id", async (req, res) => {
  const { error, value } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success:false,
      message:"Validation failed",
      details: error.details.map(d => d.message)
    });
  }
  const update = { ...value };
  if (value.imgName) {
    update.img = `/images/${value.imgName}`;
    delete update.imgName;
  }
  try {
    const doc = await ClothesItem.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ success:false, message:"Not found" });
    res.json({ success:true, item: { ...doc.toObject(), _id: String(doc._id) } });
  } catch {
    res.status(400).json({ success:false, message:"Invalid id" });
  }
});

app.delete("/api/clothes/:id", async (req, res) => {
  try {
    const doc = await ClothesItem.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success:false, message:"Not found" });
    res.json({ success:true });
  } catch {
    res.status(400).json({ success:false, message:"Invalid id" });
  }
});

app.use("/", express.static(path.join(__dirname, "public")));

app.listen(PORT, () => console.log(`API listening on ${PORT}`));
