// Import libraries
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

// === CONFIG ===
const TOKEN = process.env.DISCORD_TOKEN; // Environment variable in Railway
const BRAND_NAME = 'MyBrand';            // Change to your brand
const BRAND_COLOR = 0xff0000;            // Change embed color
const BRAND_LOGO = 'https://i.imgur.com/yourlogo.png'; // Replace with your logo URL

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot ready
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

// Listen to messages
client.on('messageCreate', message => {
    if (message.author.bot) return;

    // Command: !say <message>
    if (message.content.startsWith('!say')) {
        const msg = message.content.slice(4).trim();
        if (msg.length > 0) {
            message.channel.send(msg);
        } else {
            message.channel.send("Please provide a message to send!");
        }
    }

    // Command: !brand <message>
    if (message.content.startsWith('!brand')) {
        const embedMsg = message.content.slice(6).trim();
        const embed = new EmbedBuilder()
            .setTitle(BRAND_NAME)
            .setDescription(embedMsg || "This is your brand bot!")
            .setColor(BRAND_COLOR)
            .setThumbnail(BRAND_LOGO);

        message.channel.send({ embeds: [embed] });
    }
});

// Login to Discord
client.login(TOKEN);

// === EXPRESS SERVER TO KEEP BOT RUNNING ===
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
