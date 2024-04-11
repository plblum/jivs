/**
 * Fluent syntax for ValueHosts and associated validation rules
 * used to build the ValueHostDescriptor (with all of its children) quickly
 * and susinctly. 
 * The user will start the fluent syntax with configInput or configNonInput.
 * Those will setup the descriptors for InputValueHost or NonInputValueHost
 * taking advantage of intellisense to expose the available properties
 * of the descriptor, which may be a subset of the original.
 * `configInput({ name: 'productName', dataType: 'String' })`
 * 
 * configInput fluently flows into defining the validation rules.
 * 
 * `configInput().condition1().condition2().condition3()`
 * 
 * Each condition class will define its fluent method based on its ConditionType name ("Required", "RegExp", etc).
 * They will use some TypeScript Declaration Merging magic to make their
 * class appear to be part of FluentValidationRule, a class that connects
 * the conditions to the initial InputValueHostDescriptor.
 * 
 * Those condition fluent methods have parameters that include:
 * - Strongly typed ConditionDescriptor without the need to assign the type property, as it is auto assigned.
 * - errorMessage or null for default from TextLocalizationService
 * - summaryMessage or null for default from TextLocalizationService
 * - severity or null for default
 * - enabler or null
 * However, not all validation rules are built around Descriptors. So there is one
 * for letting you attach a ConditionCreator function, like found on InputValidatorDescriptor.conditionCreator.
 * It is called 'custom' and defined here.
 * 
 * Jivs is designed to allow a replacement to its own conditions. Thus the Fluent system
 * allows replacing the FluentValidationRule class with one of your own.
 * Just register it with the global fluentValidationRuleFactory.
 * 
 * Fluent functions should look like this:
 * @example
 * export function fnname([any condition properties the user must provide], 
 *     conditionDescriptor: ConditionDescriptor, 
 *     errorMessage: string, 
 *     inputValidationParameters? : FluentInputValidationDescriptor) : FluentValidationRule
 * {
 *   if (this instanceof FluentValidationRule) {
 *       let condDescriptor = { ...conditionDescriptor as ConditionDescriptor };
 *    // finish the conditionDescriptor from parameters supplied.
 *       if (parameter != null)
 *          condDescriptor.propertyName = parameter;
 *       let ivDescriptor: InputValidatorDescriptor = inputValidationParameters ?
 *           { ...inputValidatorParameters as InputValidatorDescriptor } :
 *           { errorMessage: null };
 *       let self = this as FluentValidationRule;
 *       self.addValidationRule('Your Condition Type', condDescriptor, ivDescriptor);
 *       return self;
 *   }
 *   throw new FluentSyntaxRequiredError();
 * }
 * declare module "../../path to the condition class itself"
 * {
 *    export interface FluentValidationRule
 *    {
 * // same definition as the actual function
 *       fnname([any condition properties the user must provide], 
 *          conditionDescriptor: ConditionDescriptor, 
 *          errorMessage: string, 
 *          inputValidationParameters? : FluentInputValidationDescriptor) : FluentValidationRule
 *    }
 * }
 * FluentValidationRule.prototype.fnname = fnname;
 * 
 * @example
 * export function regExp(
 *     expression: string, caseInsensitive: boolean,
 *     conditionDescriptor: RegExpConditionDescriptor, 
 *     errorMessage: string, 
 *     inputValidationParameters? : FluentInputValidationDescriptor) : FluentValidationRule
 * {
 *   if (this instanceof FluentValidationRule) {
 *       let condDescriptor = { ...conditionDescriptor as RegExpConditionDescriptor };
 *    // finish the conditionDescriptor from parameters supplied.
 *       if (expression != null)
 *          condDescriptor.expressionAsString = expression;
 *       if (caseInsensitive)
 *          condDescriptor.caseInsensitive = true;
 *       let ivDescriptor: InputValidatorDescriptor = inputValidationParameters ?
 *           { ...inputValidatorParameters as InputValidatorDescriptor } :
 *           { errorMessage: null };
 *       if (errorMessage)
 *          ivDescriptor.errorMessage = errorMessage;
 *       let self = this as FluentValidationRule;
 *       self.addValidationRule('Your Condition Type', condDescriptor, ivDescriptor);
 *       return self;
 *   }
 *   throw new FluentSyntaxRequiredError();
 * }
 * declare module "../../@plblum/jivs-engine/build/src/conditions/concretecondition"
 * {
 *    export interface FluentValidationRule
 *    {
 * // same definition as the actual function
 *       regExp(expression: string, caseInsensitive: boolean,
 *          conditionDescriptor: RegExpConditionDescriptor, 
 *          errorMessage: string, 
 *          inputValidationParameters : FluentInputValidationDescriptor) : FluentValidationRule
 *    }
 * }
 * FluentValidationRule.prototype.regExp = regExp;
 * 
 * @module ValueHosts/ConcreteClasses/Fluent
 */

