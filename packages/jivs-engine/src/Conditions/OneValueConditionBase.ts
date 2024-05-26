/**
 * Base for Conditions that get a value from a ValueHost,
 * identified in OneValueConditionBase.valueHostName.
 * @module Conditions/AbstractClasses/OneValueConditionBase
 */
import { CodingError } from '../Utilities/ErrorHandling';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ConditionBase } from './ConditionBase';


/**
 * ConditionConfig for OneValueConditionBase.
 */
export interface OneValueConditionBaseConfig extends ConditionConfig {
    /**
     * One source for the value to evaluate.
     * By design, Condition.evaluate() takes a valueHost object, allowing the caller 
     * to simply pass in the value.
     * Leave this null to use that valueHost object.
     * 
     * Assign this to a ValueHostName if you want to have it looked up in the ValueHostsManager.getValueHost().
     * 
     * Typically leave Validator.ConditionConfig.valueHostName null
     * because Condition.evaluate() is passed the correct valueHost.
     * However, Validator.EnablerConfig needs it assigned.
     * Same with any Condition that is a child of another, like in EvaluateChildConditionResultsBase.
     * 
     * Many conditions need two or more sources for values.
     * They are expected to create more ValueHostName properties in their 
     * ConditionConfig, where the remaining Properties are identified.
     */
    valueHostName: ValueHostName | null;

}

/**
 * Base for Conditions that get a value from a ValueHost,
 * identified in OneValueConditionBase.valueHostName.
 */
export abstract class OneValueConditionBase<TConditionConfig extends OneValueConditionBaseConfig>
    extends ConditionBase<TConditionConfig>
{
    constructor(config: TConditionConfig) {
        super(config);
    }

    /**
     * Supports evaluate() implementations by checking the valueHost passed in is setup
     * and if not, supplying one identified by ConditionConfig.valueHostName.
     * ConditionConfig.valueHostName takes precidence over the valueHost passed in.
     * @param valueHost 
     * @param valueHostsManager 
     * @returns 
     */
    protected ensurePrimaryValueHost(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): IValueHost   // IValueHost
    {
        if (this.config.valueHostName) {
            valueHost = this.getValueHost(this.config.valueHostName, valueHostsManager);
            if (!valueHost)
                this.logInvalidPropertyData('valueHostName', 'valueHostName is unknown', valueHostsManager);
        }
        if (valueHost)
            return valueHost;
        throw new CodingError('Missing value for valueHostName.');
    }
    protected getValueHost(valueHostName: ValueHostName, valueHostsManager: IValueHostsManager): IValueHost | null {
        return valueHostsManager.getValueHost(valueHostName);
    }

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void {
        if (this.config.valueHostName)
            collection.add(this.config.valueHostName);
    }
}
