/**
 * Base for Conditions that get a value from a ValueHost,
 * identified in OneValueConditionBase.valueHostName.
 * @module jivs-engine/Conditions/AbstractClasses/OneValueConditionBase
 */
import { CodingError } from '../Utilities/ErrorHandling';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig } from '../Interfaces/Conditions';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValidationManager } from '../Interfaces/ValidationManager';
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
     * Assign this to a ValueHostName if you want to have it looked up in the ValidationManager.getValueHost().
     * 
     * Typically leave Validator.ConditionConfig.valueHostName null
     * because Condition.evaluate() is passed the correct valueHost.
     * However, Validator.EnablerConfig needs it assigned.
     * Same with any Condition that is a child of another, like in ConditionWithChildrenBase.
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
     * @param validationManager 
     * @returns 
     */
    protected ensurePrimaryValueHost(valueHost: IValueHost | null, validationManager: IValidationManager): IValueHost   // IValueHost
    {
        if (this.config.valueHostName) {
            valueHost = this.getValueHost(this.config.valueHostName, validationManager);
            if (!valueHost) {
                this.throwInvalidPropertyData('valueHostName', 'is unknown', validationManager.services);
            }
        }
        if (valueHost)
            return valueHost;
        const error = new CodingError('Missing value for valueHostName.');
        this.logger(validationManager.services).error(error);
        // istanbul ignore next // never get here because logError throws, but TSC doesn't know that
        throw error;
    }
    protected getValueHost(valueHostName: ValueHostName, validationManager: IValidationManager): IValueHost | null {
        return validationManager.getValueHost(valueHostName);
    }

    public gatherValueHostNames(collection: Set<ValueHostName>, validationManager: IValidationManager): void {
        if (this.config.valueHostName)
            collection.add(this.config.valueHostName);
    }
}
