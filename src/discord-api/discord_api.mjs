'use strict';

const isDebug = process.env.NODE_ENV != "production";
let debug = (x) => {
    if (isDebug) {
        console.log('\x1b[36m%s\x1b[0m%s', '[Discord] ', `[DEBUG] ${x}`);
    }
}

import db from "./db.mjs";

const version = process.env.npm_package_version;
const port = parseInt(process.env.PORT_DISCORD_API) || 8080;
const sessionSecret = process.env.SESSION_SECRET || "LEKO_SO_CUTE_AYY";

const dbPath = process.env.DATABASE || "db.json";

const discordApiBaseUrl = process.env.DISCORD_API_BASE_URL || "https://discord.com/api";
const discordApiClientId = process.env.DISCORD_API_CLIENT_ID;
const discordRedirectUri = process.env.SERVER_URL_DISCORD_API + "/register";

const routerPath = process.env.DISCORD_API_PATH || "/";

db.load(dbPath);

import axios from "axios";
import express from 'express';
import helmet from "helmet";
import compression from "compression";
const app = express();
const router = express.Router();

app.use(helmet());
app.use(compression());

import { Client, Intents } from 'discord.js';
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.login(process.env.DISCORD_BOT_TOKEN);

import session from 'express-session';
import FileStore from 'session-file-store';
const fileStore = FileStore(session);
fileStore(session);

let sessionConfig = {
    store: new fileStore(),
    secret: sessionSecret,
    resave: true,
    saveUninitialized: false,
    cookie: { httpOnly: true }
};

if (!isDebug) {
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

router.get('/', (req, res) => {
    res.redirect(`${discordApiBaseUrl}/oauth2/authorize?client_id=${discordApiClientId}&redirect_uri=${discordRedirectUri}&response_type=code&scope=identify`);
});

router.get("/register", (req, res) => {
    const discordCode = req.query.code;
    if (!discordCode) {
        return res.status(400).json({ error: "400 Bad Request" });
    }
    req.session.discordCode = discordCode;
    debug(`/register discordCode: ${discordCode}`);

    res.redirect(process.env.SERVER_URL_NYCU_API);
});

router.get("/verify", async (req, res) => {
    try {
        const discordCode = req.session.discordCode;
        const nycuCode = req.session.nycuCode;

        debug(`/verify discordCode: ${discordCode}`);
        debug(`/verify nycuCode: ${nycuCode}`);
        if (!discordCode || !nycuCode) {
            return res.status(400).json({ error: "400 Bad Request" });
        }
        // Check Nycu first
        const resp = await axios.get('https://id.nycu.edu.tw/api/profile/', {
            headers: {
                Authorization: `Bearer ${nycuCode}`
            }
        });
        const nycuUsername = resp.data.username;
        debug(`/verify nycuUsername: ${nycuUsername}`);

        // Check Discord, get user id

        let response = await axios.post(`${discordApiBaseUrl}/oauth2/token`, new URLSearchParams({
            client_id: discordApiClientId,
            client_secret: process.env.DISCORD_API_CLIENT_SECRET,
            grant_type: "authorization_code",
            code: discordCode,
            redirect_uri: discordRedirectUri
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const discordToken = response.data.access_token;
        debug(`/verify discordToken: ${discordToken}`);

        response = await axios.get(`${discordApiBaseUrl}/users/@me`, {
            headers: {
                'Authorization': 'Bearer ' + discordToken
            }
        });

        const discordUserId = response.data.id;

        debug(`/verify discordUserId: ${discordUserId}`);

        // Check database for duplicated user

        if (!db.isValid(nycuUsername, discordUserId)) {
            return res.status(403).json({ error: "403 Forbidden" });
        }

        // Bot add user

        const guild = await client.guilds.fetch(process.env.DISCORD_GROUP_ID);
        debug(`/verify guild: ${guild}`);
        const member = await guild.members.fetch(discordUserId);
        debug(`/verify member: ${member}`);
        await member.roles.add(process.env.DISCORD_ROLE_ID);

        debug(`/verify addRole: true`);

        // Write to db and save

        await db.add(nycuUsername, discordUserId);
        await db.save(dbPath);

        res.status(200).json({ message: "SUCCESS: Discord Account Verified! You may close this page now." });
    } catch (e) {
        console.error('\x1b[36m%s\x1b[0m%s', '[Discord] ', e);
        return res.status(500).json({ error: "500 Internal Server Error" });
    }
});

router.get('/OAuth', async (req, res) => {
    try {
        const code = req.query.token;
        if (!code) {
            return res.status(400).json({ error: "400 Bad Request" });
        }

        req.session.nycuCode = code;
        debug(`/OAuth nycuCode: ${code}`);

        res.redirect(process.env.SERVER_URL_DISCORD_API + "/verify");
    } catch (e) {
        console.error('\x1b[36m%s\x1b[0m%s', '[OAuth] ', e);
        return res.status(500).json({ error: "500 Internal Server Error" });
    }
});

app.use(routerPath, router);

app.listen(port, () => {
    console.log('\x1b[36m%s\x1b[0m%s', '[Discord] ', `NYCU Discord Verify (${version}) by edisonlee55 & Cute Leko`);
    console.log('\x1b[36m%s\x1b[0m%s', '[Discord] ', `Listening on port ${port}`);
});
