
// Example: Introduce a new Condition class, including support for fluent syntax
// Our class will require even numbers. There is already a base class for numbers, NumberConditionBase,
// but we'll ignore it in favor of showing code in the evaluate function.

// Here are the activities for creating a Condition class.
// 1. Choose a name, usually with the suffix "Condition".
// 2. Define its ConditionType, which is a string that is different from existing ConditionTypes.
// 3. Create your Configuration object interface, inheriting from an existing Configuration.
// 4. Create your class, inheriting from an existing Condition class.
// 5. Write unit tests. See the companion file in the Tests folder.
// 6. Extend the fluent syntax by using TypeScript Declaration Merging on types:
//    FluentValidatorBuilder, FluentConditionBuilder.

import { OneValueConditionBase, OneValueConditionBaseConfig } from "@plblum/jivs-engine/build/Conditions/OneValueConditionBase";
import { ValueHostName } from "@plblum/jivs-engine/build/DataTypes/BasicTypes";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ConditionEvaluateResult, ConditionCategory } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { IValueHost } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import {
    FluentConditionBuilder, FluentValidatorBuilder, FluentValidatorConfig,
    finishFluentConditionBuilder, finishFluentValidatorBuilder
} from "@plblum/jivs-engine/build/ValueHosts/Fluent";
import { ConditionFactory } from '@plblum/jivs-engine/build/Conditions/ConditionFactory';
export const evenNumberConditionType = 'EvenNumber';    // we'll extend Jivs ConditionType enum with this

export interface EvenNumberConditionConfig extends OneValueConditionBaseConfig
{
}
/**
 * Condition requires an integer that is even to match. An integer that is odd does not match.
 * Any other value, including a decimal number is Undetermined.
 */
export class EvenNumberCondition extends OneValueConditionBase<EvenNumberConditionConfig>
{
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
        let value = valueHost.getValue();
        //#region  --- start optional lines
        // Give it the ability to get a number from an object that has a converter for a number.
        if (typeof value !== 'number') {
            value = valueHostsManager.services.dataTypeConverterService.convertUntilResult(value, null, LookupKey.Number);
            if (typeof value !== 'number')
                return ConditionEvaluateResult.Undetermined;
        }
        //#endregion  --- end optional lines

        if (value === Math.trunc(value))    // must be an integer
            return value % 2 === 0 ?
                ConditionEvaluateResult.Match :
                ConditionEvaluateResult.NoMatch;            
        
        return ConditionEvaluateResult.Undetermined;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}

// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerEvenNumberCondition(validationServices: IValidationServices): void
{
    let cf = validationServices.conditionFactory as ConditionFactory;
    // or move just this line into registerDataTypeCheckGenerators() function     
    cf.register<EvenNumberConditionConfig>(evenNumberConditionType, (config) => new EvenNumberCondition(config)); 
}


//#region Fluent syntax

// TypeScript Declaration Merging with FluentValidatorBuilder and FluentConditionBuilder
declare module "@plblum/jivs-engine/build/ValueHosts/Fluent"
{
    export interface FluentValidatorBuilder {
        evenNumber(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
    }
    export interface FluentConditionBuilder {
        evenNumber(valueHostName?: ValueHostName): FluentConditionBuilder;
    }
}

/**
 * Common code to setup EvenNumberConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCEvenNumber(): EvenNumberConditionConfig {
    return {} as EvenNumberConditionConfig;
}

function evenNumberForCondition(valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        evenNumberConditionType, _genDCEvenNumber(), valueHostName);
}
function evenNumberForValidator(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {    
    return finishFluentValidatorBuilder(this,
        evenNumberConditionType, _genDCEvenNumber(),
        errorMessage, validatorParameters);
}

FluentValidatorBuilder.prototype.evenNumber = evenNumberForValidator;
FluentConditionBuilder.prototype.evenNumber = evenNumberForCondition;
//#endregion fluent syntax