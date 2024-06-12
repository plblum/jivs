/**
 * Used by ValueHostManager.build() function to supply fluent entry of ValueHosts.
 * @module ValidationManager/ConcreteClasses/ValueHostsInstanceBuilder
 */

import { ValueHostConfig } from "../Interfaces/ValueHost";
import { StartFluent } from "./Fluent";
import { ValueHostsBuilderBase } from "./ValueHostsBuilderBase";
import { IValueHostsManager } from "../Interfaces/ValueHostsManager";
import { assertNotNull, assertWeakRefExists } from "../Utilities/ErrorHandling";

/**
 * Supplies fluent entry to ValueHostManager by being exposed in its build() function.
 */
export class ValueHostsInstanceBuilder extends ValueHostsBuilderBase
{
    constructor(valueHostManager: IValueHostsManager)
    {
        super();
        assertNotNull(valueHostManager, 'valueHostManager');
        this._valueHostManager = new WeakRef<IValueHostsManager>(valueHostManager);
    }
    private _valueHostManager: WeakRef<IValueHostsManager>;

    protected get valueHostManager(): IValueHostsManager
    {
        assertWeakRefExists(this._valueHostManager, 'ValueHostsManager disposed');
        return this._valueHostManager.deref()!;
    }

    protected applyConfig(config: ValueHostConfig): void {
        this.valueHostManager.addOrUpdateValueHost(config, null);    // supports both add and replace
    }
    protected createFluent(): StartFluent {
        return new StartFluent(null);
    }
    
}