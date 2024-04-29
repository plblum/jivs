/**
 * Used by ValueHostManager.build() function to supply fluent entry of ValueHosts.
 * @module ValidationManager/ConcreteClasses/ValueHostsInstanceBuilder
 */

import { ValueHostConfig } from "../Interfaces/ValueHost";
import { StartFluent } from "./Fluent";
import { ValueHostsBuilderBase } from "./ValueHostsBuilderBase";
import { IValueHostsManager } from "../Interfaces/ValueHostsManager";
import { assertNotNull } from "../Utilities/ErrorHandling";

/**
 * Supplies fluent entry to ValueHostManager by being exposed in its build() function.
 */
export class ValueHostsInstanceBuilder extends ValueHostsBuilderBase
{
    constructor(valueHostManager: IValueHostsManager)
    {
        super();
        assertNotNull(valueHostManager, 'valueHostManager');
        this._valueHostManager = valueHostManager;
    }
    private _valueHostManager: IValueHostsManager;

    protected get valueHostManager(): IValueHostsManager
    {
        return this._valueHostManager;
    }

    protected applyConfig(config: ValueHostConfig): void {
        this.valueHostManager.updateValueHost(config, null);    // supports both add and replace
    }
    protected createFluent(): StartFluent {
        return new StartFluent(null);
    }
    
}