'use strict';
import childProcess from "child_process";
// -----NYCU API OAuth Client Server-----
childProcess.fork('nycu_api.js', { cwd: './nycu-api' });

// -----Discord API and Bot Verify-----
childProcess.fork('discord_api.js', { cwd: './discord-api' });
