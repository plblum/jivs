/**
 * Fluent syntax for ValueHosts and associated validation rules
 * used to build the ValueHostDescriptor (with all of its children) quickly
 * and succinctly. 
 * The user will start the fluent syntax with configInput() or configNonInput().
 * Those will setup the descriptors for InputValueHost or NonInputValueHost
 * taking advantage of intellisense to expose the available properties
 * of the descriptor, which may be a subset of the original.
 * `configNonInput('productName')`
 * > configNonInput has no chained functions. Chaining is for validation.
 * 
 * `configInput('productName', { dataType: 'String' })`
 * 
 * configInput() fluently flows into defining the validation rules.
 * 
 * `configInput('productName').required().regExp('^\\d$')`
 * 
 * Each condition class will define its fluent method based on its ConditionType name ("requiredText", "regExp", etc).
 * They will use some TypeScript Declaration Merging magic to make their
 * class appear to be part of FluentValidatorCollector and FluentConditionCollector, classes that connect
 * the conditions to the InputValueHostDescriptor or EvaluateChildConditionResultsDescriptor.
 * 
 * - FluentValidatorCollector - Class at the top level of fluent series, coming from the call
 *   to configInput(). It creates both a conditionDescriptor and a hosting inputValidatorDescriptor,
 *   adding them to the InputValueHostDescriptor that is being created.
 * 
 * - FluentConditionCollector - Class used only within a condition that operates on nested conditions,
 *   like AllMatchCondition, AnyMatchCondition, and CountMatchesCondition. Their base descriptor
 *   is EvaluateChildConditionResultsDescriptor. It creates only a ConditionDescriptor,
 *   adding it to the array of ConditionDescriptors hosted in EvaluateChildConditionResultsDescriptor.
 * 
 * ## Creating your own fluent functions
 * Create two functions to support chaining to configInfo() and configChildren().
 * They are not exported, as they are used to modify the prototypes of other classes.
 * 
 * Fluent functions should look like this: 
 * @example
 * export type FluentRegExpConditionDescriptor = Omit<RegExpConditionDescriptor, 'type' | 'valueHostName' | 'expressionAsString' | 'expression' | 'ignoreCase'>;
 * 
 * function _genCDRegExp(
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionDescriptor?: FluentRegExpConditionDescriptor | null): RegExpConditionDescriptor {
 *     let condDescriptor: RegExpConditionDescriptor = (conditionDescriptor ? { ...conditionDescriptor } : {}) as RegExpConditionDescriptor;
 *     if (expression != null)
 *         if (expression instanceof RegExp)
 *             condDescriptor.expression = expression;
 *         else 
 *             condDescriptor.expressionAsString = expression;
 *     if (ignoreCase != null)
 *         condDescriptor.ignoreCase = ignoreCase;
 *     return condDescriptor as RegExpConditionDescriptor;
 * }
 * function regExp_forConfigInput(
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionDescriptor?: FluentRegExpConditionDescriptor | null,
 *     errorMessage?: string | null,
 *     inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
 *     return finishFluentValidatorCollector(this,
 *         ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionDescriptor),
 *         errorMessage, inputValidatorParameters);
 * }
 * function regExp_forConfigChildren(
 *     valueHostName: ValueHostName | null,
 *     expression: RegExp | string, ignoreCase?: boolean | null,
 *     conditionDescriptor?: FluentRegExpConditionDescriptor | null): FluentConditionCollector {
 *     return finishFluentConditionCollector(this,
 *         ConditionType.RegExp, valueHostName, _genCDRegExp(expression, ignoreCase, conditionDescriptor));
 * }
 * 
 * declare module "../../@plblum/jivs-engine/build/src/ValueHosts/fluent"
 * {
 *    export interface FluentValidatorCollector
 *    {
 * // same definition as the actual function, except use the name the user should enter in chaining
 *       regExp(expression: RegExp | string, ignoreCase?: boolean | null,
 *          conditionDescriptor?: FluentRegExpConditionDescriptor | null, 
 *          errorMessage?: string | null, 
 *          inputValidatorParameters : FluentInputValidationDescriptor) : FluentValidatorCollector
 *    }
 *    export interface FluentConditionCollector
 *    {
 * // same definition as the actual function, except use the name the user should enter in chaining
 *       regExp(expression: RegExp | string, ignoreCase?: boolean | null,
 *          conditionDescriptor?: FluentRegExpConditionDescriptor) : FluentConditionCollector
 *    } 
 * }
 * FluentValidatorCollector.prototype.regExp = regExp_forConfigInput;
 * FluentConditionCollector.prototype.regExp = regExp_forConfigChildren;
 * 
 * @module ValueHosts/Fluent
 * ## Switching to a different condition library
 *  
 * Jivs is designed to allow a replacement to its own conditions. Thus the fluent system
 * allows replacing the FluentValidatorCollector and FluentConditionCollector classes with your own.
 * Just register it with fluentFactory.singleton.register().
 */

