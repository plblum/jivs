/**
 * Base implementation for Conditions that get a values from two ValueHostNames.
 * The Config introduces secondValueHostName.
 * @module Conditions/AbstractClasses/TwoValueConditionBase
 */


import { ValueHostName } from "../DataTypes/BasicTypes";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { IMessageTokenSource, TokenLabelAndValue } from "../Interfaces/MessageTokenSource";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { OneValueConditionConfig, OneValueConditionBase } from "./OneValueConditionBase";

/**
 * For conditions where it takes 2 values to evaluate properly, like
 * when comparing the values of two properties.
 */
export interface TwoValueConditionConfig extends OneValueConditionConfig {
    /**
     * ValueHostName to retrieve a ValueHost that will be the source
     * of another value for the evaluate() method.
     */
    secondValueHostName: string | null;
}

/**
 * Base implementation of ICondition with TwoValueConditionConfig.
 * The Config introduces secondValueHostName.
 *  Supports tokens: {SecondLabel}, the label from the second value host.
 */
export abstract class TwoValueConditionBase<TConfig extends TwoValueConditionConfig> extends OneValueConditionBase<TConfig>
    implements IMessageTokenSource
{
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        super.gatherValueHostNames(collection, valueHostResolver);
        if (this.config.secondValueHostName)
            collection.add(this.config.secondValueHostName);
    }

    public getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate
        let secondLabel: string | null = null;
        if (this.config.secondValueHostName) {
            let vh = this.getValueHost(this.config.secondValueHostName, valueHostResolver);
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