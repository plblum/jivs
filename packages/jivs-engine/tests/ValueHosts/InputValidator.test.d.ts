import { IValueHostResolver } from '../../src/Interfaces/ValueHostResolver';
import { type ICondition, ConditionEvaluateResult, ConditionCategory } from '../../src/Interfaces/Conditions';
import { IValueHost } from '../../src/Interfaces/ValueHost';
export declare class ConditionWithPromiseTester implements ICondition {
    constructor(result: ConditionEvaluateResult, delay: number, error?: string);
    conditionType: string;
    category: ConditionCategory;
    Result: ConditionEvaluateResult;
    Delay: number;
    Error: string | null;
    evaluate(valueHost: IValueHost, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;
}
