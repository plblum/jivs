/**
 * The ConfigFormAdapter is used together with ModuleRule classes that implement 
 * IAdaptModelRulesToForm to adapt the configuration already established according
 * to the business logic within ModuleRules.configureRules().
 * 
 * Our goal is to protect business logic from forms own needs, due to separation of concerns.
 * To make this work, the form developer will use IAdaptModelRulesToForm.adaptToForm()
 * with this ConfigFormAdapter class. ConfigFormAdapter is designed to allow these kinds of modifications:
 * 1. Add entirely new ValueHosts, field(), static() and calc(), using the standard syntax
 *    built into the ValidationManagerConfigBuilder. However, if those functions are used
 *    on existing valuehosts, it is an error.
 * 2. Modify existing ValueHost own properties through the modify(valueHostName) method.
 *    It does not change validators, and only allows changing the data type if the introduced
 *    data type has a fallback to the existing data type. (Currency falls back to Number)
 *    It only supports safe changes that do not break the existing data type compatibility.
 *    modify() returns the ModifyFieldBuilder class to chain further modifications.
 * 3. Modify existing Validator own properties through the ModifyFieldBuilder.validator(validatorName) method.
 *    This allows changing the error messages, errorcode, severity, and enabled state,
 *    but not any condition specific rules.
 *    validator() returns the ModifyValidatorBuilder class to chain further modifications.
 * 4. Combine the form's condition with an existing validator's condition using
 *    the ModifyValidatorBuilder.all(), any(), and when() methods. This allows the form's condition
 *    to be combined with the existing validator's condition, enabling more complex validation logic.
 * 5. Explicitly replace an existing validator's condition using the ModifyValidatorBuilder.replaceWith() method.
 *    While frowned upon, this provides high visibility to the action.
 * 6. Add another validator to an existing ValueHost using the usual validator syntax found on
 *    ModifyValidatorBuilder with IModifyFieldBuilder.addValidator()
 * 
 * # Syntax examples
 * 
 * Modifying the valueHost itself.
 * ```ts
 * adapter.modify('fieldValue', { label: 'Field Label' })
 * adapter.modify('fieldValue', datatype, { enabled: false })
 * ```
 * Changing the error message and other validator metadata.
 * ```ts
 * adapter.modify('fieldValue').validator(ConditionType.RequireText, { 
 *     errorMessage: 'Error message', 
 *     summaryMessage: 'Summary message' })
 * adapter.modify('fieldValue').validator(ConditionType.RequireText, errorMessage, summaryMessage)
 * ```
 * Combine existing with new using AllMatchesCondition.
 * ```ts
 * // Create AllMatchesCondiiton with (existing AND new).
 * // Requires an errorcode because we've built a new condition rule
 * adapter.modify('fieldValue').validator(ConditionType.RequireText)
 *     .and(errorCode, (newCondBuilder)=> newCondBuilder.fieldName('field1').equalTo(10));
 * ```
 * Same as:
 * ```ts
 * <AllMatchesCondition>{
 *     conditionType: ConditionType.All,
 *     errorCode: errorCode,
 *     childConditionConfigs: [
 *         <RequireTextCondition>{
 *             conditionType: ConditionType.RequireText,
 *         },
 *         <EqualToCondition>{
 *             conditionType: ConditionType.EqualTo,
 *             valueHostName: 'field1',
 *             secondValue: 10
 *         }
 *     ]
 * }
 * ```
 * Combine existing with new using AnyMatchesCondition.
 * ```ts
 * // creates AnyMatchesCondiiton with (existing OR new).
 * // Requires an errorcode because we've built a new condition rule
 * adapter.modify('fieldValue').validator(ConditionType.RequireText)
 *     .or(errorCode, (newCondBuilder)=> newCondBuilder.fieldName('field1').equalTo(10));
 * ```
 * Use the WhenCondition to conditionally apply a new validation rule based on a custom condition.
 * ```ts
 * adapter.modify('fieldValue').validator(ConditionType.RequireText)
 *     .when((newCondBuilder)=> newCondBuilder.fieldName('field1').equalTo(true));
 * ```
 * Entirely replace an existing validator's condition.
 * ```ts
 * adapter.modify('fieldValue').validator(ConditionType.RequireText)
 *     .replaceWith((newCondBuilder)=> {});// removes existing, adds new one
 * ``` 
 * @module Builder/ConfigFormAdapter
 */

