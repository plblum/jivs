/**
 * Base for Conditions that takes 2 values to evaluate properly, and the second 
 * value comes from another ValueHost identified in TwoValueConditionBaseConfig.secondValueHostName.
 * 
 * @module Conditions/AbstractClasses/TwoValueConditionBase
 */


import { IValidatorsValueHostBase } from "../Interfaces/ValidatorsValueHostBase";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { TokenLabelAndValue } from "../Interfaces/MessageTokenSource";
import { IValueHostsManager } from "../Interfaces/ValueHostsManager";
import { OneValueConditionBaseConfig, OneValueConditionBase } from "./OneValueConditionBase";

/**
 * ConditionConfig for TwoValueConditionBase
 */
export interface TwoValueConditionBaseConfig extends OneValueConditionBaseConfig {
    /**
     * ValueHostName to retrieve a ValueHost that will be the source
     * of another value for the evaluate() method.
     */
    secondValueHostName: string | null;
}

/**
 * Base Condition which takes 2 values to evaluate properly, and the second 
 * value comes from another ValueHost identified in TwoValueConditionBaseConfig.secondValueHostName.
 * 
 * Supports tokens: {SecondLabel}, the label from the second value host.
 */
export abstract class TwoValueConditionBase<TConfig extends TwoValueConditionBaseConfig> extends OneValueConditionBase<TConfig>
{
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void {
        super.gatherValueHostNames(collection, valueHostsManager);
        if (this.config.secondValueHostName)
            collection.add(this.config.secondValueHostName);
    }

    public getValuesForTokens(valueHost: IValidatorsValueHostBase, valueHostsManager: IValueHostsManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostsManager));
        // same order of precidence as in Evaluate
        let secondLabel: string | null = null;
        if (this.config.secondValueHostName) {
            let vh = this.getValueHost(this.config.secondValueHostName, valueHostsManager);
            if (vh)
                secondLabel = vh.getLabel();
        }
        list.push({
            tokenLabel: 'SecondLabel',
            associatedValue: secondLabel ?? '',
            purpose: 'label'
        });
        return list;
    }
}