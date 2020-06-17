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
var _solver, _startOverBtn;
/**
 *
 */
class Gui {
    constructor() {
        _solver.set(this, void 0);
        _startOverBtn.set(this, void 0);
        this._initSolverParams();
        this._initPlaybackControls();
        Object.keys(this.in).forEach((key) => {
            this.in[key].addEventListener("change", (ev) => {
                this.resetSolver();
            });
        });
        this.host = Object.freeze({
            grid: document.getElementById("host-grid"),
        });
        this.resetSolver();
    }
    _initSolverParams() {
        const gridOrder = document.getElementById("sel-grid-order");
        gridOrder.selectedIndex = Array.from(gridOrder.options).findIndex((opt) => {
            var _a;
            return opt.value === ((_a = localStorage.getItem("grid-order")) !== null && _a !== void 0 ? _a : "3");
        });
        gridOrder.dispatchEvent(new Event("change"));
        gridOrder.addEventListener("change", (ev) => {
            localStorage.setItem("grid-order", gridOrder.value);
        });
        const genPath = document.getElementById("sel-gen-path");
        genPath.selectedIndex = Array.from(genPath.options).findIndex((opt) => {
            return opt.value === Solver.GenPathDefaults[gridOrder.value];
        });
        const valueBiasPer = document.getElementById("sel-value-bias-per");
        this.in = Object.freeze({
            gridOrder,
            genPath,
            valueBiasPer,
        });
    }
    _initPlaybackControls() {
        const startOver = document.getElementById("btn-playback-value-start-over");
        const valueTest = document.getElementById("btn-playback-value-test");
        const backtrack = document.getElementById("btn-playback-backtrack");
        const playPause = document.getElementById("btn-playback-play-pause");
        // @ts-expect-error
        __classPrivateFieldSet(this, _startOverBtn, startOver);
        const uiNotifyDoneGenerating = (workerFunc = (() => true)) => {
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
            let lastDirection = undefined;
            while ((lastDirection = this.solver.singleStep()) === "forward" /* FORWARD */) { }
            return lastDirection === undefined;
        }));
        const speedCoarse = document.getElementById("slider-playback-speed-coarse");
        const speedFine = document.getElementById("slider-playback-speed-fine");
        let setIntervalId = undefined;
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
            }
            else {
                stopPlaying();
            }
        });
        [speedCoarse, speedFine].forEach((slider) => {
            slider.addEventListener("change", (ev) => {
                if (setIntervalId !== undefined) {
                    stopPlaying();
                    startPlaying();
                }
            });
        });
    }
    resetSolver() {
        var _a;
        const order = Number(this.in.gridOrder.selectedOptions.item(0).value);
        const genPath = this.in.genPath.value;
        const valueBiasPer = this.in.valueBiasPer.value;
        if (!this.solver || order !== this.solver.order) {
            (_a = this.solver) === null || _a === void 0 ? void 0 : _a.gridElem.remove();
            __classPrivateFieldSet(this, _solver, new Solver(order, genPath, valueBiasPer));
            this.host.grid.appendChild(this.solver.gridElem);
            // TODO.impl select the solver's default genpath and bias per.
            this.in.genPath;
        }
        else {
            if (genPath !== this.solver.genPath) {
                this.solver.genPath = genPath;
            }
            if (valueBiasPer !== this.solver.valueBiasPer) {
                this.solver.valueBiasPer = valueBiasPer;
            }
        }
        __classPrivateFieldGet(this, _startOverBtn).click();
    }
    get solver() {
        return __classPrivateFieldGet(this, _solver);
    }
}
_solver = new WeakMap(), _startOverBtn = new WeakMap();
Object.freeze(Gui);
Object.freeze(Gui.prototype);
const gui = new Gui();
//# sourceMappingURL=index.js.map