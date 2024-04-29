/**
 * A class for debouncing a function.
 * @Utilities
 */

import { assertNotNull } from "./ErrorHandling";

/**
 * A class for debouncing a function. That means multiple calls
 * to the same function will only fire a period of time after the first,
 * so that the same function can be requested quickly but only fired after the time completed
 * 
 * @example
 * 
 * const handleResize = () => {
 *     console.log("Window resized!");
 * };
 * 
 * const debouncer = new Debouncer(handleResize, 300);
 *     globalThis.addEventListener("resize", () => debouncer.run());
 *     globalThis.addEventListener("click", () => debouncer.forceRun());
 *     globalThis.addEventListener("dblclick", () => debouncer.cancel());
 */
export class Debouncer<F extends (...args: any[]) => void> {
    private _timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    private _func: F;
    private _delay: number;
    private _immediate: boolean;
    private _isCalled: boolean = false;
    private _disposed: boolean = false;
    /**
     * 
     * @param func - The function. The parameters are determined by what is
     * passed to the run() function.
     * @param delay - Time in ms
     * @param immediate - when true, run immediately on the first call to run.
     */
    constructor(func: F, delay: number, immediate: boolean = false) {
        assertNotNull(func, 'func');
        this._func = func;
        this._delay = delay;
        this._immediate = immediate;
        this._isCalled = false;
    }
    public dispose(): void {
        this.cancel();
        this._disposed = true;
    }
    /**
     * Attempt to call the function. Pass in the functions parameters.
     * It will not run until the delay is finished, and will be replaced by the next
     * call to run if the delay isn't finished.
     * @param args 
     */
    public run(...args: Parameters<F>): void {
        if (this._disposed)
            return;
        const callNow = this._immediate && !this._isCalled;
        this.clearTimeout();

        if (callNow) {
            this._func(...args);
            this._isCalled = true;
        }
        else {
            this._timeoutHandle = globalThis.setTimeout(() => {
                this._func(...args);
                this._isCalled = false;
            }, this._delay);
        }
    }
    /**
     * Stop anything happening. Call this when destroying the object too.
     */
    public cancel(): void {
        this.clearTimeout();
        this._isCalled = false;
    }

    /**
     * Run the function immediately, stopping any previous timers.
     * After this, another call to run will work as if its the first time called.
     * @param args 
     */
    public forceRun(...args: Parameters<F>): void {
        if (this._disposed)
            return;
        this.clearTimeout();
        this._func(...args);
        this._isCalled = false;
    }

    private clearTimeout(): void {
        if (this._timeoutHandle !== undefined) {
            globalThis.clearTimeout(this._timeoutHandle);
            this._timeoutHandle = undefined;
        }
    }
}