import { InputValidatorDescriptor } from './../Interfaces/InputValidator';
import { ConditionDescriptor, ICondition } from "../Interfaces/Conditions";
import { IInputValueHostDescriptorResolver, InputValueHostDescriptor } from "../Interfaces/InputValueHost";
import { NonInputValueHostDescriptor } from "../Interfaces/NonInputValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { assertNotNull } from "../Utilities/ErrorHandling";
import { EvaluateChildConditionResultsDescriptor } from '../Conditions/EvaluateChildConditionResultsBase';
import { ValueHostName } from '../DataTypes/BasicTypes';
import { OneValueConditionDescriptor } from '../Conditions/OneValueConditionBase';

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
 * This is the start of a fluent series. Extend series with validation rules like "required()".
 * @param name - the ValueHost name
 * @param dataType - optional and can be null. The value for ValueHost.dataType.
 * @param parameters - optional. Any additional properties of a InputValueHostDescriptor.
 */
export function configInput(name: string, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector;
/**
 * Fluent format to create a InputValueHostDescriptor.
 * This is the start of a fluent series. However, at this time, there are no further items in the series.
 * @param descriptor - Supply the entire InputValueHostDescriptor. This is a special use case.
 * You can omit the type property.
 */
export function configInput(descriptor: FluentInputValueDescriptor): FluentValidatorCollector;
// overload resolution
export function configInput(arg1: string | FluentInputValueDescriptor, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector
{
    assertNotNull(arg1, 'arg1');
    
    if (typeof arg1 === 'object') {
        let descriptor: InputValueHostDescriptor =
            { ...arg1 as InputValueHostDescriptor, type: ValueHostType.Input };
        if (!descriptor.validatorDescriptors)
            descriptor.validatorDescriptors = [];

        return new FluentValidatorCollector(descriptor);
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

        return new FluentValidatorCollector(descriptor);;
    }
    throw new TypeError('Must pass valuehost name or InputValueHostDescriptor');
}
/**
 * For fluent configInput function.
 */
export type FluentInputValueDescriptor = Omit<InputValueHostDescriptor, 'type' | 'validatorDescriptors'>;
export type FluentInputParameters = Omit<FluentInputValueDescriptor, 'name' | 'dataType'>;
/**
 * Targets fluent functions for conditions as their second parameter, hosting most of the 
 * properties needed for InputValidatorDescriptor
 */
export type FluentInputValidatorDescriptor = Omit<InputValidatorDescriptor, 'conditionDescriptor'>;

/**
 * Start of a series to collect ConditionDescriptors into any condition that
 * implements EvaluateChildConditionResultsDescriptor.
 * For example, configInput('Field1').all(configChildren().required('Field2').required('Field3'))
 * The fluent function for all (and others that support EvaluateChildConditionResultsDescriptor)
 * will get a FluentConditionCollector whose conditionDescriptors collection is fully populated.
* @param descriptor - When null/undefined, the instance is created and the caller is expected
* to retrieve its conditionDescriptors from the descriptor property.
* When assigned, that instance gets conditionDescriptors populated and 
* there is no need to get a value from descriptors property.
 */
export function configChildren(descriptor?: EvaluateChildConditionResultsDescriptor): FluentConditionCollector
{
    let collector = new FluentConditionCollector(descriptor ?? null);
    return collector;
}

/**
 * Class that will get fluent functions attached
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html.
 * 
 * Those functions will treat their 'this' as FluentCollectorBase
 * and testing this for its subclasses, FluentValidatorCollector and FluentConditionCollector.
 * They will call the subclass's add() method to add to its collection.
 * See @link ValueHosts/Fluent
 */
export abstract class FluentCollectorBase
{
    constructor()
    {
    }
}

/**
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentValidatorCollector extends IInputValueHostDescriptorResolver
{
    /**
     * For any implementation of a fluent function that works with FluentValidatorCollector.
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
    add(conditionType: string | null,
        conditionDescriptor: Partial<ConditionDescriptor> | null,
        errorMessage: string | null | undefined,
        inputValidatorDescriptor: FluentInputValidatorDescriptor | undefined | null): void;
}

/**
 * This class will dynamically get fluent functions for each condition
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * Those functions will be located near the associated Descriptor class.
 */
export class FluentValidatorCollector extends FluentCollectorBase implements IFluentValidatorCollector
{
    constructor(descriptor: InputValueHostDescriptor)
    {
        super();
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
    public add(conditionType: string | null,
        conditionDescriptor: Partial<ConditionDescriptor> | null,
        errorMessage: string | null | undefined,
        inputValidatorDescriptor: FluentInputValidatorDescriptor | undefined | null): void
    {
        let ivDesc: InputValidatorDescriptor = inputValidatorDescriptor ?
            { ...inputValidatorDescriptor as InputValidatorDescriptor } :
            { conditionDescriptor: null };
        if (errorMessage != null)   // null or undefined
            ivDesc.errorMessage = errorMessage;

        if (conditionDescriptor)
            ivDesc.conditionDescriptor = { ...conditionDescriptor as ConditionDescriptor };
        if (conditionType && ivDesc.conditionDescriptor)
            ivDesc.conditionDescriptor.type = conditionType;
        this.descriptor.validatorDescriptors?.push(ivDesc as InputValidatorDescriptor);
    }
}

/**
 * Conditions that use EvaluateChildConditionResultsDescriptor (All, Any, CountMatches, etc)
 * use this to collect child conditions. This differs from FluentValidatorCollector
 * as it does not deal with InputValidatorDescriptors.
 * Yet the same fluent functions are used for both this and FluentValidatorCollector.
 * As a result, any parameters associated with InputValidatorDescriptor must be optional.
 * Use this when using alternative conditions, as you will need to provide substitutes
 * for each fluent function. Your class should be registered with FluentFactory.
 */
export interface IFluentConditionCollector
{
    /**
     * The descriptor that will collect the conditions.
     */
    descriptor: EvaluateChildConditionResultsDescriptor;

    /**
     * For any implementation of a fluent function that works with FluentConditionCollector.
     * It takes the parameters passed into that function
     * and assemble the final conditionDescriptor.
     * @oaram conditionType - When not null, this will be assigned to conditionDescriptor for you.
     * @param conditionDescriptor - If your fluent function supplies stand-alone parameters that belong
     * in conditionDescriptor, assign them to conditionDescriptor.
     */
    add(conditionType: string | null,
        conditionDescriptor: Partial<ConditionDescriptor>): void;
}

/**
 * This class will dynamically get fluent functions for each condition
 * by using TypeScript's Declaration Merging:
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * Those functions will be located near the associated Descriptor class.
 */
export class FluentConditionCollector extends FluentCollectorBase implements IFluentConditionCollector
{
    /**
     * 
     * @param descriptor null, the instance is created and the caller is expected
     * to retrieve its conditionDescriptors from the descriptor property.
     * When assigned, that instance gets conditionDescriptors populated and 
     * there is no need to get a value from descriptors property.
     */
    constructor(descriptor: EvaluateChildConditionResultsDescriptor | null)
    {
        super();
        if (!descriptor)
            descriptor = { conditionDescriptors: [], type: 'TBD' };
        if (!descriptor.conditionDescriptors)
            descriptor.conditionDescriptors = [];
        this._descriptor = descriptor;
    }
    /**
     * This is the value ultimately passed to the ValidationManager config.ValueHostDescriptors.
     */
    public get descriptor(): EvaluateChildConditionResultsDescriptor
    {
        return this._descriptor;
    }
    private _descriptor: EvaluateChildConditionResultsDescriptor;

    /**
     * For any implementation of a fluent function that works with FluentConditionCollector.
     * It takes the parameters passed into that function
     * and assemble the final conditionDescriptor.
     * @oaram conditionType - When not null, this will be assigned to conditionDescriptor for you.
     * @param conditionDescriptor - If your fluent function supplies stand-alone parameters that belong
     * in conditionDescriptor, assign them to conditionDescriptor.
     */
    public add(conditionType: string | null,
        conditionDescriptor: Partial<ConditionDescriptor>): void
    {
        assertNotNull(conditionDescriptor, 'conditionDescriptor');
        if (conditionType)
            conditionDescriptor.type = conditionType;
        this.descriptor.conditionDescriptors?.push(conditionDescriptor as ConditionDescriptor);
    }
}

/**
 * Call from within a fluent function once you have all parameters fully setup.
 * It will complete the setup.
 * @param thisFromCaller 
 * Should be a FluentValidatorCollector. Fluent function expects to pass its value
 * of 'this' here. However, its possible self is not FluentValidatorCollector.
 * We'll throw an exception here in that case.
 * @param conditionType 
 * @param conditionDescriptor 
 * @param errorMessage 
 * @param inputValidatorParameters 
 * @returns The same instance passed into the first parameter to allow for chaining.
 */
export function finishFluentValidatorCollector(thisFromCaller: any, 
    conditionType: string | null,
    conditionDescriptor: Partial<ConditionDescriptor>,
    errorMessage: string | null | undefined,
    inputValidatorParameters: FluentInputValidatorDescriptor | undefined | null): FluentValidatorCollector
{
    if (thisFromCaller instanceof FluentValidatorCollector) {
        thisFromCaller.add(conditionType, conditionDescriptor, errorMessage, inputValidatorParameters);
        return thisFromCaller;
    }
    throw new FluentSyntaxRequiredError();
}
/**
 * Call from within a fluent function once you have all parameters fully setup.
 * It will complete the setup.
 * @param thisFromCaller 
 * Should be a FluentConditionCollector. Fluent function expects to pass its value
 * of 'this' here. However, its possible self is not FluentConditionCollector.
 * We'll throw an exception here in that case.
 * @param conditionType 
 * @param valueHostName 
 * Overrides the default valueHostName, which comes from the configInput().
 * Fluent function should supply this as a parameter
 * so long as its ConditionDescriptor implements OneValueConditionDescriptor.
 * Since these conditions are children of another, they are more likely to
 * need the valueHostName than those in FluentValidatorCollectors.
 * @param conditionDescriptor 
 * @returns The same instance passed into the first parameter to allow for chaining.
 */
export function finishFluentConditionCollector(thisFromCaller: any, 
    conditionType: string | null,
    conditionDescriptor: Partial<ConditionDescriptor>,
    valueHostName?: ValueHostName): FluentConditionCollector
{
    if (thisFromCaller instanceof FluentConditionCollector) {
        if (valueHostName)
            (conditionDescriptor as OneValueConditionDescriptor).valueHostName = valueHostName;

        thisFromCaller.add(conditionType, conditionDescriptor);
        return thisFromCaller;
    }    
    throw new FluentSyntaxRequiredError();
}
/**
 * Factory that returns a new instance of IFluentValidatorCollector and IFluentConditionCollector.
 * By default, it supplies FluentValidatorCollector and FluentConditionCollector.
 * When you create alternative conditions, you will also reimplemnt 
 * IFluentValidatorCollector and IFluentConditionCollector and register them here.
 */
export class FluentFactory
{
    constructor()
    {
        this._validatorCollectorCreator = (descriptor: InputValueHostDescriptor) => new FluentValidatorCollector(descriptor);
        this._conditionCollectorCreator = (descriptor: EvaluateChildConditionResultsDescriptor) => new FluentConditionCollector(descriptor);
    }
    public createValidatorCollector(descriptor: InputValueHostDescriptor): IFluentValidatorCollector
    {
        return this._validatorCollectorCreator(descriptor);
    }

    public registerValidatorCollector(creator: (descriptor: InputValueHostDescriptor) => IFluentValidatorCollector): void
    {
        assertNotNull(creator, 'creator');
        this._validatorCollectorCreator = creator;
    }
    private _validatorCollectorCreator: (descriptor: InputValueHostDescriptor) => IFluentValidatorCollector;

    public createConditionCollector(descriptor: EvaluateChildConditionResultsDescriptor): IFluentConditionCollector
    {
        return this._conditionCollectorCreator(descriptor);
    }

    public registerConditionCollector(creator: (descriptor: EvaluateChildConditionResultsDescriptor) => IFluentConditionCollector): void
    {
        assertNotNull(creator, 'creator');
        this._conditionCollectorCreator = creator;
    }
    private _conditionCollectorCreator: (descriptor: EvaluateChildConditionResultsDescriptor) => IFluentConditionCollector;    

    /**
     * Unlike other factories, which are on ValidationServices. We wanted to avoid
     * passing the ValidationServices class into the entry point functions as our
     * intention is to keep the syntax small and simple.
     */
    public static singleton: FluentFactory = new FluentFactory();
}


//#region custom validation rule
//!!!NOTE: Currently customRule does not support FluentConditionCollector.

/**
 * The fluent function that allows the user to supply a conditionCreator function
 * instead of setting up a condition through a descriptor.
 * The actual code for our extension method. It will be associated with an interface declaration,
 * and assigned to the prototype of the FluentValidatorCollector class.
 * As an EXTENSION FUNCTION, it extends FluentValidatorCollector, and 
 * REQUIRES 'this' to be an instance of FluentValidatorCollector.
 * For more on setting up your own fluent function, see @link ValueHosts/Fluent|Fluent.
 */

export function customRule(conditionCreator: (requester: InputValidatorDescriptor) => ICondition | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector
{
    if (this instanceof FluentValidatorCollector) {
        let ivDescriptor: InputValidatorDescriptor = inputValidatorParameters ?
            { ...inputValidatorParameters as InputValidatorDescriptor, conditionDescriptor: null } :
            { conditionDescriptor: null}; 
        ivDescriptor.conditionCreator = conditionCreator;
        let self = this as FluentValidatorCollector;
        self.add(null, null, errorMessage, ivDescriptor);
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
export declare interface FluentValidatorCollector
{
    customRule(conditionCreator: (requester: InputValidatorDescriptor) => ICondition | null,
        errorMessage: string | null,
        inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector | InputValidatorDescriptor;
}


/**
 * Make JavaScript associate the function with the class.
 */
FluentValidatorCollector.prototype.customRule = customRule;
//#endregion custom validation rule