import { InputValidatorDescriptor } from './../Interfaces/InputValidator';
import { ConditionDescriptor, ICondition } from "../Interfaces/Conditions";
import { IInputValueHostDescriptorResolver, InputValueHostDescriptor } from "../Interfaces/InputValueHost";
import { NonInputValueHostDescriptor } from "../Interfaces/NonInputValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { assertNotNull } from "../Utilities/ErrorHandling";

/**
 * Fluent format to create a NonInputValueHostDescriptor.
 * This is the start of a fluent series. However, at this time, there are no further items in the series.
 * @param name - the ValueHost name
 * @param dataType - optional and can be null. The value for ValueHost.dataType.
 * @param parameters - optional. Any additional properties of a NonInputValueHostDescriptor.
 */
export function configNonInput(name: string, dataType?: string | null, parameters?: FluentNonInputParameters): NonInputValueHostDescriptor;
/**
 * Fluent format to create a NonInputValueHostDescriptor.
 * This is the start of a fluent series. However, at this time, there are no further items in the series.
 * @param descriptor - Supply the entire NonInputValueHostDescriptor. This is a special use case.
 * You can omit the type property.
 */
export function configNonInput(descriptor: Omit<NonInputValueHostDescriptor, 'type'>): NonInputValueHostDescriptor;
// overload resolution
export function configNonInput(arg1: string | NonInputValueHostDescriptor, dataType?: string | null, parameters?: FluentNonInputParameters): NonInputValueHostDescriptor
{
    assertNotNull(arg1, 'arg1');
    if (typeof arg1 === 'object')
        return { ...arg1 as NonInputValueHostDescriptor, type: ValueHostType.NonInput };
    if (typeof arg1 === 'string') {

        let descriptor: NonInputValueHostDescriptor = { type: ValueHostType.NonInput, name: arg1 };
        if (dataType)
            descriptor.dataType = dataType;
        if (parameters)
            descriptor = { ...parameters, ...descriptor };
    
        return descriptor;
    }
    throw new TypeError('Must pass valuehost name or NonInputValueHostDescriptor');
}
/**
 * For fluent configNonInput function.
 */
export type FluentNonInputParameters = Omit<NonInputValueHostDescriptor, 'type' | 'name' | 'dataType'>;

/**
 * Fluent format to create a InputValueHostDescriptor.
 * This is the start of a fluent series. Extend series with FluentValidatorRules like "required()".
 * @param name - the ValueHost name
 * @param dataType - optional and can be null. The value for ValueHost.dataType.
 * @param parameters - optional. Any additional properties of a InputValueHostDescriptor.
 */
export function configInput(name: string, dataType?: string | null, parameters?: FluentInputParameters): FluentValidationRule;
/**
 * Fluent format to create a InputValueHostDescriptor.
 * This is the start of a fluent series. However, at this time, there are no further items in the series.
 * @param descriptor - Supply the entire InputValueHostDescriptor. This is a special use case.
 * You can omit the type property.
 */