import { StartConditionBuilder } from "./StartConditionBuilder";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { ConditionConfig } from "../Interfaces/Conditions";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { LoggingLevel } from "../Interfaces/LoggerService";
import { AdapterValueHostConfig, BuilderOverrideOptions, IConfigFormAdapter, IManagerConfigBuilder, IModifyFieldBuilder, IModifyValidatorBuilder, IValidationManagerConfigFormAdapter } from "../Interfaces/ManagerConfigBuilder";
import { RulesConfigOptions } from "../Interfaces/ModelRules";
import { ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { CodingError } from "../Utilities/ErrorHandling";
import { resolveErrorCode } from "../Utilities/Validation";
import { BuilderState, CombineUsingCondition, ManagerConfigBuilderBase } from "./ManagerConfigBuilderBase";
import { ValidationManagerConfigBuilder } from "./ValidationManagerConfigBuilder";

/**
 * Creates a ValidationManagerConfigFormAdapter from a source IManagerConfigBuilder.
 * @param source 
 * @param options 
 * @returns 
 */
export function createFormAdapter(source: IManagerConfigBuilder<any>, options?: RulesConfigOptions): IConfigFormAdapter
{
    if (source instanceof ManagerConfigBuilderBase) {
        let state = (source as ManagerConfigBuilderBase<ValidationManagerConfig>).handOffState();
        return new ConfigFormAdapter(state, { favorUIMessages: options?.favorUIMessages });
    }
    throw new CodingError("createFormAdapter() expects a ManagerConfigBuilderBase instance.");
}

/** 
 * Variation of ValidationManagerConfigBuilder with extensions designed for the UI layer
 * to override and extend the business layer configuration.
 * It allows us to isolate methods specific to the UI layer, 
 * so that the business layer does not have to know about them.
*/
export class ConfigFormAdapter
    extends ValidationManagerConfigBuilder
    implements IConfigFormAdapter
{
    /**
     * Opens a new override layer for the UI layer to add or modify ValueHostConfigs.
     * @param state 
     * @param options - When options.favorUIMessages is not false, 
     * it will run favorUIMessages() to remove any error messages supplied by business logic,
     * so long as they are covered in TextLocalizationServices.
     */
    constructor(state: BuilderState<ValidationManagerConfig>, options?: BuilderOverrideOptions) {
        super(state);
        this.addOverride();
        if (!options || options.favorUIMessages !== false)
            this.favorUIMessages();        
    }
    modify(valueHostName: string): IModifyFieldBuilder;
    modify(valueHostName: string, adjustments: AdapterValueHostConfig): IModifyValidatorBuilder;
    modify(valueHostName: string, dataType: string, adjustments?: AdapterValueHostConfig | undefined): IModifyValidatorBuilder;
    modify(valueHostName: unknown, dataType?: unknown, adjustments?: unknown): import("../Interfaces/ManagerConfigBuilder").IModifyFieldBuilder | import("../Interfaces/ManagerConfigBuilder").IModifyValidatorBuilder {
        throw new Error('Method not implemented.');
    }

    /**
     * When the business logic provides the initial validators,
     * they include error messages designed from the business logic
     * perspective.
     * 
     * The UI layer can override them in several ways:
     * 1. Replacing them directly using updateValidator during configuration.
     * 2. Replacing them directly once ValidationManager exists, using startModifier().
     *    modifier.updateValidator('valuehostname', 'errorcode', { errorMessage: 'replacement'})
     *    or
     *    modifier.valueHostType('valuehostname').ruleName(null, 'replacement')
     * 3. By using those registered with TextLocalizationService.
     *    To use them, there should not be any error message already
     *    supplied to the validator and business layer messages get in the way.
     * 
     * This function should be called prior to creating ValidationManager
     * to remove all error messages supplied by business logic,
     * so long as they are covered in TextLocalizationServices.
     * Be sure that TextLocalizationServices is setup as desired
     * before calling this.
     */
    protected favorUIMessages(): void {
        let tls = this.services.textLocalizerService;
        // goes through all validators, but only on the baseConfig which is setup by business logic.
        // For any with an error message, see if it exists
        // in TextLocalizationService as "*". If so, clear
        // errorMessage, errorMessagel10n, summaryMessage, summaryMessagel10n
        // This allows TextLocalizationService to supply messages.
        for (let i = 0; i < this.baseConfig.valueHostConfigs.length; i++) {
            let vhConfig = this.baseConfig.valueHostConfigs[i] as FieldValueHostConfig;
            if (vhConfig.validatorConfigs)
                vhConfig.validatorConfigs.forEach((ivConfig) => {
                    if (ivConfig.errorMessage || ivConfig.errorMessagel10n)
                        if (tls.getErrorMessage('*', resolveErrorCode(ivConfig), null)) {
                            delete ivConfig.errorMessage;
                            delete ivConfig.errorMessagel10n;
                            delete ivConfig.summaryMessage;
                            delete ivConfig.summaryMessagel10n;
                        }
                });
        }
    }

    /**
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are not in the list of modelFieldNames. 
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     * Empty array disables all ValueHosts. Null or undefined does nothing.
     */
    public useOnlyTheseModelFields(modelFieldNames: Array<ValueHostName>): void
    {
        // clone the array
        let notFound: Array<ValueHostName> = modelFieldNames.slice();
        // uses baseConfig, not destinationValueHostConfigs(), 
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (let vhConfig of this.baseConfig.valueHostConfigs) {
            {
                const index = notFound.indexOf(vhConfig.name);
                if (index > -1)
                    notFound.splice(index, 1);
                if (!modelFieldNames.includes(vhConfig.name))
                    vhConfig.initialEnabled = false;
            }
        }
        if (notFound.length > 0) {
            // log
            let msg = `useOnlyTheseModelFields specified names not already registered: ${notFound.join(', ')}`;
            this.logger.message(LoggingLevel.Warn, () => msg);
        }
    }
    
    /**
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are in the list of modelFieldNames.
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     */
    public disableTheseModelFields(modelFieldNames: Array<ValueHostName>): void
    {
        let notFound: Array<ValueHostName> = modelFieldNames.slice();
        // uses baseConfig, not destinationValueHostConfigs(), 
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (let vhConfig of this.baseConfig.valueHostConfigs) {
            {
                const index = notFound.indexOf(vhConfig.name);
                if (index > -1)
                    notFound.splice(index, 1);
                if (modelFieldNames.includes(vhConfig.name))
                    vhConfig.initialEnabled = false;
            }
        }
        if (notFound.length > 0) {
            // log
            let msg = `disableTheseModelFields specified names not already registered: ${notFound.join(', ')}`;
            this.logger.message(LoggingLevel.Warn, () => msg);
        }
    }

}    