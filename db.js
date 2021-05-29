const fs = require("fs")

let data = {};

function load(path) {
    if (fs.existsSync(path)) {
        const raw = fs.readFileSync(path);
        data = JSON.parse(raw);
    }
}

function save(path) {
    fs.writeFileSync(path, JSON.stringify(data));
}

function isValidNYCUId(id) {
    return !data.hasOwnProperty(id);
}

function add(nycu, discord) {
    data[nycu] = discord;
}

module.exports = {
    load,
    save,
    isValidNYCUId,
    add
}