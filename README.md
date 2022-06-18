# nycu-discord-verify

NYCU Discord Verify Bot.

Using NYCU OAuth API (https://id.nycu.edu.tw/docs/).

Add your bot into server using `https://discord.com/oauth2/authorize?client_id=<client_id>&scope=bot&permissions=268435456`.

## Deploy Using Cloudflared

### Configuration

- Cloudflared:
    - https://nycu-discord-verify.bot/nycu    -> http://app:8081
    - https://nycu-discord-verify.bot/discord -> http://app:8080
- env:
    - NYCU_API_PATH=/nycu
    - DISCORD_API_PATH=/discord
    - SERVER_URL_NYCU_API=https://nycu-discord-verify.bot/nycu
    - SERVER_URL_DISCORD_API=https://nycu-discord-verify.bot/discord
- Discord
    - Redirect URI: https://nycu-discord-verify.bot/discord/register
- NYCU OAuth
    - Redirect URI: https://nycu-discord-verify.bot/nycu/oauth
