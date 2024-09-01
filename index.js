const express = require("express");
const app = express();
const keep_alive = require('./keep_alive.js');
require('dotenv').config();

app.listen(3000, () => {
  console.log("Project is running");
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

// const { Client, GatewayIntentBits } = require("discord.js");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//if user sends yay then receive yoo!
client.on("messageCreate", (msg) => {
  if (msg.content === "yay") msg.channel.send("yoo!");
});

// List of words or phrases that might indicate a "cringey" message
const cringeWords = [
  "uwu",
  "owo",
  "rawr",
  "xD",
  "yolo",
  "swag",
  "bae",
  "on fleek",
  "lit fam",
  "yeet",
  "poggers",
  "cringe",
  "sus",
  "no cap",
  "sheesh",
  "baby",
  "princess",
  "rishita",
];

// Object to store cringe alert counts for each user
const userCringeAlerts = {};

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return; // Ignore messages from bots

  // Convert message to lowercase for case-insensitive matching
  const lowerCaseContent = msg.content.toLowerCase();

  // Check if the message contains any of the cringe words
  const isCringe = cringeWords.some((word) => lowerCaseContent.includes(word));

  if (isCringe) {
    // Increment cringe alert count for the user
    const userId = msg.author.id;
    userCringeAlerts[userId] = (userCringeAlerts[userId] || 0) + 1;

    msg.reply("Cringe alert!!");

    // Check if user has exceeded 5 cringe alerts
    if (userCringeAlerts[userId] > 5) {
      msg.channel.send(`${msg.author.username} is being too cringe`);
      // Reset the count after sending the message
      userCringeAlerts[userId] = 0;
    }
  }
});

// Map moods to genres or tags
const moodToGenre = {
  happy: "Comedy",
  sad: "Drama",
  excited: "Action",
  relaxed: "Slice of Life",
  angry: "Psychological",
  romantic: "Romance",
};

// Slash command setup
const commands = [
  new SlashCommandBuilder()
    .setName("animerec")
    .setDescription("Get an anime recommendation based on your mood")
    .addStringOption((option) =>
      option
        .setName("mood")
        .setDescription("Your current mood")
        .setRequired(true)
        .addChoices(
          { name: "Happy", value: "happy" },
          { name: "Sad", value: "sad" },
          { name: "Excited", value: "excited" },
          { name: "Relaxed", value: "relaxed" },
          { name: "Angry", value: "angry" },
          { name: "Romantic", value: "romantic" },
        ),
    ),
];

const rest = new REST({ version: "10" }).setToken(process.env.token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

async function getAnimeRecommendation(genre) {
  try {
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime?genre=${genre}&order_by=score&sort=desc&limit=25`,
    );
    const animes = response.data.data;
    if (animes.length > 0) {
      const randomAnime = animes[Math.floor(Math.random() * animes.length)];
      return `Based on your mood, I recommend ${genre} Anime: ${randomAnime.title} (${randomAnime.year})\nSynopsis: ${randomAnime.synopsis}\nMAL Score: ${randomAnime.score}`;
    } else {
      return "Sorry, I couldn't find any recommendations for that mood right now.";
    }
  } catch (error) {
    console.error("Error fetching anime:", error);
    return "Sorry, there was an error fetching anime recommendations. Please try again later.";
  }
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "animerec") {
    const mood = interaction.options.getString("mood");
    const genre = moodToGenre[mood];
    await interaction.deferReply(); // For longer processing time
    const recommendation = await getAnimeRecommendation(genre);
    await interaction.editReply(recommendation);
  }
});

//to run the bot after 28 days
const cron = require("node-cron");

// Add this function to send the message
function sendLongTimeMessage() {
  const channel = client.channels.cache.get("849964444339142669"); // Replace with your channel ID
  if (channel) {
    channel.send("It's been so long! I hope everyone's doing well!");
  }
}

// Schedule the task to run every 10 days
cron.schedule("0 0 */10 * *", () => {
  sendLongTimeMessage();
});


client.once("ready", () => {
  console.log("Bot is ready!");
  // You can call sendLongTimeMessage here if you want it to send a message when the bot starts up
  // sendLongTimeMessage();
});

client.login(process.env.token);
