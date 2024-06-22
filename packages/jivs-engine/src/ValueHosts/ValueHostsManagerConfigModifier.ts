/**
 * Used by ValueHostManager.startModifying() function to modify the ValueHostsManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * It makes changes through ValueHostsManager.addOrMergeValueHost().
 * @module ValueHosts/ConcreteClasses/ValueHostsManagerConfigModifier
 */

import { FluentStaticParameters, ValueHostsManagerStartFluent } from "./Fluent";
import { IValueHostsManager, ValueHostsManagerConfig } from "../Interfaces/ValueHostsManager";
import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { ManagerConfigBuilderBase } from "./ManagerConfigBuilderBase";
import { CalcValueHostConfig, CalculationHandler } from "../Interfaces/CalcValueHost";
import { StaticValueHostConfig } from "../Interfaces/StaticValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { ValueHostConfig } from "../Interfaces/ValueHost";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { deepClone, isPlainObject } from "../Utilities/Utilities";
import { IManagerConfigModifier } from "../Interfaces/ManagerConfigModifier";

/**
 * Used by ValueHostManager.startModifying() function to modify the ValueHostsManagerConfig.valueHostConfigs array.
 * It does not change the original until you call its apply() function.
 * Apply() makes its updates through ValueHostsManager.addOrMergeValueHost().
 */
export class ValueHostsManagerConfigModifier<T extends ValueHostsManagerConfig>
    extends ManagerConfigBuilderBase<T> implements IManagerConfigModifier<T> {
    /**
     * Expected to be called internally by ValueHostsManager/ValidationManager, which supplies
     * the current ValueHostsConfig object. It will be cloned, and not modified directly.
     * @param valueHostManager
     */
    constructor(valueHostManager: IValueHostsManager, existingValueHostConfigs: Map<string, ValueHostConfig>) {
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
    protected getExistingValueHostConfig(valueHostName: string, throwWhenNotFound: boolean): ValueHostConfig | null {
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
    public apply(): void {
        let valueHostManager = this._valueHostManager.deref();;
        if (valueHostManager) {
            this.baseConfig.valueHostConfigs.forEach((vhConfig) => {
                valueHostManager.addOrMergeValueHost(vhConfig, null);
            });
        }
        this.dispose();
    }

    protected createFluent(): ValueHostsManagerStartFluent {
        return new ValueHostsManagerStartFluent(null, this.services);
    }
    

    /**
     * Confirms the config is of the expected type.
     * Update a specific valueHost's properties.
     * @param valueHostName 
     */
    protected ensureCorrectValueHostConfig<TValueHostConfig extends ValueHostConfig>(valueHostType: ValueHostType, valueHostName: string,
        arg1: any, arg2: any, arg3: any): Partial<TValueHostConfig> {
        // figure out where the properties to update object is amongst the arguments
        let propsToUpdate: Partial<TValueHostConfig> | null = null;
        if (isPlainObject(arg1))
            propsToUpdate = arg1;
        else if (isPlainObject(arg2))
            propsToUpdate = arg2;
        else if (isPlainObject(arg3))
            propsToUpdate = arg3;
        if (!propsToUpdate) {
            // without any objects, the second parameter must be either null, undefined, or a string for data type
            if (arg2 === null || arg2 === undefined || typeof arg2 === 'string')
                return {} as TValueHostConfig;
            throw new CodingError('Second parameter must be dataType or ValueHostConfig object.');
        }

        propsToUpdate = deepClone(propsToUpdate);
        // a bit of defense against data that may hurt us
        let noChangeNames = this.services.valueHostConfigMergeService.getNoChangePropertyNames();   // note: internally caches the result
        noChangeNames.forEach((propName) => delete (propsToUpdate as any)[propName]);

        // prevent changing the valueHostType of existing valueHost
        let vhConfig = this.getExistingValueHostConfig(valueHostName, false);
        if (vhConfig)
            this.assertValueHostType(vhConfig, valueHostType as ValueHostType);
        return propsToUpdate!;
    }

    protected identifyValueHostName(arg: ValueHostName | ValueHostConfig): string {
        if (typeof arg === 'string')
            return arg;
        if (isPlainObject(arg) && 'name' in arg)
            return arg.name;
        throw new CodingError('ValueHost name could not be identified.');
    }

    /**
     * Utility for calls to existing static(), input(), calc(), and property() functions
     * that provide defenses against bad data.
     * @param arg1 
     * @param arg2 
     * @param parameters 
     * @returns 
     */
    protected prepUpdateValueHostParameters(valueHostType: ValueHostType, arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, parameters?: FluentStaticParameters): {
        valueHostName: string,
        dataType: string | undefined,
        propsToUpdate: Partial<StaticValueHostConfig>
    }
    {
        assertNotNull(arg1, 'arg1');

        let valueHostName = this.identifyValueHostName(arg1);
        let propsToUpdate = this.ensureCorrectValueHostConfig(valueHostType, valueHostName, arg1, arg2, parameters);
        let dataType: string | undefined = undefined;
        if (propsToUpdate.dataType)
            dataType = propsToUpdate.dataType;
        else if (typeof arg2 === 'string')
            dataType = arg2;
        return { valueHostName, dataType, propsToUpdate };
    }

    /**
     * On update, need some defenses against incoming data.
     * @param arg1 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    public static(arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, arg3?: FluentStaticParameters): ManagerConfigBuilderBase<T> {
        let { valueHostName, dataType, propsToUpdate } = this.prepUpdateValueHostParameters(ValueHostType.Static, arg1, arg2, arg3);
        return super.static(valueHostName, dataType, propsToUpdate);
    }

    /**
     * On update, need some defenses against incoming data.
     * @param arg1 
     * @param dataType 
     * @param calcFn 
     * @returns 
     */
    public calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): ManagerConfigBuilderBase<T> {
        if (isPlainObject(arg1) && 'name' in (arg1 as CalcValueHostConfig))
        {
            let valueHostName = (arg1 as CalcValueHostConfig).name;
            let propsToUpdate = this.ensureCorrectValueHostConfig<ValueHostConfig>(ValueHostType.Calc, valueHostName, arg1, null, null) as CalcValueHostConfig;
            return super.calc(valueHostName, propsToUpdate.dataType, propsToUpdate.calcFn);
        }
        return super.calc(arg1 as string, dataType, calcFn!);
    }    
}