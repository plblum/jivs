import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionDescriptor, IConditionCore, ConditionEvaluateResult, ConditionCategory, IEvaluateConditionDuringEdits } from "../../src/Interfaces/Conditions";
import { IInputValueHost } from "../../src/Interfaces/InputValueHost";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { IValueHost } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";

// Custom Conditions designed for testing validation where the Condition has a predictable behavior
export abstract class MockConditionBase<TDescriptor extends ConditionDescriptor> implements IConditionCore<TDescriptor>
{
    constructor(descriptor: TDescriptor) {
        this._descriptor = descriptor;
    }

    public get conditionType(): string
    {
        return this.descriptor.type;
    }

    public abstract evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

    public get descriptor(): TDescriptor {
        return this._descriptor;
    }
    private readonly _descriptor: TDescriptor;

    public get category(): ConditionCategory {
        return this.descriptor.category ?? ConditionCategory.Undetermined;
    }
}
// Custom Conditions designed for testing validation where the Condition has a predictable behavior

export const AlwaysMatchesConditionType = "AlwaysMatches";

export class AlwaysMatchesCondition extends MockConditionBase<ConditionDescriptor> implements IEvaluateConditionDuringEdits{
 
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.Match;
    }

    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        return ConditionEvaluateResult.Match;
    }
}

export const NeverMatchesConditionType = "NeverMatches";
export const NeverMatchesConditionType2 = "NeverMatches2"; // two type names for the same condition so we can test with 2 conditions without type naming conflicts

export class NeverMatchesCondition extends MockConditionBase<ConditionDescriptor> implements IEvaluateConditionDuringEdits {

    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.NoMatch;
    }
    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        return ConditionEvaluateResult.NoMatch;
    }
}

export const IsUndeterminedConditionType = "AlwaysUndetermined";

export class IsUndeterminedCondition extends MockConditionBase<ConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.descriptor.type; }
    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return ConditionEvaluateResult.Undetermined;
    }

}

export const ThrowsExceptionConditionType = "AlwaysThrows";

export class ThrowsExceptionCondition extends MockConditionBase<ConditionDescriptor>{
    protected get DefaultConditionType(): string { return this.descriptor.type; }    
    public evaluate(valueHost: IValueHost | null, valueHostsResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        throw new Error("Always Throws");
    }
}

export const UserSuppliedResultConditionWithDuringEditType = 'UserSuppliedResultWithDuringEdit';
export const UserSuppliedResultConditionType = 'UserSuppliedResult';

export interface UserSuppliedResultConditionDescriptor extends ConditionDescriptor
{
    result: ConditionEvaluateResult;
}
export class UserSuppliedResultCondition extends MockConditionBase<UserSuppliedResultConditionDescriptor>
{
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return this.descriptor.result;
    }
}
export class UserSuppliedResultConditionWithDuringEdit extends UserSuppliedResultCondition
    implements IEvaluateConditionDuringEdits
{
    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        return this.descriptor.result;
    }
}


export function registerTestingOnlyConditions(factory: ConditionFactory): void
{
    factory.register(AlwaysMatchesConditionType, (descriptor) => new AlwaysMatchesCondition(descriptor));
    factory.register(NeverMatchesConditionType, (descriptor) => new NeverMatchesCondition(descriptor));
    factory.register(IsUndeterminedConditionType, (descriptor) => new IsUndeterminedCondition(descriptor));
    factory.register(ThrowsExceptionConditionType, (descriptor) => new ThrowsExceptionCondition(descriptor));
    factory.register<UserSuppliedResultConditionDescriptor>(UserSuppliedResultConditionType, (descriptor) => new UserSuppliedResultCondition(descriptor));
    factory.register<UserSuppliedResultConditionDescriptor>(UserSuppliedResultConditionWithDuringEditType, (descriptor) => new UserSuppliedResultConditionWithDuringEdit(descriptor));
    // yes, two conditions of the same class can be registered with different Type names.
    factory.register(NeverMatchesConditionType2, (descriptor) => new NeverMatchesCondition(descriptor));
}