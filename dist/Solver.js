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
var _genPath, _valueBiasPer, _workOpCount, _workTvsIndex;
/**
 *
 */
class Solver {
    constructor(order, initialGenPath, initialValueBiasPer) {
        _genPath.set(this, void 0);
        _valueBiasPer.set(this, void 0);
        _workOpCount.set(this, void 0);
        _workTvsIndex.set(this, void 0);
        this.order = order;
        this.length = this.order * this.order;
        this.area = this.length * this.length;
        const grid = [];
        const gridElem = document.createElement("div");
        gridElem.classList.add("grid");
        document.body.style.setProperty("--grid-order", this.order.toString());
        this.gridElem = gridElem;
        {
            const blockElems = [];
            for (let i = 0; i < this.length; i++) {
                const blockElem = document.createElement("div");
                blockElem.classList.add("grid--block");
                blockElems.push(blockElem);
                gridElem.appendChild(blockElem);
            }
            for (let i = 0; i < this.area; i++) {
                const tile = new Tile(this);
                grid.push(tile);
                blockElems[this.getBlk(i)].appendChild(tile.baseElem);
            }
        }
        this.grid = Object.freeze(grid);
        ["row", "col", "blk"].forEach((type) => {
            this[type + "SymbolOccMasks"] = [];
        });
        this.valueBiases = [];
        for (let i = 0; i < this.length; i++) {
            const iota = [];
            for (let i = 0; i < this.length + 1; i++) {
                iota.push(i);
            }
            this.valueBiases.push(iota);
        }
        this.traversalOrder = [];
        this.genPath = initialGenPath;
        this.valueBiasPer = initialValueBiasPer;
    }
    clear() {
        this.grid.forEach((tile) => tile.clear());
        [this.rowSymbolOccMasks,
            this.colSymbolOccMasks,
            this.blkSymbolOccMasks].forEach((masksArr) => {
            for (let i = 0; i < this.length; i++) {
                masksArr[i] = 0;
            }
        });
        switch (this.valueBiasPer) {
            case "none" /* NONE */:
                this.valueBiases.forEach((rowBias) => {
                    rowBias.sort((a, b) => a - b);
                });
                break;
            case "row" /* ROW */:
                this.valueBiases.forEach((rowBias) => {
                    rowBias.sort((a, b) => Math.random() - 0.5);
                    rowBias.splice(rowBias.findIndex((value) => value === this.length), 1);
                    rowBias.push(this.length);
                });
                break;
        }
        __classPrivateFieldSet(this, _workOpCount, 0);
        __classPrivateFieldSet(this, _workTvsIndex, 0);
    }
    /**
     * Tests a new value at the current tile in the traversal path.
     */
    singleStep() {
        if (!this.isDone) {
            const gridIndex = this.traversalOrder[__classPrivateFieldGet(this, _workTvsIndex)];
            return this.setNextValid(gridIndex);
        }
        return undefined;
    }
    get isDone() {
        return __classPrivateFieldGet(this, _workTvsIndex) === this.area;
    }
    setNextValid(index) {
        const tile = this.grid[index];
        const row = this.getRow(index);
        const col = this.getCol(index);
        const blk = this.getBlk(index);
        if (!(tile.isClear)) {
            const eraseMask = ~(1 << tile.value);
            this.rowSymbolOccMasks[row] &= eraseMask;
            this.colSymbolOccMasks[col] &= eraseMask;
            this.blkSymbolOccMasks[blk] &= eraseMask;
        }
        const invalidBin = (this.rowSymbolOccMasks[row] |
            this.colSymbolOccMasks[col] |
            this.blkSymbolOccMasks[blk]);
        for (let biasIndex = tile.biasIndex; biasIndex < this.length; biasIndex++) {
            const value = this.valueBiases[this.getRow(index)][biasIndex];
            const valueBit = 1 << value;
            if (!(invalidBin & valueBit)) {
                // If a valid value is found for this tile:
                this.rowSymbolOccMasks[row] |= valueBit;
                this.colSymbolOccMasks[col] |= valueBit;
                this.blkSymbolOccMasks[blk] |= valueBit;
                tile.value = value;
                tile.biasIndex = (biasIndex + 1);
                __classPrivateFieldSet(this, _workTvsIndex, +__classPrivateFieldGet(this, _workTvsIndex) + 1);
                __classPrivateFieldSet(this, _workOpCount, +__classPrivateFieldGet(this, _workOpCount) + 1);
                return "forward" /* FORWARD */;
            }
        }
        tile.clear();
        __classPrivateFieldSet(this, _workTvsIndex, +__classPrivateFieldGet(this, _workTvsIndex) - 1);
        __classPrivateFieldSet(this, _workOpCount, +__classPrivateFieldGet(this, _workOpCount) + 1);
        return "backward" /* BACKWARD */;
    }
    get genPath() {
        return __classPrivateFieldGet(this, _genPath);
    }
    set genPath(newGenPath) {
        __classPrivateFieldSet(this, _genPath, newGenPath);
        switch (newGenPath) {
            case "row-major" /* ROW_MAJOR */: {
                for (let i = 0; i < this.area; i++) {
                    this.traversalOrder[i] = i;
                }
                break;
            }
            case "block-col" /* BLOCK_COL */: {
                const order = this.order;
                let i = 0;
                for (let blkCol = 0; blkCol < order; blkCol++) {
                    for (let row = 0; row < this.length; row++) {
                        for (let bCol = 0; bCol < order; bCol++) {
                            this.traversalOrder[i++] = (blkCol * order) + (row * this.length) + (bCol);
                        }
                    }
                }
                break;
            }
        }
    }
    get valueBiasPer() {
        return __classPrivateFieldGet(this, _valueBiasPer);
    }
    set valueBiasPer(newValueBiasPer) {
        __classPrivateFieldSet(this, _valueBiasPer, newValueBiasPer);
    }
    getRow(index) { return Math.floor(index / this.length); }
    getCol(index) { return index % this.length; }
    getBlk(index) { return this.getBlk2(this.getRow(index), this.getCol(index)); }
    getBlk2(row, col) {
        const order = this.order;
        return (Math.floor(row / order) * order) + Math.floor(col / order);
    }
}
_genPath = new WeakMap(), _valueBiasPer = new WeakMap(), _workOpCount = new WeakMap(), _workTvsIndex = new WeakMap();
(function (Solver) {
    ;
    // There must be an entry for each selectable option (see index.html):
    Solver.GenPathDefaults = Object.freeze({
        "2": "row-major" /* ROW_MAJOR */,
        "3": "row-major" /* ROW_MAJOR */,
        "4": "block-col" /* BLOCK_COL */,
        "5": "block-col" /* BLOCK_COL */,
    });
    ;
    ;
})(Solver || (Solver = {}));
Object.freeze(Solver);
Object.freeze(Solver.prototype);
//# sourceMappingURL=Solver.js.map