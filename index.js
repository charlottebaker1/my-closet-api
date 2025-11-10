const express = require("express");
const cors = require("cors");
const path = require("path");
const clothes = require("./data/clothes");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());                 
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/", express.static(path.join(__dirname, "public"))); // docs page

app.get("/api/clothes", (req, res) => {
  const { type, color, season } = req.query;
  let data = clothes;
  if (type)   data = data.filter(i => i.type.toLowerCase()   === type.toLowerCase());
  if (color)  data = data.filter(i => i.color.toLowerCase()  === color.toLowerCase());
  if (season) data = data.filter(i => i.season.toLowerCase() === season.toLowerCase());
  res.json(data);
});

app.get("/api/clothes/:id", (req, res) => {
  const item = clothes.find(i => i._id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

app.listen(PORT, () => console.log(`API listening on :${PORT}`));
