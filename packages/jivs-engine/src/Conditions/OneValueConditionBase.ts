/**
 * Base implementation for Conditions that get a value from a single ValueHostName.
 * The Descriptor introduces ValueHostName.
 * @module Conditions/AbstractClasses/OneValueConditionBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionDescriptor } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionBase } from './ConditionBase';



/**
 * Base implementation of ICondition with OneValueConditionDescriptor.
 * The Descriptor introduces ValueHostName.
 */
export abstract class OneValueConditionBase<TConditionDescriptor extends OneValueConditionDescriptor>
    extends ConditionBase<TConditionDescriptor>
{
    constructor(descriptor: TConditionDescriptor) {
        super(descriptor);
    }

    /**
     * Supports evaluate() implementations by checking the valueHost passed in is setup
     * and if not, supplying one identified by ConditionDescriptor.valueHostName.
     * ConditionDescriptor.valueHostName takes precidence over the valueHost passed in.
     * @param valueHost 
     * @param valueHostResolver 
     * @returns 
     */
    protected ensurePrimaryValueHost(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): IValueHost   // IValueHost
    {
        if (this.descriptor.valueHostName) {
            valueHost = this.getValueHost(this.descriptor.valueHostName, valueHostResolver);
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
        if (this.descriptor.valueHostName)
            collection.add(this.descriptor.valueHostName);
    }
}

/**
 * Base conditionDescriptor for Conditions that need to get a value from a ValueHost.
 */
export interface OneValueConditionDescriptor extends ConditionDescriptor {
    /**
     * One source for the value to evaluate.
     * By design, Condition.evaluate() takes a valueHost object, allowing the caller 
     * to simply pass in the value.
     * Leave this null to use that valueHost object.
     * 
     * Assign this to a ValueHostName if you want to have it looked up in the ValueHostsManager.getValueHost().
     * 
     * Typically leave InputValidator.ConditionDescriptor.valueHostName null
     * because Condition.evaluate() is passed the correct valueHost.
     * However, InputValidator.EnablerDescriptor needs it assigned.
     * Same with any Condition that is a child of another, like in MultiConditions.
     * 
     * Many conditions need two or more sources for values.
     * They are expected to create more ValueHostName properties in their 
     * ConditionDescriptor, where the remaining Properties are identified.
     */
    valueHostName: ValueHostName | null;

}


/**
 * For conditions where it takes 2 values to evaluate properly, like
 * when comparing the values of two properties.
 */
export interface TwoValueConditionDescriptor extends OneValueConditionDescriptor {
    /**
     * ValueHostName to retrieve a ValueHost that will be the source
     * of another value for the evaluate() method.
     */
    secondValueHostName: string | null;
}