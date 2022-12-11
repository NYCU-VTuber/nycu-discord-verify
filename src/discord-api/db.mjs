'use strict';
import { Mutex } from 'async-mutex';
import { existsSync, readFileSync, writeFileSync } from "fs";

const mutex = new Mutex();
let data = {};

function load(path){
    if (existsSync(path)) {
        const raw = readFileSync(path);
        data = JSON.parse(raw);
    }
}

async function save(path){
    await mutex.runExclusive(() => {
        writeFileSync(path, JSON.stringify(data));
    });
}

function isValid(id, data){
    if (!data.hasOwnProperty(id)) {
        return true;
    }
    if (data[id] === null || data[id] === data) {
        return true;
    }
    return false;
}

async function add(nycu, discord){
    await mutex.runExclusive(() => {
        data[nycu] = discord;
    });
}

export default {
    load,
    save,
    isValid,
    add
}
