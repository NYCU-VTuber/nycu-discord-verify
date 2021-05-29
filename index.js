require('dotenv').config();
const isDebug = process.env.DEBUG == "1";
function debug(x) {
    if (isDebug) {
        console.log(`[DEBUG] ${x}`)
    }
}

const db = require("./db.js")
db.load(process.env.DATABASE);

const axios = require("axios").default

const express = require('express')
const app = express()
const port = parseInt(process.env.PORT);

const Discord = require('discord.js');
const client = new Discord.Client();
client.login(process.env.TOKEN)

const session = require('express-session');
const FileStore = require('session-file-store')(session);
app.use(session({
    store: new FileStore({
        secret: process.env.SECRET,
        fileExtension: ".session"
    }),
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: { secure: !isDebug }
}))

app.get("/register", (req, res) => {
    const discordCode = req.query.code;

    req.session.discordCode = discordCode;
    debug(`/register discordCode: ${discordCode}`)

    res.redirect("https://nycu-discord-verify.nycu.moe")
})

app.get("/verify", async (req, res) => {
    try {
        const discordCode = req.session.discordCode;
        const nycuCode = req.session.nycuCode;

        debug(`/verify discordCode: ${discordCode}`)
        debug(`/verify nycuCode: ${nycuCode}`)

        // Check Nycu first
        const resp = await axios.get('https://id.nycu.edu.tw/api/profile/', {
            headers: {
                Authorization: `Bearer ${nycuCode}`
            }
        });
        const nycuUsername = resp.data.username;

        debug(`/verify nycuUsername: ${nycuUsername}`)

        // Check Discord, get user id

        let response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id:     process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type:    "authorization_code",
            code:          discordCode,
            redirect_uri:  process.env.REDIRECT_URI
        }),  {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        const discordToken = response.data.access_token;

        debug(`/verify discordToken: ${discordToken}`)

        response = await axios.get("https://discordapp.com/api/users/@me", {
            headers: {
                'Authorization': 'Bearer ' + discordToken
            }
        })
        const discordUserId = response.data.id;

        debug(`/verify discordUserId: ${discordUserId}`)

        // Check database for duplicated user

        if (!db.isValidNYCUId(nycuUsername)) {
            return res.sendStatus(403);
        }

        // Bot add user

        const guild = await client.guilds.fetch(process.env.GROUP_ID);
        debug(`/verify guild: ${guild}`)
        const User = await client.users.fetch(discordUserId);
        debug(`/verify User: ${User}`)
        const member = await guild.members.fetch(User);
        debug(`/verify member: ${member}`)
        const role = guild.roles.cache.find(r => r.name === process.env.ROLE);
        debug(`/verify role: ${role}`)
        member.roles.add(role);

        debug(`/verify addRole: true`)

        // Write to db and save

        db.add(nycuUsername, discordUserId);
        db.save(process.env.DATABASE);

        res.status(200).send("SUCCESS!")
    } catch (e) {
        console.error(e)
        return res.sendStatus(500);
    }
    
})

app.get('/OAuth', async(req, res) => {
    try {
        const code = req.query.token;

        req.session.nycuCode = code;
        debug(`/OAuth nycuCode: ${code}`)

        res.redirect("/verify")
    } catch (e) {
        return res.sendStatus(500);
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })