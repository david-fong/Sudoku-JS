
/**
 *
 */
class Solver {
    public readonly order: number;
    public readonly length: number;
    public readonly area: number;

    private readonly grid: ReadonlyArray<Tile>;
    private readonly rowSymbolOccMasks: Array<number>;
    private readonly colSymbolOccMasks: Array<number>;
    private readonly blkSymbolOccMasks: Array<number>;

    private readonly valueBiases: Array<Array<number>>;
    #genPath: Solver.GenPath;
    private readonly traversalOrder: Array<number>;
    #valueBiasPer: Solver.ValueBiasPer;

    #workOpCount:   number;
    #workTvsIndex:  number;

    public gridElem: HTMLElement;

    public constructor(
        order: number,
        initialGenPath: Solver.GenPath,
        initialValueBiasPer: Solver.ValueBiasPer,
    ) {
        this.order  = order;
        this.length = this.order  * this.order;
        this.area   = this.length * this.length;

        const grid: Array<Tile> = [];
        const gridElem = document.createElement("div");
        gridElem.classList.add("grid");
        document.body.style.setProperty("--grid-order", this.order.toString());
        this.gridElem = gridElem;

        {const blockElems = [];
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
        }}
        this.grid = Object.freeze(grid);

        ["row","col","blk"].forEach((type) => {
            ((this as any)[type + "SymbolOccMasks"] as Solver["rowSymbolOccMasks"]) = [];
        });

        this.valueBiases = [];
        for (let i = 0; i < this.length; i++) {
            const iota: Array<number> = [];
            for (let i = 0; i < this.length + 1; i++) {
                iota.push(i);
            }
            this.valueBiases.push(iota);
        }
        this.traversalOrder = [];
        this.genPath = initialGenPath;
        this.valueBiasPer = initialValueBiasPer;
    }

    public clear(): void {
        this.grid.forEach((tile) => tile.clear());
        [this.rowSymbolOccMasks,
        this.colSymbolOccMasks,
        this.blkSymbolOccMasks].forEach((masksArr) => {
            for (let i = 0; i < this.length; i++) {
                masksArr[i] = 0;
            }
        });
        switch (this.valueBiasPer) {
        case Solver.ValueBiasPer.NONE:
            this.valueBiases.forEach((rowBias) => {
                rowBias.sort((a,b) => a - b);
            });
            break;
        case Solver.ValueBiasPer.ROW:
            this.valueBiases.forEach((rowBias) => {
                rowBias.sort((a,b) => Math.random() - 0.5);
                rowBias.splice(rowBias.findIndex((value) => value === this.length), 1);
                rowBias.push(this.length);
            });
            break;
        }
        this.#workOpCount   = 0;
        this.#workTvsIndex  = 0;
    }

    /**
     * Tests a new value at the current tile in the traversal path.
     */
    public singleStep(): Solver.TvsDirection | undefined {
        if (!this.isDone) {
            const gridIndex = this.traversalOrder[this.#workTvsIndex];
            return this.setNextValid(gridIndex);
        }
        return undefined;
    }

    public get isDone(): boolean {
        return this.#workTvsIndex === this.area;
    }

    private setNextValid(index: number): Solver.TvsDirection {
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
        const invalidBin = (
            this.rowSymbolOccMasks[row] |
            this.colSymbolOccMasks[col] |
            this.blkSymbolOccMasks[blk]
        );
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
                ++this.#workTvsIndex;
                this.#workOpCount++;
                return Solver.TvsDirection.FORWARD;
            }
        }
        tile.clear();
        --this.#workTvsIndex;
        this.#workOpCount++;
        return Solver.TvsDirection.BACKWARD;
    }

    public get genPath(): Solver.GenPath {
        return this.#genPath;
    }
    public set genPath(newGenPath: Solver.GenPath) {
        this.#genPath = newGenPath;
        switch (newGenPath) {
        case Solver.GenPath.ROW_MAJOR: {
            for (let i = 0; i < this.area; i++) {
                this.traversalOrder[i] = i;
            }
            break; }
        case Solver.GenPath.BLOCK_COL: {
            const order = this.order;
            let i = 0;
            for (let blkCol = 0; blkCol < order; blkCol++) {
                for (let row = 0; row < this.length; row++) {
                    for (let bCol = 0; bCol < order; bCol++) {
                        this.traversalOrder[i++] = (blkCol * order) + (row * this.length) + (bCol);
                    }
                }
            }
            break; }
        }
    }

    public get valueBiasPer(): Solver.ValueBiasPer {
        return this.#valueBiasPer;
    }
    public set valueBiasPer(newValueBiasPer: Solver.ValueBiasPer) {
        this.#valueBiasPer = newValueBiasPer;
    }

    public getRow(index: number): number { return Math.floor(index / this.length); }
    public getCol(index: number): number { return index % this.length; }
    public getBlk(index: number): number { return this.getBlk2(this.getRow(index), this.getCol(index)); }
    public getBlk2(row: number, col: number): number {
        const order = this.order;
        return (Math.floor(row / order) * order) + Math.floor(col / order);
    }
}
namespace Solver {
    export const enum GenPath {
        ROW_MAJOR = "row-major",
        BLOCK_COL = "block-col",
    };
    // There must be an entry for each selectable option (see index.html):
    export const GenPathDefaults = Object.freeze({
        "2": GenPath.ROW_MAJOR,
        "3": GenPath.ROW_MAJOR,
        "4": GenPath.BLOCK_COL,
        "5": GenPath.BLOCK_COL,
    });
    export const enum ValueBiasPer {
        NONE = "none",
        ROW  = "row",
    };
    export const enum TvsDirection {
        FORWARD  = "forward",
        BACKWARD = "backward",
    };
}
Object.freeze(Solver);
Object.freeze(Solver.prototype);