export function configInput(descriptor: FluentInputValueDescriptor): FluentValidationRule;
// overload resolution
export function configInput(arg1: string | FluentInputValueDescriptor, dataType?: string | null, parameters?: FluentInputParameters): FluentValidationRule
{
    assertNotNull(arg1, 'arg1');
    
    if (typeof arg1 === 'object') {
        let descriptor: InputValueHostDescriptor =
            { ...arg1 as InputValueHostDescriptor, type: ValueHostType.Input };
        if (!descriptor.validatorDescriptors)
            descriptor.validatorDescriptors = [];

        return new FluentValidationRule(descriptor);
    }
    if (typeof arg1 === 'string') {

        let descriptor: InputValueHostDescriptor =
            { type: ValueHostType.Input, name: arg1 } as InputValueHostDescriptor;
        if (dataType)
            descriptor.dataType = dataType;
        if (parameters)
            descriptor = { ...parameters, ...descriptor };
        if (!descriptor.validatorDescriptors)
            descriptor.validatorDescriptors = [];

        return new FluentValidationRule(descriptor);;
    }
    throw new TypeError('Must pass valuehost name or InputValueHostDescriptor');
}
/**
 * For fluent configInput function.
 */
export type FluentInputValueDescriptor = Omit<InputValueHostDescriptor, 'type' | 'validatorDescriptors'>;
export type FluentInputParameters = Omit<FluentInputValueDescriptor,  'name' | 'dataType'>;

/**
 * Interface for FluentValidationRules, so that user can switch to a different
 * system for condition generation. They will register their rule with the 
 * FluentValidationRuleFactory.singleton.
 */
export interface IFluentValidationRule extends IInputValueHostDescriptorResolver
{
    /**
     * For any implementation of a fluent function that works with FluentValidationRule.
     * It takes the parameters passed into that function (conditionDescriptor and inputvalidatordescriptor)
     * and assemble the final InputValidatorDescriptor, which it adds to the InputValueHostDescriptor.
     * @oaram conditionType - When not null, this will be assigned to conditionDescriptor for you.
     * @param conditionDescriptor - if null, expects inputValidatorDescriptor to supply either conditionDescriptor
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * @param errorMessage - optional error message. Will overwrite any from inputValidatorDescriptor if
     * supplied.
     * @param inputValidatorDescriptor - does not expect conditionDescriptor to be setup, but if it is, it
     * will be ignored.
     */
    addValidationRule(conditionType: string | null,
        conditionDescriptor: Partial<ConditionDescriptor> | null,
        errorMessage: string | null,
        inputValidatorDescriptor: InputValidatorDescriptor | undefined | null): void;
}
/**
 * This class will dynamically get fluent functions for each condition
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * Those functions will be located near the associated Descriptor class.
 * 
 */
export class FluentValidationRule implements IFluentValidationRule
{
    constructor(descriptor: InputValueHostDescriptor)
    {
        assertNotNull(descriptor, 'descriptor');
        if (!descriptor.validatorDescriptors)
            descriptor.validatorDescriptors = [];
        this._descriptor = descriptor;
    }
    /**
     * This is the value ultimately passed to the ValidationManager config.ValueHostDescriptors.
     */
    public get descriptor(): InputValueHostDescriptor
    {
        return this._descriptor;
    }
    private _descriptor: InputValueHostDescriptor;

    /**
     * For any implementation of a fluent function that works with FluentValidationRule.
     * It takes the parameters passed into that function (conditionDescriptor and inputvalidatordescriptor)
     * and assemble the final InputValidatorDescriptor, which it adds to the InputValueHostDescriptor.
     * @oaram conditionType - When not null, this will be assigned to conditionDescriptor for you.
     * @param conditionDescriptor - if null, expects inputValidatorDescriptor to supply either conditionDescriptor
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionDescriptor, assign them to conditionDescriptor.
     * @param errorMessage - optional error message. Will overwrite any from inputValidatorDescriptor if
     * supplied.
     * @param inputValidatorDescriptor - does not expect conditionDescriptor to be setup, but if it is, it
     * will be replaced when conditionDescriptor is not null.
     */
    public addValidationRule(conditionType: string | null,
        conditionDescriptor: Partial<ConditionDescriptor> | null,
        errorMessage: string | null,
        inputValidatorDescriptor: FluentInputValidatorDescriptor | undefined | null): void
    {
        let ivDesc: InputValidatorDescriptor = inputValidatorDescriptor ?
            { ...inputValidatorDescriptor as InputValidatorDescriptor } :
            { conditionDescriptor: null };
        if (errorMessage !== null)
            ivDesc.errorMessage = errorMessage;

        if (conditionDescriptor)
            ivDesc.conditionDescriptor = { ...conditionDescriptor as ConditionDescriptor };
        if (conditionType && ivDesc.conditionDescriptor)
            ivDesc.conditionDescriptor.type = conditionType;
        this.descriptor.validatorDescriptors?.push(ivDesc as InputValidatorDescriptor);
    }
}

