import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionConfig, IConditionCore, ConditionEvaluateResult, ConditionCategory, IEvaluateConditionDuringEdits } from "../../src/Interfaces/Conditions";
import { IInputValueHost } from "../../src/Interfaces/InputValueHost";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { IValueHost } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";

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


export function registerTestingOnlyConditions(factory: ConditionFactory): void
{
    factory.register(AlwaysMatchesConditionType, (config) => new AlwaysMatchesCondition(config));
    factory.register(NeverMatchesConditionType, (config) => new NeverMatchesCondition(config));
    factory.register(IsUndeterminedConditionType, (config) => new IsUndeterminedCondition(config));
    factory.register(ThrowsExceptionConditionType, (config) => new ThrowsExceptionCondition(config));
    factory.register<UserSuppliedResultConditionConfig>(UserSuppliedResultConditionType, (config) => new UserSuppliedResultCondition(config));
    factory.register<UserSuppliedResultConditionConfig>(UserSuppliedResultConditionWithDuringEditType, (config) => new UserSuppliedResultConditionWithDuringEdit(config));
    // yes, two conditions of the same class can be registered with different Type names.
    factory.register(NeverMatchesConditionType2, (config) => new NeverMatchesCondition(config));
}