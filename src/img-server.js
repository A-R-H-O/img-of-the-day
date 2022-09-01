import express from "express";
import { createClient } from "redis";
import axios from "axios";
import GoogleImages from "google-images";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

require("dotenv").config();

const app = express();
app.set("view engine", "pug");

async function genCSETerm() {
  const wordAPILink = "http://random-word-api.herokuapp.com/word";
  const term = await axios.get(wordAPILink);
  return term;
}

// Create and connect to Redis Cloud Server
const dailyDB = createClient({
  socket: {
    host: process.env.REDIS_HOSTNAME,
    port: process.env.REDIS_PORT,
  },
  password: process.env.REDIS_PASSWORD,
});

dailyDB.on("error", (err) => console.error(err));
await dailyDB.connect();

// Connect to Google CSE and CSE API to enable image search
const client = new GoogleImages(
  process.env.CSE_ENGINE_ID,
  process.env.CUSTOM_SEARCH_API_KEY
);

let isChangable = true;
let curTime;

// Check for a change in date. If present, update the image displayed on the website.
setInterval(async () => {
  curTime = new Date()
    .toLocaleString("en-US", {
      hour: "numeric",
      hour12: true,
    })
    .split(" ");

  if (curTime[0] === "6" && curTime[1] === "PM" && isChangable) {
    curTime = false;
    const newImage = await client.search(`${genCSETerm()}`, {page: 20});

    console.log(newImage)
  }

  if (curTime[0] !== "6") curTime = true;
}, 100);

const port = 3001;

app.get("/", (req, res) => {
  res.render("home/home");
});

app.listen(port);
console.log(`Server running on port ${port}`);
