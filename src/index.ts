
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
    readonly #startOverBtn: HTMLButtonElement;

    public constructor() {
        this._initSolverParams();
        this._initPlaybackControls();
        (Object.keys(this.in) as Array<keyof Gui["in"]>).forEach((key) => {
            this.in[key].addEventListener("change", (ev) => {
                this.resetSolver();
            });
        })
        this.host = Object.freeze(<Gui["host"]>{
            grid: document.getElementById("host-grid"),
        });
        this.resetSolver();
    }

    private _initSolverParams(): void {
        const gridOrder = document.getElementById("sel-grid-order") as HTMLSelectElement;
        gridOrder.selectedIndex = Array.from(gridOrder.options).findIndex((opt) => {
            return opt.value === (localStorage.getItem("grid-order") ?? "3");
        });
        gridOrder.dispatchEvent(new Event("change"));
        gridOrder.addEventListener("change", (ev) => {
            localStorage.setItem("grid-order", gridOrder.value);
        });
        const genPath = document.getElementById("sel-gen-path") as HTMLSelectElement;
        genPath.selectedIndex = Array.from(genPath.options).findIndex((opt) => {
            return opt.value === Solver.GenPathDefaults[gridOrder.value as keyof typeof Solver.GenPathDefaults];
        });
        const valueBiasPer = document.getElementById("sel-value-bias-per");
        (this.in as Gui["in"]) = Object.freeze(<Gui["in"]>{
            gridOrder,
            genPath,
            valueBiasPer,
        });
    }

    private _initPlaybackControls(): void {
        const startOver = document.getElementById("btn-playback-value-start-over") as HTMLButtonElement;
        const valueTest = document.getElementById("btn-playback-value-test") as HTMLButtonElement;
        const backtrack = document.getElementById("btn-playback-backtrack")  as HTMLButtonElement;
        const playPause = document.getElementById("btn-playback-play-pause") as HTMLButtonElement;
        // @ts-expect-error
        this.#startOverBtn = startOver;

        const uiNotifyDoneGenerating = (
            workerFunc: (() => boolean) = (() => true),
        ) => {
            return () => {
                if (workerFunc()) {
                    valueTest.disabled = true;
                    backtrack.disabled = true;
                    playPause.disabled = true;
                }
            };
        };
        startOver.addEventListener("click", (ev) => {
            if (setIntervalId !== undefined) {
                stopPlaying();
            }
            this.solver.clear();
            valueTest.disabled = false;
            backtrack.disabled = false;
            playPause.disabled = false;
        });
        valueTest.addEventListener("click", uiNotifyDoneGenerating(() => {
            if (this.solver.singleStep() === undefined) {
                return true;
            }
            return false;
        }));
        backtrack.addEventListener("click", uiNotifyDoneGenerating(() => {
            let lastDirection: Solver.TvsDirection | undefined = undefined;
            while ((lastDirection = this.solver.singleStep()) === Solver.TvsDirection.FORWARD) { }
            return lastDirection === undefined;
        }));

        const speedCoarse = document.getElementById("slider-playback-speed-coarse") as HTMLInputElement;
        const speedFine   = document.getElementById("slider-playback-speed-fine")   as HTMLInputElement;

        let setIntervalId: number | undefined = undefined;
        const stopPlaying = () => {
            playPause.textContent = "play";
            valueTest.disabled = false;
            backtrack.disabled = false;
            if (setIntervalId) {
                clearInterval(setIntervalId);
                setIntervalId = undefined;
            }
        };
        const startPlaying = () => {
            playPause.textContent = "pause";
            valueTest.disabled = true;
            backtrack.disabled = true;
            setIntervalId = setInterval(() => {
                if (!this.solver.singleStep()) {
                    stopPlaying();
                    uiNotifyDoneGenerating()();
                }
            }, 1000 / (Number(speedCoarse.value) + Number(speedFine.value)));
        };
        playPause.addEventListener("click", (ev) => {
            if (setIntervalId === undefined) {
                startPlaying();
            } else {
                stopPlaying();
            }
        });
        [speedCoarse,speedFine].forEach((slider) => {
            slider.addEventListener("change", (ev) => {
                if (setIntervalId !== undefined) {
                    stopPlaying();
                    startPlaying();
                }
            });
        });
    }

    public resetSolver(): void {
        const order = Number(this.in.gridOrder.selectedOptions.item(0)!.value);
        const genPath = this.in.genPath.value as Solver.GenPath;
        const valueBiasPer = this.in.valueBiasPer.value as Solver.ValueBiasPer;

        if (!this.solver || order !== this.solver.order) {
            this.solver?.gridElem.remove();
            this.#solver = new Solver(order, genPath, valueBiasPer);
            this.host.grid.appendChild(this.solver.gridElem);
            // TODO.impl select the solver's default genpath and bias per.
            this.in.genPath;

        } else {
            if (genPath !== this.solver.genPath) {
                this.solver.genPath = genPath;
            }
            if (valueBiasPer !== this.solver.valueBiasPer) {
                this.solver.valueBiasPer = valueBiasPer;
            }
        }
        this.#startOverBtn.click();
    }

    public get solver(): Solver {
        return this.#solver;
    }
}
Object.freeze(Gui);
Object.freeze(Gui.prototype);

const gui = new Gui();
