/**
 * Used by ValueHostManager.startModifying() function to modify the ValueHostsManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * It makes changes through ValueHostsManager.addOrMergeValueHost().
 * @module ValueHosts/ConcreteClasses/ValueHostsManagerConfigModifier
 */

import { ValueHostsManagerStartFluent } from "./Fluent";
import { IValueHostsManager, ValueHostsManagerConfig } from "../Interfaces/ValueHostsManager";
import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { ValueHostsManagerConfigBuilderBase } from "./ValueHostsManagerConfigBuilderBase";
import { CalcValueHostConfig } from "../Interfaces/CalcValueHost";
import { StaticValueHostConfig } from "../Interfaces/StaticValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { ValueHostConfig } from "../Interfaces/ValueHost";

/**
 * Used by ValueHostManager.startModifying() function to modify the ValueHostsManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * Apply() makes its updates through ValueHostsManager.addOrMergeValueHost().
 */
export class ValueHostsManagerConfigModifier<T extends ValueHostsManagerConfig>
    extends ValueHostsManagerConfigBuilderBase<T>
{
    /**
     * Expected to be called internally by ValueHostsManager/ValidationManager, which supplies
     * the current ValueHostsConfig object. It will be cloned, and not modified directly.
     * @param valueHostManager
     */
    constructor(valueHostManager: IValueHostsManager, existingValueHostConfigs: Map<string, ValueHostConfig>)
    {
        super(valueHostManager.services);
        assertNotNull(valueHostManager, 'valueHostManager');
        this._valueHostManager = new WeakRef<IValueHostsManager>(valueHostManager);
        this._existingValueHostConfigs = new WeakRef(existingValueHostConfigs);
    }

    private _valueHostManager: WeakRef<IValueHostsManager>;
    private _existingValueHostConfigs: WeakRef<Map<string, ValueHostConfig>>;

    public dispose(): void {
        super.dispose();
        this._valueHostManager = undefined!;
        this._existingValueHostConfigs = undefined!;
    }

    /**
     * Gets the ValueHostConfig from the originating manager.
     * @param valueHostName 
     * @param throwWhenNotFound 
     * @returns 
     */
    protected getExistingValueHostConfig(valueHostName: string, throwWhenNotFound: boolean): ValueHostConfig | null
    {
        let result = this._existingValueHostConfigs.deref()?.get(valueHostName);
        if (result)
            return result;
        if (throwWhenNotFound)
            throw new CodingError(`ValueHost name "${valueHostName}" is not defined.`);
        // istanbul ignore next   // currently no code passes in false for throwWhenNotFound
        return null;
    }

    /**
     * Completes the process by using ValueHostManager.addOrMergeValueHost()
     * on each entry supplied. That function internally uses ValueHostsConfigMergeService 
     * when the ValueHost exists. 
     * After this function completes, this instance has been disposed (via dispose() function)
     * and the instance should not be used further.
     * Any reference to a ValueHost instance that you have must be abandoned and a fresh
     * instance retrieved, as your reference was disposed.
     */
    public apply(): void
    {
        let valueHostManager = this._valueHostManager.deref();;
        if (valueHostManager) { 
            this.baseConfig.valueHostConfigs.forEach((vhConfig) => {
                valueHostManager.addOrMergeValueHost(vhConfig, null);
            });
        }
        this.dispose();
    }

    protected createFluent(): ValueHostsManagerStartFluent<T> {
        return new ValueHostsManagerStartFluent<T>(null);
    }
    

    /**
     * Update a specific valueHost's properties. Utility for subclass to introduce
     * a ValueHostType specific implementation, such as updateInput and updateStatic.
     * @param valueHostName 
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */
    protected updateValueHost<TValueHostConfig extends ValueHostConfig>(valueHostType: ValueHostType, valueHostName: string, propsToUpdate: Partial<TValueHostConfig>):
        ValueHostsManagerConfigBuilderBase<T> {
        assertNotNull(propsToUpdate, 'propsToUpdate');
        // a bit of defense against data that may hurt us
        let noChangeNames = this.services.valueHostConfigMergeService.getNoChangePropertyNames();   // note: internally caches the result
        noChangeNames.forEach((propName) => delete (propsToUpdate as any)[propName]);

        let vhConfig = this.getExistingValueHostConfig(valueHostName, true);
        this.assertValueHostType(vhConfig, valueHostType);
        this.applyConfig({ ...propsToUpdate, valueHostType: valueHostType, name: valueHostName });
        return this;
    }
    private _cacheNoChangePropertyNames: Array<string> | undefined = undefined;

    /**
     * Update an StaticValueHost with the StaticValueHostConfig properties supplied.
     * Not supported: 'valueHostType', 'name'
     * @param valueHostName 
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */
    public updateStatic(valueHostName: string, propsToUpdate: Partial<Omit<StaticValueHostConfig, 'valueHostType' | 'name'>>): 
        ValueHostsManagerConfigBuilderBase<ValueHostsManagerConfig>
    {
        return this.updateValueHost<StaticValueHostConfig>(ValueHostType.Static, valueHostName, propsToUpdate);
    }

    /**
     * Update an CalcValueHost with the CalcValueHostConfig properties supplied.
     * Not supported: 'valueHostType', 'name'
     * @param valueHostName 
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */
    public updateCalc(valueHostName: string, propsToUpdate: Partial<Omit<CalcValueHostConfig, 'valueHostType' | 'name'>>): 
        ValueHostsManagerConfigBuilderBase<ValueHostsManagerConfig>
    {
        return this.updateValueHost<CalcValueHostConfig>(ValueHostType.Calc, valueHostName, propsToUpdate);
    }    
}