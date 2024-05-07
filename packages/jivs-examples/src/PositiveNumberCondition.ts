import { ConditionFactory } from '@plblum/jivs-engine/build/Conditions/ConditionFactory';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
// Example: Introduce a new Condition class, including support for fluent syntax

// Here are the activities for creating a Condition class.
// 1. Choose a name, usually with the suffix "Condition".
// 2. Define its ConditionType, which is a string that is different from existing ConditionTypes.
// 3. Create your Configuration object interface, inheriting from an existing Configuration.
// 4. Create your class, inheriting from an existing Condition class.
// 5. Write unit tests. See the companion file in the Tests folder.
// 6. Extend the fluent syntax by using TypeScript Declaration Merging on types:
//    FluentValidatorCollector, FluentConditionCollector, and ConditionType.

import { OneValueConditionBase, OneValueConditionBaseConfig } from "@plblum/jivs-engine/build/Conditions/OneValueConditionBase";
import { ValueHostName } from "@plblum/jivs-engine/build/DataTypes/BasicTypes";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ConditionEvaluateResult, ConditionCategory } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { ComparersResult } from "@plblum/jivs-engine/build/Interfaces/DataTypeComparerService";
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { IValueHost } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostResolver } from "@plblum/jivs-engine/build/Interfaces/ValueHostResolver";
import {
    FluentConditionCollector, FluentValidatorCollector, FluentValidatorConfig,
    finishFluentConditionCollector, finishFluentValidatorCollector
} from "@plblum/jivs-engine/build/ValueHosts/Fluent";

export const positiveNumberConditionType = 'PositiveNumber';    // we'll extend Jivs ConditionType enum with this

export interface PositiveNumberConditionConfig extends OneValueConditionBaseConfig
{
}
/**
 * Condition requires that the number supplied is always greater than 0.
 * It only evaluates a Number supplied as a value, returning Match for
 * it being greater than today, NoMatch for today or less, and Undetermined if
 * it does not get a number.
 */
export class PositiveNumberCondition extends OneValueConditionBase<PositiveNumberConditionConfig>
{
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.getValue();
        if (typeof value === 'number') {
            let comparison = valueHostResolver.services.dataTypeComparerService.compare(
                value, 0,
                LookupKey.Number, LookupKey.Number);  
            if (comparison === ComparersResult.GreaterThan)
                return ConditionEvaluateResult.Match;
            return ConditionEvaluateResult.NoMatch;                
        }
        return ConditionEvaluateResult.Undetermined;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}

// TypeScript Declaration Merging with FluentValidatorCollector and FluentConditionCollector
declare module "@plblum/jivs-engine/build/ValueHosts/Fluent"
{
    export interface FluentValidatorCollector {
        positiveNumber(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
    }
    export interface FluentConditionCollector {
        positiveNumber(valueHostName?: ValueHostName): FluentConditionCollector;
    }
}
// TypeScript Declaration Merging with ConditionType
declare module "@plblum/jivs-engine/build/Conditions/ConditionTypes"
{
    export enum ConditionType
    {
        PositiveNumber = positiveNumberConditionType
    }
}
/**
 * Common code to setup PositiveNumberConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCPositiveNumber(): PositiveNumberConditionConfig {
    return {} as PositiveNumberConditionConfig;
}

function positiveNumberForCondition(valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        positiveNumberConditionType, _genDCPositiveNumber(), valueHostName);
}
function positiveNumberForValidator(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {    
    return finishFluentValidatorCollector(this,
        positiveNumberConditionType, _genDCPositiveNumber(),
        errorMessage, validatorParameters);
}

FluentValidatorCollector.prototype.positiveNumber = positiveNumberForValidator;
FluentConditionCollector.prototype.positiveNumber = positiveNumberForCondition;

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerPositiveNumberCondition(validationServices: IValidationServices): void
{
    let cf = validationServices.conditionFactory as ConditionFactory;
    // or move just this line into registerDataTypeCheckGenerators() function     
    cf.register<PositiveNumberConditionConfig>(ConditionType.PositiveNumber, (config) => new PositiveNumberCondition(config)); 
}
