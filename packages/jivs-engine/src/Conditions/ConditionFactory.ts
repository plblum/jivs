/**
 * For creating Conditions given an ConditionConfig.
 * Setup its instance on ValidationServices.ConditionFactory.
 * @module Conditions/ConcreteClasses/ConditionFactory
 */
import { NameToFunctionMapper } from '../Utilities/NameToFunctionMap';
import type { ConditionConfig, ICondition, IConditionCore, IConditionFactory } from '../Interfaces/Conditions';
import { CodingError } from '../Utilities/ErrorHandling';
import { IDisposable } from '../Interfaces/General_Purpose';
import { cleanString } from '../Utilities/Utilities';

//#region ConditionFactory


/**
 * Creates instances of Conditions given an ConditionConfig.
 * Setup its instance on ValidationServices.ConditionFactory.
 * ConditionConfig.conditionType is used to determine the Condition class to create.
 * Supports IConditionCore implementations of ICondition.
 */
export class ConditionFactory implements IConditionFactory, IDisposable {

    public dispose(): void {
        (this._map as any) = undefined;
    }
    /**
     * Create an instance of a Condition from the ConditionConfig.
     * @param config 
     * @returns 
     */
    public create<TConfig extends ConditionConfig>
        (config: TConfig): IConditionCore<TConfig> {
        let ct = cleanString(config.conditionType);
        if (!ct)
            throw new CodingError('conditionType property not assigned in ConditionConfig');
        let fn = this._map.get(ct);
        if (fn)
            return fn(config) as IConditionCore<TConfig>;
        if (this.ensureLazyLoaded())
            // try again
            return this.create(config);
        throw new CodingError(`ConditionType not registered: ${config.conditionType}`);
    }
    // user supplies JSON string or object implementing ConditionConfig
    // and it returns an instance of IValidator.

    private readonly _map = new NameToFunctionMapper<ConditionConfig, ICondition>();
    // NameToFunctionMapper tracks conditiontypes case insensitively
    // We also need to track the original case of the conditionType
    // to reveal the real name when the user asks for it.
    private readonly _registeredNames: Set<string> = new Set<string>();

    /**
     * Add or replace a function to create an instance of the Condition
     * given a ConditionConfig.
     * @param conditionType - Unique way to select the function. Uses ConditionConfig.conditionType.
     * @param fn - Expected to create an instance of a Condition.
     */
    public register<TConfig extends ConditionConfig>(conditionType: string,
        fn: (config: TConfig) => IConditionCore<TConfig>): void {
        let ct = cleanString(conditionType);
        if (!ct)
            throw new CodingError('conditionType not assigned');
        this._map.register(conditionType, fn as any);
        this._registeredNames.add(ct);
    }

    /**
     * Utility to determine if a ConditionType has been registered.
     * @param conditionType 
     * @returns 
     */
    public isRegistered(conditionType: string): boolean {
        return this._map.get(conditionType) !== undefined;
    }

    /**
     * Helper to see if the conditionType value is registered even
     * when its case is different or it has whitespace that needs trimming.
     * @param conditionType 
     * @returns The real name of the conditionType or null if not found.
     */
    public findRealName(conditionType: string): string | null {
        let ct = cleanString(conditionType);
        if (!ct)
            return null;
        // _registeredNames needs to be searched
        // with the same as the user supplied
        let lcCT = ct.toLowerCase();
        for (let key of this._registeredNames.keys()) {
            if (key.toLowerCase() === lcCT)
                return key;
        }

        return null;
    }

    /**
     * Sets up a function to lazy load the configuration when the localize() function 
     * tries and fails to match a request.
     */
    public set lazyLoad(fn: (factory: ConditionFactory) => void)
    {
        this._lazyLoader = fn;
    }
    private _lazyLoader: null | ((factory: ConditionFactory) => void) = null;

    /**
     * Runs the lazyload function if setup and returns true if run.
     * @returns 
     */
    protected ensureLazyLoaded(): boolean
    {
        if (this._lazyLoader) {
            // prevent recursion by disabling the feature right away
            let fn = this._lazyLoader;
            this._lazyLoader = null;
            fn(this);
            return true;
        }
        return false;
    }

}

//#endregion ConditionFactory