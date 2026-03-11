"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeId = makeId;
const crypto_1 = require("crypto");
function makeId() {
    return (0, crypto_1.randomUUID)();
}
//# sourceMappingURL=id.factory.js.map