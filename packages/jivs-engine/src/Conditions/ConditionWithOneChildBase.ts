/**
 * Base class for Conditions that have a single child condition.
 * 
 * @module jivs-engine/Conditions/AbstractClasses/ConditionWithOneChildBaseConfig
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionConfig, ICondition, ConditionCategory } from '../Interfaces/Conditions';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { toIGatherValueHostNames } from '../Interfaces/ValueHost';
import { IValidationManager } from '../Interfaces/ValidationManager';
import { ConditionBase, ErrorResponseCondition } from './ConditionBase';

/**
 * ConditionConfig for {@link ConditionWithOneChildBase}
 */
export interface ConditionWithOneChildBaseConfig extends ConditionConfig
{
    /**
     * The Config for condition to negate.
     */
    childConditionConfig: ConditionConfig;
}

/**
 * Base class for Conditions that have a single child condition.
 */
export abstract class ConditionWithOneChildBase<TConfig extends ConditionWithOneChildBaseConfig>
    extends ConditionBase<TConfig>
{

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        super.dispose();
        toIDisposable(this._condition)?.dispose();
        this._condition = undefined!;
    }    

    protected condition(validationManager: IValidationManager): ICondition {
        if (!this._condition) {
            this._condition = this.generateCondition(this.config.childConditionConfig, validationManager.services);
            if (this._condition instanceof ErrorResponseCondition) {
                this.throwInvalidPropertyData('childConditionConfig', 'must be assigned and configured correctly', validationManager.services);
            }
/*            
            if (!this.config.childConditionConfig) {
                this._condition = new ErrorResponseCondition();
                this.throwInvalidPropertyData('childConditionConfig', 'must be assigned to a Condition', validationManager.services);
            }
            else
                try {
                    this._condition = this.generateCondition(this.config.childConditionConfig, validationManager.services);
                }
                catch (e) {
                    this._condition = new ErrorResponseCondition();
                    throw e;
                }
*/                
        }
        return this._condition;
    }
    private _condition: ICondition | null = null;

    public gatherValueHostNames(collection: Set<ValueHostName>, validationManager: IValidationManager): void
    {
        const condition = this.condition(validationManager);

        toIGatherValueHostNames(condition)?.gatherValueHostNames(collection, validationManager);
    }        
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Children;
    }
}