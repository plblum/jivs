/**
 * Custom Conditions designed for testing validation where the Condition has a predictable behavior.
 * - AlwaysMatchesCondition: Always returns Match
 * - NeverMatchesCondition: Always returns NoMatch
 * - IsUndeterminedCondition: Always returns Undetermined
 * - ThrowsExceptionCondition: Always throws an Error
 * - ThrowsSevereExceptionCondition: Always throws a CodingError
 * - UserSuppliedResultCondition: Returns a result supplied in the config
 * - UserSuppliedResultConditionWithDuringEdit: Returns a result supplied in the config
 *   and implements IEvaluateConditionDuringEdits
 * - EvaluatesAsPromiseCondition: Returns a Promise that resolves to Match
 * - DisposableCondition: Returns a result supplied in the config and implements IDisposable
 * 
 * Add to an existing ValidationService by calling registerTestingOnlyConditions(services.conditionsFactory).
 * @module Support/ConditionsForTesting
 */
import { ConditionFactory } from "../Conditions/ConditionFactory";
import {
    ConditionConfig, IConditionCore, ConditionEvaluateResult, ConditionCategory,
    IEvaluateConditionDuringEdits
} from "../Interfaces/Conditions";
import { IDisposable } from "../Interfaces/General_Purpose";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { IValueHost } from "../Interfaces/ValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { CodingError } from "../Utilities/ErrorHandling";


/**
 * Adds to the ConditionFactory custom Conditions designed for testing validation
 * where the Condition has a predictable behavior.
 * - AlwaysMatchesCondition: Always returns Match
 * - NeverMatchesCondition: Always returns NoMatch
 * - IsUndeterminedCondition: Always returns Undetermined
 * - ThrowsExceptionCondition: Always throws an Error
 * - ThrowsSevereExceptionCondition: Always throws a CodingError
 * - UserSuppliedResultCondition: Returns a result supplied in the config
 * - UserSuppliedResultConditionWithDuringEdit: Returns a result supplied in the config
 *   and implements IEvaluateConditionDuringEdits
 * - EvaluatesAsPromiseCondition: Returns a Promise that resolves to Match
 * - DisposableCondition: Returns a result supplied in the config and implements IDisposable
 */
export function registerTestingOnlyConditions(factory: ConditionFactory): void
{
    factory.register(AlwaysMatchesConditionType, (config) => new AlwaysMatchesCondition(config));
    factory.register(NeverMatchesConditionType, (config) => new NeverMatchesCondition(config));
    factory.register(IsUndeterminedConditionType, (config) => new IsUndeterminedCondition(config));
    factory.register(ThrowsExceptionConditionType, (config) => new ThrowsExceptionCondition(config));
    factory.register(ThrowsSevereExceptionConditionType, (config) => new ThrowsSevereExceptionCondition(config));
    factory.register<UserSuppliedResultConditionConfig>(UserSuppliedResultConditionType, (config) => new UserSuppliedResultCondition(config));
    factory.register<UserSuppliedResultConditionConfig>(UserSuppliedResultConditionWithDuringEditType, (config) => new UserSuppliedResultConditionWithDuringEdit(config));
    factory.register<ConditionConfig>(EvaluatesAsPromiseConditionType, (config) => new EvaluatesAsPromiseCondition(config));
    factory.register<DisposableConditionConfig>(DisposableConditionType, (config) => new DisposableCondition(config));
    // yes, two conditions of the same class can be registered with different Type names.
    factory.register(NeverMatchesConditionType2, (config) => new NeverMatchesCondition(config));
}

/**
 * Base class for custom conditions designed for testing validation where the Condition 
 * has a predictable behavior.
 */
export abstract class MockConditionBase<TConfig extends ConditionConfig> implements IConditionCore<TConfig>
{
    constructor(config: TConfig) {
        this._config = config;
    }

    public get conditionType(): string
    {
        return this.config.conditionType;
    }

    public abstract evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

    public get config(): TConfig {
        return this._config;
    }
    private readonly _config: TConfig;

    public get category(): ConditionCategory {
        return this.config.category ?? ConditionCategory.Undetermined;
    }
}

// Custom Conditions designed for testing validation where the Condition has a predictable behavior

export const AlwaysMatchesConditionType = "AlwaysMatches";
/**
 * Custom condition that always returns Match, designed for testing validation.
 * Expected to be registered using AlwaysMatchesConditionType ("AlwaysMatches").
 */
export class AlwaysMatchesCondition extends MockConditionBase<ConditionConfig> implements IEvaluateConditionDuringEdits{
 
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.Match;
    }

    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        return ConditionEvaluateResult.Match;
    }
}

export const NeverMatchesConditionType = "NeverMatches";
export const NeverMatchesConditionType2 = "NeverMatches2"; // two type names for the same condition so we can test with 2 conditions without type naming conflicts

