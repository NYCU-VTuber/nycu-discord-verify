'use strict';
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { AuthorizationCode } from 'simple-oauth2';

const app = express();
const router = express.Router();
app.use(helmet());
app.use(compression());

if (process.env.NODE_ENV == "production")
    app.set('trust proxy', 1);

const version = process.env.npm_package_version;
const port = process.env.PORT_NYCU_API || 8081;
const scope = "profile name status";
const baseURL = process.env.NYCU_API_BASE_URL;
const routerPath = process.env.NYCU_API_PATH || "/";

const config = {
    client: {
        id: process.env.NYCU_API_CLIENT_ID,
        secret: process.env.NYCU_API_CLIENT_SECRET
    },
    auth: {
        tokenHost: baseURL,
        tokenPath: "/o/token",
        authorizePath: "/o/authorize",
    }
};

const client = new AuthorizationCode(config);

router.get('/', (req, res) => {
    const authorizationUri = client.authorizeURL({
        redirect_uri: process.env.SERVER_URL_NYCU_API + "/oauth/",
        scope: scope
    });

    res.redirect(authorizationUri);
});

router.get('/oauth', (req, res) => {
    let code = req.query.code;
    if (!code) {
        res.status(400);
        res.json({ error: "400 Bad Request" });
        return;
    }
    getOAuthAccessToken(code).then((accessToken) => {
        if (!accessToken) {
            res.status(400);
            res.json({ error: "400 Bad Request" });
            return;
        }
        res.redirect(`${process.env.SERVER_URL_DISCORD_API}/OAuth?token=${accessToken.token.access_token}`);
    });
});

let getOAuthAccessToken = async (code) => {
    const tokenParams = {
        code: code,
        redirect_uri: process.env.SERVER_URL_NYCU_API + "/oauth/"
    };
    try {
        const accessToken = await client.getToken(tokenParams);
        return accessToken;
    } catch (error) {
        console.error('Access Token Error', error.message);
        return null;
    }
};

/*
let revokeOAuthAccessToken = async (accessToken) => {
    try {
        await accessToken.revokeAll();
        return true;
    } catch (error) {
        console.error('Error revoking token: ', error.output);
        return false;
    }
}
*/

app.use(routerPath, router);

app.listen(port, () => {
    console.log('\x1b[35m%s\x1b[0m\x1b[0m%s', '[Server] ', `NYCU Discord Verify (${version}) by edisonlee55 & Cute Leko`);
    console.log('\x1b[35m%s\x1b[0m\x1b[0m%s', '[Server] ', `Listening on port ${port}`);
    console.log("\n-----\n");
});
