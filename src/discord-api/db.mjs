'use strict';
import { existsSync, readFileSync, writeFileSync } from "fs";

let data = {};

let load = (path) => {
    if (existsSync(path)) {
        const raw = readFileSync(path);
        data = JSON.parse(raw);
    }
}

let save = (path) => {
    writeFileSync(path, JSON.stringify(data));
}

let isValidNYCUId = (id) => {
    return !data.hasOwnProperty(id);
}

let add = (nycu, discord) => {
    data[nycu] = discord;
}

export default {
    load,
    save,
    isValidNYCUId,
    add
}
