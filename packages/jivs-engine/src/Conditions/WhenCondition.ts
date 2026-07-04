/**
 * @inheritDoc Conditions/ConcreteConditions/WhenCondition!WhenCondition:class
 * @module Conditions/ConcreteConditions/WhenCondition
 */
import { ConditionCategory, ConditionConfig, ConditionEvaluateResult, ICondition } from "../Interfaces/Conditions";
import { IValueHost, toIGatherValueHostNames } from "../Interfaces/ValueHost";
import { IValueHostsManager } from "../Interfaces/ValueHostsManager";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { toIDisposable } from "../Interfaces/General_Purpose";
import { ConditionBase, ErrorResponseCondition } from "./ConditionBase";
import { ConditionType } from "./ConditionTypes";
import { LoggingLevel } from "../Interfaces/LoggerService";

/**
 * Configuration for WhenCondition
 * Adds the whenToEnableCondition and thenCondition's configs.
 */
export interface WhenConditionConfig extends ConditionConfig {
    /**
     * The condition that must be matched for the thenCondition to be evaluated.
     * Value is required.
     * Avoid using a condition whose evaluate() function returns a Promise. 
     */
    whenToEnableConfig: ConditionConfig;
    /**
     * The condition that is evaluated when the whenToEnableCondition is matched.
     */
    thenConfig: ConditionConfig;
}

/**
 * Specialized condition used to determine if another condition is used.
 * It represents a kind of "when then" logic,
 * where the "when" is the "When To Enable" condition and the "then" is the condition
 * that runs when enabled.
 * 
 * Evaluation results:
 * - If the "When To Enable" condition evaluates as ConditionEvaluationResult.Match,
 *   then the "then" condition is evaluated and its result is returned.
 * - If the "When To Enable" condition evaluates as ConditionEvaluationResult.NoMatch or Undetermined,
 *  then the "then" condition is not evaluated and ConditionEvaluationResult.Undetermined is returned.
 * 
 * Example: Only use requireText when the regular expression pattern is matched
 * against another valuehost
 * ```ts
 * builder.field('fieldname')
 *    .when((whenBuilder)=>whenBuilder.fieldValue('anotherValueHost').regExp('pattern'),
 *          (thenBuilder)=>thenBuilder.parentValue().requireText());
 * ```
 * This example uses fieldValue() for the whenBuilder. That's a typical use case
 * as the source of the value is mostly a different valuehost than the one being validated.
 * 
 * Do not use promise() when returning the result of the whenToEnable condition. 
 * The WhenCondition.evaluate function does not support conditions that return a promise.
 * 
 * ALERT: WhenConditionConfig.ConditionType=When is NEVER used as a Validator's errorCode.
 * The thenCondition's ConditionType is used as the errorCode instead.
 * This is maintained both in this class's conditionType and in resolveErrorCode().
 */
export class WhenCondition extends ConditionBase<WhenConditionConfig> {

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void {
        super.dispose();
        toIDisposable(this._whenToEnable)?.dispose();
        this._whenToEnable = undefined!;
    }

    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Children;
    }
    public static get DefaultConditionType(): ConditionType { return ConditionType.When; }

    /**
     * Returns the result of the child condition if the enabler condition is matched.
     * Otherwise, returns ConditionEvaluateResult.Undetermined.
     * @param valueHost 
     * @param valueHostsManager 
     * @returns 
     */
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        const whenCondition = this.whenToEnableCondition(valueHostsManager);
        // Intentially passing null instead of valuehost because we expect the enabler to get its own valuehost.
        let whenResult = whenCondition.evaluate(null, valueHostsManager);

        if (whenResult === ConditionEvaluateResult.Match) {
            let result = this.thenCondition(valueHostsManager).evaluate(valueHost, valueHostsManager);
            this.ensureNoPromise(result);
            return result;
        }

        this.logger(valueHostsManager.services).message(LoggingLevel.Info,
            () => `WhenCondition enabler condition did not match. Child condition not evaluated.`);
        return ConditionEvaluateResult.Undetermined;
    }

    /**
     * Provides the two conditions -- whenToEnableCondition and thenCondition -- based on their configs.
     * This targets Validator.validate which uses both conditions directly instead of calling
     * WhenCondition.evaluate.
     * @param valueHostsManager 
     * @returns 
     */
    public extractConditions(valueHostsManager: IValueHostsManager): {
        whenToEnableCondition: ICondition,
        thenCondition: ICondition
    } {
        return {
            whenToEnableCondition: this.whenToEnableCondition(valueHostsManager),
            thenCondition: this.thenCondition(valueHostsManager)
        };
    }

    /**
     * Does not support returning promises from the evaluate() function of the enabler condition.
     * @param valueHostsManager 
     * @returns 
     */
    protected whenToEnableCondition(valueHostsManager: IValueHostsManager): ICondition {
        if (!this._whenToEnable) {
            this._whenToEnable = this.generateCondition(this.config.whenToEnableConfig, valueHostsManager.services);
            if (this._whenToEnable instanceof ErrorResponseCondition) {
                this.throwInvalidPropertyData('whenToEnableConfig', 'must be assigned and configured correctly', valueHostsManager.services);
            }
        }
        return this._whenToEnable;
    }
    private _whenToEnable: ICondition | null = null;

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostsManager: IValueHostsManager): void {
        let whenToEnableCondition = this.whenToEnableCondition(valueHostsManager);

        toIGatherValueHostNames(whenToEnableCondition)?.gatherValueHostNames(collection, valueHostsManager);
        let thenCondition = this.thenCondition(valueHostsManager);
        toIGatherValueHostNames(thenCondition)?.gatherValueHostNames(collection, valueHostsManager);
    }

    /**
     * The WhenCondition uses the ConditionType of its child condition in error messages.
     */
    public get conditionType(): string {
        let ct = ConditionType.Unknown as string;
        if (this.config.thenConfig && this.config.thenConfig.conditionType)
            ct = this.config.thenConfig.conditionType;
        return ct
    }

    protected thenCondition(valueHostsManager: IValueHostsManager): ICondition {
        if (!this._thenCondition) {
            this._thenCondition = this.generateCondition(this.config.thenConfig, valueHostsManager.services);
            if (this._thenCondition instanceof ErrorResponseCondition) {
                this.throwInvalidPropertyData('thenConfig', 'must be assigned and configured correctly', valueHostsManager.services);
            }  
        }
        return this._thenCondition;
    }
    private _thenCondition: ICondition | null = null;    
}
