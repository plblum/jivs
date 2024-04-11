/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentValidationRule and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import { FluentValidationRule, FluentSyntaxRequiredError, FluentInputValidatorDescriptor } from "src/ValueHosts/Fluent";
import { AllMatchConditionDescriptor, AnyMatchConditionDescriptor, CountMatchesConditionDescriptor, DataTypeCheckConditionDescriptor, EqualToConditionDescriptor, GreaterThanConditionDescriptor, GreaterThanOrEqualConditionDescriptor, LessThanConditionDescriptor, LessThanOrEqualConditionDescriptor, NotEqualToConditionDescriptor, NotNullConditionDescriptor, RangeConditionDescriptor, RegExpConditionDescriptor, RequiredTextConditionDescriptor, StringLengthConditionDescriptor, StringNotEmptyConditionDescriptor } from "./ConcreteConditions";
import { ConditionType } from "./ConditionTypes";
import { ValueHostName } from "src/DataTypes/BasicTypes";

// How TypeScript merges functions with the FluentValidationRule class
declare module "./../ValueHosts/Fluent"
{
    export interface FluentValidationRule {
        dataTypeCheck(
            conditionDescriptor: DataTypeCheckConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;

        regExp(
            expression: string, caseInsensitive: boolean,
            conditionDescriptor: RegExpConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;

        range(
            minimum: any, maximum: any,
            conditionDescriptor: RangeConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        equalToValue(
            secondValue: any,
            conditionDescriptor: EqualToConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionDescriptor: EqualToConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        notEqualToValue(
            secondValue: any,
            conditionDescriptor: NotEqualToConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        notEqualTo(
            secondValueHostName: ValueHostName,
            conditionDescriptor: NotEqualToConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        lessThanValue(
            secondValue: any,
            conditionDescriptor: LessThanConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionDescriptor: LessThanConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        lessThanOrEqualValue(
            secondValue: any,
            conditionDescriptor: LessThanOrEqualConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionDescriptor: LessThanOrEqualConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        greaterThanValue(
            secondValue: any,
            conditionDescriptor: GreaterThanConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionDescriptor: GreaterThanConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionDescriptor: GreaterThanOrEqualConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionDescriptor: GreaterThanOrEqualConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        stringLength(
            minimum: number | null, maximum: number | null,
            conditionDescriptor: StringLengthConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        all(
            conditionDescriptor: AllMatchConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        any(
            conditionDescriptor: AllMatchConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;        
        countMatches(
            conditionDescriptor: AllMatchConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;
        stringNotEmpty(
            conditionDescriptor: StringNotEmptyConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;        
        requiredText(
            conditionDescriptor: RequiredTextConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;        
        notNull(
            conditionDescriptor: NotNullConditionDescriptor,
            errorMessage: string,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule;        
        
    }
}

// How JavaScript sees the functions added to the FluentValidationRule class
FluentValidationRule.prototype.dataTypeCheck = dataTypeCheck;
FluentValidationRule.prototype.regExp = regExp;
FluentValidationRule.prototype.range = range;
FluentValidationRule.prototype.equalToValue = equalToValue;
FluentValidationRule.prototype.equalTo = equalTo;
FluentValidationRule.prototype.notEqualToValue = notEqualToValue;
FluentValidationRule.prototype.notEqualTo = notEqualTo;
FluentValidationRule.prototype.lessThanValue = lessThanValue;
FluentValidationRule.prototype.lessThan = lessThan;
FluentValidationRule.prototype.lessThanOrEqualValue = lessThanOrEqualValue;
FluentValidationRule.prototype.lessThanOrEqual = lessThanOrEqual;
FluentValidationRule.prototype.greaterThanValue = greaterThanValue;
FluentValidationRule.prototype.greaterThan = greaterThan;
FluentValidationRule.prototype.greaterThanOrEqualValue = greaterThanOrEqualValue;
FluentValidationRule.prototype.greaterThanOrEqual = greaterThanOrEqual;
FluentValidationRule.prototype.stringLength = stringLength;
FluentValidationRule.prototype.all = all;
FluentValidationRule.prototype.any = any;
FluentValidationRule.prototype.countMatches = countMatches;
FluentValidationRule.prototype.stringNotEmpty = stringNotEmpty;
FluentValidationRule.prototype.requiredText = requiredText;
FluentValidationRule.prototype.notNull = notNull;

// --- Actual fluent functions -------

export function dataTypeCheck(
    conditionDescriptor: DataTypeCheckConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as DataTypeCheckConditionDescriptor };
        this.addValidationRule(ConditionType.DataTypeCheck, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function regExp(
    expression: string, caseInsensitive: boolean,
    conditionDescriptor: RegExpConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as RegExpConditionDescriptor };
        if (expression != null)
            condDescriptor.expressionAsString = expression;
        if (caseInsensitive)
            condDescriptor.ignoreCase = true;

        this.addValidationRule(ConditionType.RegExp, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function range(
    minimum: any, maximum: any,
    conditionDescriptor: RangeConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as RangeConditionDescriptor };
        if (minimum != null)
            condDescriptor.minimum = minimum;
        if (maximum != null)
            condDescriptor.maximum = maximum;
        this.addValidationRule(ConditionType.RegExp, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function equalToValue(
    secondValue: any,
    conditionDescriptor: EqualToConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as EqualToConditionDescriptor };
        if (secondValue != null)
            condDescriptor.secondValue = secondValue;

        this.addValidationRule(ConditionType.EqualTo, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function equalTo(
    secondValueHostName: ValueHostName,
    conditionDescriptor: EqualToConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as EqualToConditionDescriptor };
        if (secondValueHostName != null)
            condDescriptor.secondValueHostName = secondValueHostName;

        this.addValidationRule(ConditionType.EqualTo, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function notEqualToValue(
    secondValue: any,
    conditionDescriptor: NotEqualToConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as NotEqualToConditionDescriptor };
        if (secondValue != null)
            condDescriptor.secondValue = secondValue;

        this.addValidationRule(ConditionType.NotEqualTo, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function notEqualTo(
    secondValueHostName: ValueHostName,
    conditionDescriptor: NotEqualToConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as NotEqualToConditionDescriptor };
        if (secondValueHostName != null)
            condDescriptor.secondValueHostName = secondValueHostName;

        this.addValidationRule(ConditionType.NotEqualTo, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function lessThanValue(
    secondValue: any,
    conditionDescriptor: LessThanConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as LessThanConditionDescriptor };
        if (secondValue != null)
            condDescriptor.secondValue = secondValue;

        this.addValidationRule(ConditionType.LessThan, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function lessThan(
    secondValueHostName: ValueHostName,
    conditionDescriptor: LessThanConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as LessThanConditionDescriptor };
        if (secondValueHostName != null)
            condDescriptor.secondValueHostName = secondValueHostName;

        this.addValidationRule(ConditionType.LessThan, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function lessThanOrEqualValue(
    secondValue: any,
    conditionDescriptor: LessThanOrEqualConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as LessThanOrEqualConditionDescriptor };
        if (secondValue != null)
            condDescriptor.secondValue = secondValue;

        this.addValidationRule(ConditionType.LessThanOrEqual, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionDescriptor: LessThanOrEqualConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as LessThanOrEqualConditionDescriptor };
        if (secondValueHostName != null)
            condDescriptor.secondValueHostName = secondValueHostName;

        this.addValidationRule(ConditionType.LessThanOrEqual, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function greaterThanValue(
    secondValue: any,
    conditionDescriptor: GreaterThanConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as GreaterThanConditionDescriptor };
        if (secondValue != null)
            condDescriptor.secondValue = secondValue;

        this.addValidationRule(ConditionType.GreaterThan, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function greaterThan(
    secondValueHostName: ValueHostName,
    conditionDescriptor: GreaterThanConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as GreaterThanConditionDescriptor };
        if (secondValueHostName != null)
            condDescriptor.secondValueHostName = secondValueHostName;

        this.addValidationRule(ConditionType.GreaterThan, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function greaterThanOrEqualValue(
    secondValue: any,
    conditionDescriptor: GreaterThanOrEqualConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as GreaterThanOrEqualConditionDescriptor };
        if (secondValue != null)
            condDescriptor.secondValue = secondValue;

        this.addValidationRule(ConditionType.GreaterThanOrEqual, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionDescriptor: GreaterThanOrEqualConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as GreaterThanOrEqualConditionDescriptor };
        if (secondValueHostName != null)
            condDescriptor.secondValueHostName = secondValueHostName;

        this.addValidationRule(ConditionType.GreaterThanOrEqual, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}
export function stringLength(
    minimum: number | null, maximum: number | null,
    conditionDescriptor: StringLengthConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as StringLengthConditionDescriptor };
        if (minimum != null)
            condDescriptor.minimum = minimum;
        if (maximum != null)
            condDescriptor.maximum = maximum;
        this.addValidationRule(ConditionType.StringLength, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function all(
    conditionDescriptor: AllMatchConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as AllMatchConditionDescriptor };

        this.addValidationRule(ConditionType.All, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function any(
    conditionDescriptor: AnyMatchConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as AnyMatchConditionDescriptor };

        this.addValidationRule(ConditionType.Any, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function countMatches(
    conditionDescriptor: CountMatchesConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as CountMatchesConditionDescriptor };

        this.addValidationRule(ConditionType.CountMatches, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function stringNotEmpty(
    conditionDescriptor: StringNotEmptyConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as StringNotEmptyConditionDescriptor };

        this.addValidationRule(ConditionType.StringNotEmpty, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function requiredText(
    conditionDescriptor: RequiredTextConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as RequiredTextConditionDescriptor };

        this.addValidationRule(ConditionType.RequiredText, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}

export function notNull(
    conditionDescriptor: NotNullConditionDescriptor,
    errorMessage: string,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let condDescriptor = { ...conditionDescriptor as NotNullConditionDescriptor };

        this.addValidationRule(ConditionType.NotNull, condDescriptor, errorMessage, inputValidatorParameters);
        return this;
    }
    throw new FluentSyntaxRequiredError();
}