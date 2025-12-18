const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'dashboard/public/' }); // Upload images

// === CONFIG ===
const TOKEN = process.env.DISCORD_TOKEN; // Add your token in Replit secrets
const BRAND_NAME = 'MyBrand';
const BRAND_COLOR = 0xff0000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// === DISCORD BOT ===
client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
});

// Moderation commands
client.on('messageCreate', async message => {
  if (!message.guild) return;
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

  const args = message.content.trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  try {
    if (command === '!ban') {
      const member = message.mentions.members.first();
      if (!member) return message.reply("Mention a user to ban.");
      await member.ban({ reason: args.join(' ') || 'No reason' });
      message.channel.send(`Banned ${member.user.tag}`);
    }

    if (command === '!kick') {
      const member = message.mentions.members.first();
      if (!member) return message.reply("Mention a user to kick.");
      await member.kick(args.join(' ') || 'No reason');
      message.channel.send(`Kicked ${member.user.tag}`);
    }

    if (command === '!mute') {
      const member = message.mentions.members.first();
      if (!member) return message.reply("Mention a user to mute.");
      let role = message.guild.roles.cache.find(r => r.name === 'Muted');
      if (!role) {
        role = await message.guild.roles.create({ name: 'Muted', permissions: [] });
        message.guild.channels.cache.forEach(ch => ch.permissionOverwrites.edit(role, { SendMessages: false, AddReactions: false }));
      }
      await member.roles.add(role);
      message.channel.send(`${member.user.tag} has been muted.`);
    }

    if (command === '!unmute') {
      const member = message.mentions.members.first();
      if (!member) return message.reply("Mention a user to unmute.");
      const role = message.guild.roles.cache.find(r => r.name === 'Muted');
      if (role) await member.roles.remove(role);
      message.channel.send(`${member.user.tag} has been unmuted.`);
    }

    if (command === '!purge') {
      const count = parseInt(args[0], 10);
      if (!count || count <= 0) return message.reply("Provide a valid number of messages to delete.");
      await message.channel.bulkDelete(count + 1);
      message.channel.send(`Deleted ${count} messages.`).then(m => setTimeout(() => m.delete(), 5000));
    }
  } catch (err) {
    console.log(err);
  }
});

// === EXPRESS DASHBOARD ===
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('dashboard/public'));

app.get('/', async (req, res) => {
  let channelsHTML = '';
  try {
    const guilds = client.guilds.cache.map(g => g);
    for (const guild of guilds) {
      await guild.channels.fetch();
      guild.channels.cache.filter(c => c.type === 0).forEach(channel => {
        channelsHTML += `<option value="${channel.id}">${guild.name} - #${channel.name}</option>`;
      });
    }
  } catch (err) { console.log(err); }

  res.send(`
    <h1>${BRAND_NAME} Dashboard</h1>
    <form action="/send" method="POST" enctype="multipart/form-data">
      <label>Select Channel:</label><br>
      <select name="channelId" required>${channelsHTML}</select><br><br>

      <label>Message:</label><br>
      <textarea name="message" rows="4" cols="50" required></textarea><br><br>

      <label>Send as Embed?</label>
      <input type="checkbox" name="embed" /><br><br>

      <label>Embed Color (hex):</label>
      <input type="text" name="color" placeholder="ff0000"><br><br>

      <label>Upload Image:</label>
      <input type="file" name="image"><br><br>

      <label>Emoji:</label>
      <input type="text" name="emoji" placeholder="😀"><br><br>

      <button type="submit">Send</button>
    </form>
  `);
});

// Handle dashboard POST
app.post('/send', upload.single('image'), async (req, res) => {
  const { channelId, message, embed, color, emoji } = req.body;
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return res.send("Channel not found.");

    let content = message;
    if (emoji) content = `${emoji} ${content}`;

    if (embed) {
      const embedMsg = new EmbedBuilder()
        .setTitle(BRAND_NAME)
        .setDescription(content)
        .setColor(color ? parseInt(color, 16) : BRAND_COLOR);
      if (req.file) {
        embedMsg.setImage(`attachment://${req.file.originalname}`);
        await channel.send({ embeds: [embedMsg], files: [req.file.path] });
      } else {
        await channel.send({ embeds: [embedMsg] });
      }
    } else {
      if (req.file) {
        await channel.send({ content, files: [req.file.path] });
      } else {
        await channel.send(content);
      }
    }

    res.send("Message sent successfully! <a href='/'>Back</a>");
  } catch (err) {
    console.log(err);
    res.send("Failed to send message. Check console.");
  }
});

// Keep bot alive
app.listen(process.env.PORT || 3000, () => console.log('Dashboard running'));
