/**
 * @inheritDoc Conditions/ConcreteConditions/WhenCondition!WhenCondition:class
 * @module Conditions/ConcreteConditions/WhenCondition
 */
import { ConditionConfig, ConditionEvaluateResult, ICondition } from "../Interfaces/Conditions";
import { ConditionWithOneChildBase, ConditionWithOneChildBaseConfig } from "./ConditionWithOneChildBase";
import { IValueHost, toIGatherValueHostNames } from "../Interfaces/ValueHost";
import { IValueHostsManager } from "../Interfaces/ValueHostsManager";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { toIDisposable } from "../Interfaces/General_Purpose";
import { ErrorResponseCondition } from "./ConditionBase";
import { ConditionType } from "./ConditionTypes";
import { LoggingCategory, LoggingLevel } from "../Interfaces/LoggerService";
import { valueForLog } from "../Utilities/Utilities";

/**
 * Configuration for WhenCondition
 * The child conditions are the childConditionConfig of ConditionWithOneChildBaseConfig.
 */
export interface WhenConditionConfig extends ConditionWithOneChildBaseConfig {
    /**
     * The condition that must be matched for the child condition to be evaluated.
     * Value is required.
     */
    enablerConfig: ConditionConfig;
}

/**
 * Specialized condition used to enable/disable another condition.
 * It is a wrapper around another condition that evaluates the other condition
 * only when its own enabler condition is ConditionEvaluationResult.Match.
 * 
 * Example: Only use requireText when the regular expression pattern is matched
 * against another valuehost
 * ```ts
 * builder.input('fieldname')
 *    .when((enabler)=>enabler.regExp('pattern', false, 'anotherValueHost')),
 *          (child)=>child.requireText());
 * ```
 * Note that the enabler condition is not passed the current valuehost to evaluate.
 * It is passed null, and the enabler condition should be configured to get its own value host
 * because it is rare that the enabler condition should be based on the same valuehost as the child condition.
 * 
 * The Validator.validate function will call the enabler and child conditions directly,
 * bypassing the WhenCondition.evaluate function and its limitation of no conditions that return a promise.
 * Any condition where WhenCondition is a child will use the WhenCondition.evaluate function
 * and retain its limitation of no conditions that return a promise.
 * 
 * ALERT: ConditionType=When is NEVER used as a Validator's errorCode.
 * The child condition's ConditionType is used as the errorCode instead.
 * This is maintained both in this class's conditionType and in resolveErrorCode().
 */
export class WhenCondition extends ConditionWithOneChildBase<WhenConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.When; }

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void {
        super.dispose();
        toIDisposable(this._enabler)?.dispose();
        this._enabler = undefined!;
    }

    /**
     * Returns the result of the child condition if the enabler condition is matched.
     * Otherwise, returns ConditionEvaluateResult.Undetermined.
     * @param valueHost 
     * @param valueHostsManager 
     * @returns 
     */
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        const enabler = this.enabler(valueHostsManager);
        // Intentially passing null instead of valuehost because we expect the enabler to get its own valuehost.
        let enablerResult = enabler.evaluate(null, valueHostsManager);

        if (enablerResult === ConditionEvaluateResult.Match) {
            let result = this.condition(valueHostsManager).evaluate(valueHost, valueHostsManager);
            this.ensureNoPromise(result);
            return result;
        }
        valueHostsManager.services.loggerService.log(`WhenCondition enabler condition did not match. Child condition not evaluated.`, LoggingLevel.Info,
            LoggingCategory.Info, valueForLog(this));
        return ConditionEvaluateResult.Undetermined;
    }

    /**
     * Provides conditions for the enabler and the child condition based on their configs.
     * This targets Validator.validate which uses both conditions directly instead of calling
     * WhenCondition.evaluate.
     * @param valueHostsManager 
     * @returns 
     */
    public extractConditions(valueHostsManager: IValueHostsManager): { enabler: ICondition, child: ICondition } {
        return { enabler: this.enabler(valueHostsManager), child: this.condition(valueHostsManager) };
    }

    protected enabler(valueHostsManager: IValueHostsManager): ICondition {
        if (!this._enabler) {
            if (!this.config.enablerConfig) {
                this.logInvalidPropertyData('enablerConfig', 'Must be assigned to a Condition', valueHostsManager);
                this._enabler = new ErrorResponseCondition();
            }
            else
                this._enabler = this.generateCondition(this.config.enablerConfig, valueHostsManager.services);
        }
        return this._enabler;
    }
    private _enabler: ICondition | null = null;

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void {
        super.gatherValueHostNames(collection, valueHostsManager);
        let enabler = this.enabler(valueHostsManager);

        toIGatherValueHostNames(enabler)?.gatherValueHostNames(collection, valueHostsManager);
    }

    /**
     * The WhenCondition uses the ConditionType of its child condition in error messages.
     */
    public get conditionType(): string {
        let ct = ConditionType.Unknown as string;
        if (this.config.childConditionConfig && this.config.childConditionConfig.conditionType)
            ct = this.config.childConditionConfig.conditionType;
        return ct
    }
}
