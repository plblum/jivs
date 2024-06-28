import { CodingError } from "../Utilities/ErrorHandling";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { ConditionConfig, ICondition, ConditionCategory } from "../Interfaces/Conditions";
import { toIDisposable } from "../Interfaces/General_Purpose";
import { toIGatherValueHostNames } from "../Interfaces/ValueHost";
import { IValueHostsManager } from "../Interfaces/ValueHostsManager";
import { ConditionBase, ErrorResponseCondition } from "./ConditionBase";

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

    protected condition(valueHostsManager: IValueHostsManager): ICondition {
        if (!this._condition) {
            if (!this.config.childConditionConfig)
            {
                this.logInvalidPropertyData('childConditionConfig', 'must be assigned to a Condition', valueHostsManager);
                this._condition = new ErrorResponseCondition();
            }
            else
                this._condition = this.generateCondition(this.config.childConditionConfig, valueHostsManager.services);
        }
        return this._condition;
    }
    private _condition: ICondition | null = null;

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void
    {
        let condition = this.condition(valueHostsManager);

        toIGatherValueHostNames(condition)?.gatherValueHostNames(collection, valueHostsManager);
    }        
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Children;
    }
}