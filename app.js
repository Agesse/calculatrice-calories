const express = require("express");
var path = require("path");
const app = express();
const port = 8080;

app.get("/alim_2020_07_07", function (req, res) {
  res.contentType("application/xml");
  res.sendFile(path.join(__dirname, "public/db", "alim_2020_07_07.xml"));
});

app.get("/compo_2020_07_07", function (req, res) {
  res.contentType("application/xml");
  res.sendFile(path.join(__dirname, "public/db", "compo_2020_07_07.xml"));
});

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