/**
 * Factory that returns a new instance of IFluentValidationRule, with the class
 * defined as FluentValidationRule (which handles built-in conditions) unless
 * replaced by a call to register().
 */
export class FluentValidationRuleFactory
{
    constructor()
    {
        this._creator = (descriptor: InputValueHostDescriptor) => new FluentValidationRule(descriptor);
    }
    public create(descriptor: InputValueHostDescriptor): IFluentValidationRule
    {
        return this._creator(descriptor);
    }

    public register(creator: (descriptor: InputValueHostDescriptor) => IFluentValidationRule): void
    {
        assertNotNull(creator, 'creator');
        this._creator = creator;
    }
    private _creator: (descriptor: InputValueHostDescriptor) => IFluentValidationRule;

    /**
     * Unlike other factories, which are on ValidationServices. We wanted to avoid
     * passing the ValidationServices class into the entry point functions as our
     * intention is to keep the syntax small and simple.
     */
    public static singleton: FluentValidationRuleFactory = new FluentValidationRuleFactory();
}

/**
 * Targets fluent functions for conditions as their second parameter, hosting most of the 
 * properties needed for InputValidatorDescriptor
 */
export type FluentInputValidatorDescriptor = Omit<InputValidatorDescriptor, 'conditionDescriptor'>;

//#region custom validation rule
// This code shows an example of using TypeScript Declaration Merging to attach
// a fluent Condition function to FluentValidationRule class.
// https://www.typescriptlang.org/docs/handbook/declaration-merging.html
// All fluent Condition functions must expect 'this' to be a FluentValidationRule instance
// and must always return that same rule.

/**
 * The fluent function that allows the user to supply a conditionCreator function
 * instead of setting up a condition through a descriptor.
 * The actual code for our extension method. It will be associated with an interface declaration,
 * and assigned to the prototype of the FluentValidationRule class.
 * As an EXTENSION FUNCTION, it extends FluentValidationRule, and 
 * REQUIRES 'this' to be an instance of FluentValidationRule.
 */

export function customRule(conditionCreator: (requester: InputValidatorDescriptor) => ICondition | null,
    errorMessage: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule
{
    if (this instanceof FluentValidationRule) {
        let ivDescriptor: InputValidatorDescriptor = inputValidatorParameters ?
            { ...inputValidatorParameters as InputValidatorDescriptor, conditionDescriptor: null } :
            { conditionDescriptor: null}; 
        ivDescriptor.conditionCreator = conditionCreator;
        if (errorMessage)
            ivDescriptor.errorMessage = errorMessage;
        let self = this as FluentValidationRule;
        self.addValidationRule(null, null, errorMessage, ivDescriptor);
        return self;
    }
    throw new FluentSyntaxRequiredError();
}
export class FluentSyntaxRequiredError extends Error
{
    constructor(errorMessage: string = 'Call only when chaining with configInput function.')
    {
        super(errorMessage);
    }
}

/**
 * Make TypeScript associate the function with the class
 */

// interface that extends the class FluentValidationRule
export declare interface FluentValidationRule
{
    customRule(conditionCreator: (requester: InputValidatorDescriptor) => ICondition | null,
        errorMessage: string | null,
        inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidationRule | InputValidatorDescriptor;
}


/**
 * Make JavaScript associate the function with the class.
 */
FluentValidationRule.prototype.customRule = customRule;
//#endregion custom validation rule