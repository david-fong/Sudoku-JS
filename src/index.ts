
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
class SymbolOccMask {
    public constructor() {
        ;
    }
}
Object.freeze(SymbolOccMask);
Object.freeze(SymbolOccMask.prototype);


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
    private readonly rowBiases: Array<Array<number>>;

    public constructor(order: number) {
        this.order  = order;
        this.length = this.order  * this.order;
        this.area   = this.length * this.length;

        const grid: Array<Tile> = [];
        const gridElem = document.createElement("div");
        gridElem.classList.add("grid");
        for (let i = 0; i < this.area; i++) {
            const tile = new Tile(this);
            grid.push(tile);
            gridElem.appendChild(tile.baseElem);
        }
        this.grid = Object.freeze(grid);
    }

    private clear(): void {
        this.grid.forEach(Tile.prototype.clear);
        this.rowSymbolOccMasks.clear();
    }

    private setNextValid(): void {
        ;
    }
}
namespace Solver {
}
Object.freeze(Solver);
Object.freeze(Solver.prototype);


/**
 *
 */
class Visualizer {
    private readonly solver: Solver;

    public constructor() {
        ;
    }
}
Object.freeze(Visualizer);
Object.freeze(Visualizer.prototype);
