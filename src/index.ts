
/**
 *
 */
class Tile {
    readonly #solver: Solver;
    #biasIndex: number;
    #value: number;

    public  readonly baseElem: HTMLElement;
    private readonly valueElem: HTMLElement;

    public constructor(solver: Solver) {
        this.#solver = solver;

        this.baseElem = document.createElement("div");
        this.baseElem.classList.add("tile");

        this.valueElem = document.createElement("div");
        this.valueElem.classList.add("tile--value");
        this.baseElem.appendChild(this.valueElem);
    }
    public clear(): void {
        this.biasIndex = 0;
        this.value = this.#solver.length;
    }
    public get isClear(): boolean {
        return this.value === this.#solver.length;
    }

    public get biasIndex(): number {
        return this.#biasIndex;
    }
    public set biasIndex(newBiasIndex: number) {
        this.#biasIndex = newBiasIndex;
    }

    public get value(): number {
        return this.#value;
    }
    public set value(newValue: number) {
        this.#value = newValue;
        this.valueElem.textContent = (newValue + 1).toString();
    }
}
Object.freeze(Tile);
Object.freeze(Tile.prototype);


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

    #workDirection: Solver.TvsDirection;
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
        this.gridElem = gridElem;

        for (let i = 0; i < this.area; i++) {
            const tile = new Tile(this);
            grid.push(tile);
            gridElem.appendChild(tile.baseElem);
        }
        this.grid = Object.freeze(grid);

        ["row","col","blk"].forEach((type) => {
            ((this as any)[type + "SymbolOccMasks"] as Solver["rowSymbolOccMasks"]) = [];
        });

        this.valueBiases = [];
        for (let i = 0; i < this.length; i++) {
            this.valueBiases.push([]);
        }
        this.genPath = initialGenPath;
        this.valueBiasPer = initialValueBiasPer;
    }

    private clear(): void {
        this.grid.forEach(Tile.prototype.clear);
        [this.rowSymbolOccMasks,
        this.colSymbolOccMasks,
        this.blkSymbolOccMasks].forEach((masksArr) => {
            for (let i = 0; i < this.length; i++) {
                masksArr[i] = ~0;
            }
        });
        this.#workDirection = Solver.TvsDirection.FORWARD;
        this.#workOpCount   = 0;
        this.#workTvsIndex  = 0;
    }

    public continueGenerateSolution(): void {
        while (this.#workTvsIndex < this.area) {
            const gridIndex = this.traversalOrder[this.#workTvsIndex];
            this.#workDirection = this.setNextValid(gridIndex);
            this.#workOpCount++;
            if (this.#workDirection === Solver.TvsDirection.BACKWARD) {
                --this.#workTvsIndex;
            } else {
                ++this.#workTvsIndex;
            }
        }
    }

    private setNextValid(index: number): Solver.TvsDirection {
        const tile = this.grid[index];
        const rowBin = this.rowSymbolOccMasks[this.getRow(index)];
        const colBin = this.colSymbolOccMasks[this.getCol(index)];
        const blkBin = this.blkSymbolOccMasks[this.getBlk(index)];
        if (!tile.isClear) {
            const eraseMask = ~(1 << tile.value);
            this.rowSymbolOccMasks[this.getRow(index)] &= eraseMask;
            this.colSymbolOccMasks[this.getCol(index)] &= eraseMask;
            this.blkSymbolOccMasks[this.getBlk(index)] &= eraseMask;
        }
        const invalidBin = (rowBin | colBin | blkBin);
        for (let biasIndex = tile.biasIndex; biasIndex < length; biasIndex++) {
            const value = this.valueBiases[this.getRow(index)][biasIndex];
            const valueBit = 1 << value;
            if (!(invalidBin & valueBit)) {
                // If a valid value is found for this tile:
                this.rowSymbolOccMasks[this.getRow(index)] |= valueBit;
                this.colSymbolOccMasks[this.getCol(index)] |= valueBit;
                this.blkSymbolOccMasks[this.getBlk(index)] |= valueBit;
                tile.value = value;
                tile.biasIndex = (biasIndex + 1);
                return Solver.TvsDirection.FORWARD;
            }
        }
        tile.clear();
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
                for (let row = 0; row < length; row++) {
                    for (let bCol = 0; bCol < order; bCol++) {
                        this.traversalOrder[i++] = (blkCol * order) + (row * length) + (bCol);
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
        switch (newValueBiasPer) {
        case Solver.ValueBiasPer.NONE:
            this.valueBiases.forEach((rowBias) => {
                rowBias.sort((a,b) => a - b);
            });
            break;
        case Solver.ValueBiasPer.ROW:
            this.valueBiases.forEach((rowBias) => {
                rowBias.sort((a,b) => Math.random() - 0.5);
            });
            break;
        }
    }

    public getRow(index: number): number { return index / length; }
    public getCol(index: number): number { return index % length; }
    public getBlk(index: number): number { return this.getBlk2(this.getRow(index), this.getCol(index)); }
    public getBlk2(row: number, col: number): number {
        const order = this.order;
        return ((row / order) * order) + (col / order);
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
        ROW  = "row"
    };
    export const enum TvsDirection {
        FORWARD  = "forward",
        BACKWARD = "backward",
    };
}
Object.freeze(Solver);
Object.freeze(Solver.prototype);


/**
 *
 */
class Gui {
    #solver: Solver;
    public readonly in: Readonly<{
        gridOrder:    HTMLSelectElement;
        genPath:      HTMLSelectElement;
        valueBiasPer: HTMLSelectElement;
    }>;
    private readonly host: Readonly<{
        grid: HTMLElement;
    }>;

    public constructor() {
        const gridOrder = document.getElementById("input-grid-order") as HTMLSelectElement;
        gridOrder.selectedIndex = Number(localStorage.getItem("grid-order")) || 2;
        gridOrder.addEventListener("change", (ev) => {
            localStorage.setItem("grid-order", gridOrder.value)
        });

        const genPath = document.getElementById("input-gen-path") as HTMLSelectElement;
        genPath.selectedIndex = Array.from(genPath.options).findIndex((opt) => {
            return opt.value === Solver.GenPathDefaults[gridOrder.value as keyof typeof Solver.GenPathDefaults];
        });

        const valueBiasPer = document.getElementById("input-value-bias-per");

        this.in = Object.freeze(<Gui["in"]>{
            gridOrder,
            genPath,
            valueBiasPer,
        });
        this.host = Object.freeze(<Gui["host"]>{
            grid: document.getElementById("host-grid"),
        });
        this.setupSolver();
    }

    public setupSolver(): void {
        const order = Number(this.in.gridOrder.selectedOptions.item(0)!.value);
        const genPath = this.in.genPath.value as Solver.GenPath;
        const valueBiasPer = this.in.valueBiasPer.value as Solver.ValueBiasPer;

        if (!this.solver || order !== this.solver.order) {
            this.solver.gridElem.remove();
            this.#solver = new Solver(order, genPath, valueBiasPer);
            this.host.grid.appendChild(this.solver.gridElem);

        } else if (genPath !== this.solver.genPath) {
            this.solver.genPath = genPath;
        }
    }

    public get solver(): Solver {
        return this.#solver;
    }
}
Object.freeze(Gui);
Object.freeze(Gui.prototype);
