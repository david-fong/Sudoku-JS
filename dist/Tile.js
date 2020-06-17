"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _solver, _biasIndex, _value;
/**
 *
 */
class Tile {
    constructor(solver) {
        _solver.set(this, void 0);
        _biasIndex.set(this, void 0);
        _value.set(this, void 0);
        __classPrivateFieldSet(this, _solver, solver);
        this.baseElem = document.createElement("div");
        this.baseElem.classList.add("center-contents", "tile");
        this.valueElem = document.createElement("div");
        this.valueElem.classList.add("tile--value");
        this.baseElem.appendChild(this.valueElem);
    }
    clear() {
        this.biasIndex = 0;
        this.value = __classPrivateFieldGet(this, _solver).length;
    }
    get isClear() {
        return this.value === __classPrivateFieldGet(this, _solver).length;
    }
    get biasIndex() {
        return __classPrivateFieldGet(this, _biasIndex);
    }
    set biasIndex(newBiasIndex) {
        __classPrivateFieldSet(this, _biasIndex, newBiasIndex);
    }
    get value() {
        return __classPrivateFieldGet(this, _value);
    }
    set value(newValue) {
        __classPrivateFieldSet(this, _value, newValue);
        this.valueElem.textContent = (newValue === __classPrivateFieldGet(this, _solver).length)
            ? "" // <-- Set to empty string for empty tile.
            : "1234567890ABCDEFGHIJKLMNOPQRSTUVYXYZ"[newValue];
    }
}
_solver = new WeakMap(), _biasIndex = new WeakMap(), _value = new WeakMap();
Object.freeze(Tile);
Object.freeze(Tile.prototype);
//# sourceMappingURL=Tile.js.map