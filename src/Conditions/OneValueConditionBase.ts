/**
 * Base implementation for Conditions that get a value from a single ValueHostId.
 * The Descriptor introduces ValueHostId.
 * @module Conditions/AbstractClasses/OneValueConditionBase
 */
import { ValueHostId } from '../DataTypes/BasicTypes';
import { ConditionDescriptor } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionBase } from './ConditionBase';



/**
 * Base implementation of ICondition with OneValueConditionDescriptor.
 * The Descriptor introduces ValueHostId.
 */
export abstract class OneValueConditionBase<TConditionDescriptor extends OneValueConditionDescriptor>
    extends ConditionBase<TConditionDescriptor>
{
    constructor(descriptor: TConditionDescriptor) {
        super(descriptor);
    }

    /**
     * Supports evaluate() implementations by checking the valueHost passed in is setup
     * and if not, supplying one identified by ConditionDescriptor.valueHostId.
     * ConditionDescriptor.valueHostId takes precidence over the valueHost passed in.
     * @param valueHost 
     * @param valueHostResolver 
     * @returns 
     */
    protected ensurePrimaryValueHost(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): IValueHost   // IValueHost
    {
        if (this.descriptor.valueHostId) {
            valueHost = this.getValueHost(this.descriptor.valueHostId, valueHostResolver);
            if (!valueHost)
                this.logInvalidPropertyData('valueHostId', 'valueHostId is unknown', valueHostResolver);
        }
        if (valueHost)
            return valueHost;
        throw new Error('Missing value for valueHostId.');
    }
    protected getValueHost(valueHostId: ValueHostId, valueHostResolver: IValueHostResolver): IValueHost | null {
        return valueHostResolver.getValueHost(valueHostId);
    }

    public gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void {
        if (this.descriptor.valueHostId)
            collection.add(this.descriptor.valueHostId);
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
     * Assign this to a ValueHostId if you want to have it looked up in the ValueHostsManager.getValueHost().
     * 
     * Typically leave InputValidator.ConditionDescriptor.valueHostId null
     * because Condition.evaluate() is passed the correct valueHost.
     * However, InputValidator.EnablerDescriptor needs it assigned.
     * Same with any Condition that is a child of another, like in MultiConditions.
     * 
     * Many conditions need two or more sources for values.
     * They are expected to create more ValueHostId properties in their 
     * ConditionDescriptor, where the remaining Properties are identified.
     */
    valueHostId: string | null;

}


/**
 * For conditions where it takes 2 values to evaluate properly, like
 * when comparing the values of two properties.
 */
export interface TwoValueConditionDescriptor extends OneValueConditionDescriptor {
    /**
     * ValueHostId to retrieve a ValueHost that will be the source
     * of another value for the evaluate() method.
     */
    secondValueHostId: string | null;
}