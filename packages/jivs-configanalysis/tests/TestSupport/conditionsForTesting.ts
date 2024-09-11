import { ConditionFactory } from "@plblum/jivs-engine/build/Conditions/ConditionFactory";
import {
    ConditionConfig, IConditionCore, ConditionEvaluateResult, ConditionCategory,
    IEvaluateConditionDuringEdits
} from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { IDisposable } from "@plblum/jivs-engine/build/Interfaces/General_Purpose";
import { IInputValueHost } from "@plblum/jivs-engine/build/Interfaces/InputValueHost";
import { IValidationServices } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { IValueHost } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValueHostResolver } from "@plblum/jivs-engine/build/Interfaces/ValueHostResolver";
import { CodingError } from "@plblum/jivs-engine/build/Utilities/ErrorHandling";

// Custom Conditions designed for testing validation where the Condition has a predictable behavior
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

export class NeverMatchesCondition extends MockConditionBase<ConditionConfig> implements IEvaluateConditionDuringEdits {

    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.NoMatch;
    }
    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        return ConditionEvaluateResult.NoMatch;
    }
}

export const IsUndeterminedConditionType = "AlwaysUndetermined";

export class IsUndeterminedCondition extends MockConditionBase<ConditionConfig>{
    protected get DefaultConditionType(): string { return this.config.conditionType; }
    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.Undetermined;
    }

}

export const ThrowsExceptionConditionType = "AlwaysThrows";

export class ThrowsExceptionCondition extends MockConditionBase<ConditionConfig>{
    protected get DefaultConditionType(): string { return this.config.conditionType; }    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        throw new Error("Always Throws");
    }
}
export const ThrowsSevereExceptionConditionType = "AlwaysThrowsSevere";

export class ThrowsSevereExceptionCondition extends MockConditionBase<ConditionConfig>{
    protected get DefaultConditionType(): string { return this.config.conditionType; }    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        throw new CodingError("Always Throws");
    }
}

export const UserSuppliedResultConditionWithDuringEditType = 'UserSuppliedResultWithDuringEdit';
export const UserSuppliedResultConditionType = 'UserSuppliedResult';

export interface UserSuppliedResultConditionConfig extends ConditionConfig
{
    result: ConditionEvaluateResult;
}
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
export class DisposableCondition extends MockConditionBase<DisposableConditionConfig> implements IDisposable
{
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return this.config.result;
    }

    dispose(): void {
    }

}
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