/**
 * Custom condition that always returns NoMatch, designed for testing validation.
 * Expected to be registered using NeverMatchesConditionType ("NeverMatches").
 */
export class NeverMatchesCondition extends MockConditionBase<ConditionConfig> implements IEvaluateConditionDuringEdits {

    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.NoMatch;
    }
    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        return ConditionEvaluateResult.NoMatch;
    }
}

export const IsUndeterminedConditionType = "AlwaysUndetermined";

/**
 * Custom condition that always returns Undetermined, designed for testing validation.
 * Expected to be registered using IsUndeterminedConditionType ("AlwaysUndetermined").
 */
export class IsUndeterminedCondition extends MockConditionBase<ConditionConfig>{
    protected get DefaultConditionType(): string { return this.config.conditionType; }
    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.Undetermined;
    }

}

export const ThrowsExceptionConditionType = "AlwaysThrows";

/**
 * Custom condition that always throws an Error, designed for testing validation.
 * Expected to be registered using ThrowsExceptionConditionType ("AlwaysThrows").
 */
export class ThrowsExceptionCondition extends MockConditionBase<ConditionConfig>{
    protected get DefaultConditionType(): string { return this.config.conditionType; }    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        throw new Error("Always Throws");
    }
}

export const ThrowsSevereExceptionConditionType = "AlwaysThrowsSevere";

/**
 * Custom condition that always throws a CodingError (which is a Severe error), 
 * designed for testing validation.
 * Expected to be registered using ThrowsSevereExceptionConditionType ("AlwaysThrowsSevere").
 */
export class ThrowsSevereExceptionCondition extends MockConditionBase<ConditionConfig>{
    protected get DefaultConditionType(): string { return this.config.conditionType; }    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        throw new CodingError("Always Throws");
    }
}

export const UserSuppliedResultConditionWithDuringEditType = 'UserSuppliedResultWithDuringEdit';
export const UserSuppliedResultConditionType = 'UserSuppliedResult';

/**
 * Delivers the desired result to the UserSuppliedResultCondition.
 * Pass this into its constructor.
 */
export interface UserSuppliedResultConditionConfig extends ConditionConfig
{
    result: ConditionEvaluateResult;
}
/**
 * Custom condition that returns a result supplied in the config, designed for testing validation.
 * Expected to be registered using UserSuppliedResultConditionType ("UserSuppliedResult").
 * Supply the desired result in UserSuppliedResultConditionConfig.result,
 * passed into the constructor.
 */
export class UserSuppliedResultCondition extends MockConditionBase<UserSuppliedResultConditionConfig>
{
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return this.config.result;
    }
}
export class UserSuppliedResultConditionWithDuringEdit extends UserSuppliedResultCondition
    implements IEvaluateConditionDuringEdits
{
    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        return this.config.result;
    }
}
export const EvaluatesAsPromiseConditionType = "EvaluatesAsPromise";

/**
 * Custom condition that returns a Promise that resolves to Match, designed for testing validation.
 * This is useful for testing asynchronous conditions.
 * Expected to be registered using EvaluatesAsPromiseConditionType ("EvaluatesAsPromise").
 * The Promise is resolved with ConditionEvaluateResult.Match.
*/
export class EvaluatesAsPromiseCondition extends MockConditionBase<ConditionConfig>{
 
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return new Promise((resolve) => {
            resolve(ConditionEvaluateResult.Match);
        });
    }

}

export const DisposableConditionType = 'Disposable';

export interface DisposableConditionConfig extends ConditionConfig
{
    result: ConditionEvaluateResult;
}
/**
 * Custom condition that returns a result supplied in the config and implements IDisposable,
 * designed for testing validation the IDisposable feature of conditions.
 * Expected to be registered using DisposableConditionType ("Disposable").
 */
export class DisposableCondition extends MockConditionBase<DisposableConditionConfig> implements IDisposable
{
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return this.config.result;
    }

    dispose(): void {
    }

}

/**
 * Utility to convert a ConditionEvaluateResult to a ConditionType string.
 * @param result 
 * @returns 
 */
export function resultTypeToConditionType(result: ConditionEvaluateResult): string
{
    switch (result)
    {
        case ConditionEvaluateResult.Match:
            return AlwaysMatchesConditionType;
        case ConditionEvaluateResult.NoMatch:
            return NeverMatchesConditionType;
        case ConditionEvaluateResult.Undetermined:
            return IsUndeterminedConditionType;
    }
    throw new Error("Unknown ConditionEvaluateResult");
}

export interface IDisposableConfig extends AlwaysMatchesCondition, IDisposable {
}
export function makeDisposable<T extends ConditionConfig = ConditionConfig> (config: T): T {
    return {
        ... config,
        dispose: () => { }
    } as unknown as T;
}
