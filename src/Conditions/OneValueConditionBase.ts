/**
 * Base implementation for Conditions that get a value from a single ValueHostId.
 * The Descriptor introduces ValueHostId.
 * @module Conditions/OneValueConditionBase
 */
import { ValueHostId } from "../DataTypes/BasicTypes";
import { IConditionDescriptor } from "../Interfaces/Conditions";
import { IValueHost } from "../Interfaces/ValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { ConditionBase } from "./ConditionBase";



/**
 * Base implementation of ICondition with IOneValueConditionDescriptor.
 * The Descriptor introduces ValueHostId.
 */
export abstract class OneValueConditionBase<TConditionDescriptor extends IOneValueConditionDescriptor>
    extends ConditionBase<TConditionDescriptor>
{
    constructor(descriptor: TConditionDescriptor) {
        super(descriptor);
    }

    /**
     * Supports Evaluate implementations by checking the valueHost passed in is setup
     * and if not, supplying one identified by ConditionDescriptor.ValueHostId.
     * ConditionDescriptor.ValueHostId takes precidence over the valueHost passed in.
     * @param valueHost 
     * @param valueHostResolver 
     * @returns 
     */
    protected EnsurePrimaryValueHost(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): IValueHost   // IValueHost
    {
        if (this.Descriptor.ValueHostId) {
            valueHost = this.GetValueHost(this.Descriptor.ValueHostId, valueHostResolver);
            if (!valueHost)
                this.LogInvalidPropertyData('ValueHostId', 'ValueHostId is unknown', valueHostResolver);
        }
        if (valueHost)
            return valueHost;
        throw new Error('Missing value for ValueHostId.');
    }
    protected GetValueHost(valueHostId: ValueHostId, valueHostResolver: IValueHostResolver): IValueHost | null {
        return valueHostResolver.GetValueHost(valueHostId);
    }

    public GatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void {
        if (this.Descriptor.ValueHostId)
            collection.add(this.Descriptor.ValueHostId);
    }
}

/**
 * Base conditionDescriptor for Conditions that need to get a value from a ValueHost.
 */
export interface IOneValueConditionDescriptor extends IConditionDescriptor {
    /**
     * One source for the value to evaluate.
     * By design, Condition.Evaluate takes a valueHost object, allowing the caller 
     * to simply pass in the value.
     * Leave this null to use that valueHost object.
     * 
     * Assign this to a ValueHostId if you want to have it looked up in the ValueHostsManager.GetValueHost.
     * 
     * Typically leave InputValidator.ConditionDescriptor.ValueHostId null
     * because Condition.Evaluate is passed the correct valueHost.
     * However, InputValidator.EnablerDescriptor needs it assigned.
     * Same with any Condition that is a child of another, like in MultiConditions.
     * 
     * Many conditions need two or more sources for values.
     * They are expected to create more ValueHostId properties in their 
     * ConditionDescriptor, where the remaining Properties are identified.
     */
    ValueHostId: string | null;

}


/**
 * For conditions where it takes 2 values to evaluate properly, like
 * when comparing the values of two properties.
 */
export interface ITwoValueConditionDescriptor extends IOneValueConditionDescriptor {
    /**
     * ValueHostId to retrieve a ValueHost that will be the source
     * of another value for the Evaluate method.
     */
    SecondValueHostId: string | null;
}