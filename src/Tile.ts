
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
        this.baseElem.classList.add(
            "center-contents",
            "tile",
        );

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
        this.valueElem.textContent = (newValue === this.#solver.length)
            ? "" // <-- Set to empty string for empty tile.
            : "1234567890ABCDEFGHIJKLMNOPQRSTUVYXYZ"[newValue];
    }
}
Object.freeze(Tile);
Object.freeze(Tile.prototype);
