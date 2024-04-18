/**
 * Base implementation for Conditions that get a value from a single ValueHostName.
 * The Config introduces valueHostName.
 * @module Conditions/AbstractClasses/OneValueConditionBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionBase } from './ConditionBase';

/**
 * Base implementation of ICondition with OneValueConditionConfig.
 * The Config introduces valueHostName.
 */
export abstract class OneValueConditionBase<TConditionConfig extends OneValueConditionConfig>
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
     * @param valueHostResolver 
     * @returns 
     */
    protected ensurePrimaryValueHost(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): IValueHost   // IValueHost
    {
        if (this.config.valueHostName) {
            valueHost = this.getValueHost(this.config.valueHostName, valueHostResolver);
            if (!valueHost)
                this.logInvalidPropertyData('valueHostName', 'valueHostName is unknown', valueHostResolver);
        }
        if (valueHost)
            return valueHost;
        throw new Error('Missing value for valueHostName.');
    }
    protected getValueHost(valueHostName: ValueHostName, valueHostResolver: IValueHostResolver): IValueHost | null {
        return valueHostResolver.getValueHost(valueHostName);
    }

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        if (this.config.valueHostName)
            collection.add(this.config.valueHostName);
    }
}

/**
 * Base conditionConfig for Conditions that need to get a value from a ValueHost.
 */
export interface OneValueConditionConfig extends ConditionConfig {
    /**
     * One source for the value to evaluate.
     * By design, Condition.evaluate() takes a valueHost object, allowing the caller 
     * to simply pass in the value.
     * Leave this null to use that valueHost object.
     * 
     * Assign this to a ValueHostName if you want to have it looked up in the ValueHostsManager.getValueHost().
     * 
     * Typically leave InputValidator.ConditionConfig.valueHostName null
     * because Condition.evaluate() is passed the correct valueHost.
     * However, InputValidator.EnablerConfig needs it assigned.
     * Same with any Condition that is a child of another, like in MultiConditions.
     * 
     * Many conditions need two or more sources for values.
     * They are expected to create more ValueHostName properties in their 
     * ConditionConfig, where the remaining Properties are identified.
     */
    valueHostName: ValueHostName | null;

}
