const axios = require("axios").default

const express = require('express')
const app = express()
const port = 8000

const session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}))

app.get("/register", (req, res) => {
    const discordCode = req.query.code;

    req.session.discordCode = discordCode;
    res.redirect("https://nycu-discord-verify.nycu.moe")
})

app.get("verify", (req, res) => {
    const discordCode = req.session.discordCode;
    const nycuCode = req.session.nycuCode;

    // Check Nycu first
    const resp = await axios.get('https://id.nycu.edu.tw/api/profile/', {
        headers: {
            Authorization: `Bearer ${nycuCode}`
        }
    });
    const nycuUsername = resp.data.username;

    // Check Discord, get user id

    // Bot add user
})

app.get('/OAuth', async(req, res) => {
    try {
        const code = req.query.token;

        req.session.nycuCode = code;

        res.redirect("/verify")
    } catch (e) {
        return res.sendStatus(500);
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })