/**
 * The FormConfigAdapter is used together with ModuleRule classes that implement 
 * IAdaptModelRulesToForm to adapt the configuration already established according
 * to the business logic within ModuleRules.configureRules().
 * 
 * Our goal is to protect business logic from forms own needs, due to separation of concerns.
 * To make this work, the form developer will use IAdaptModelRulesToForm.adaptToForm()
 * with this FormConfigAdapter class. FormConfigAdapter is designed to allow these kinds of modifications:
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
 *    the ModifyValidatorBuilder.and(), or(), and whenToEnable() methods. This allows the form's condition
 *    to be combined with the existing validator's condition, enabling more complex validation logic.
 * 5. Disable an existing validator using the ModifyValidatorBuilder.disable() method.
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
 * Disable an existing validator.
 * ```ts
 * adapter.modify('fieldValue').validator(ConditionType.RequireText)
 *     .disable();
 * ``` 
 * @module Builder/ConcreteClasses/FormConfigAdapter
 */

import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { ConditionWithChildrenBaseConfig } from '@plblum/jivs-engine/build/Conditions/ConditionWithChildrenBase';
import { WhenConditionConfig } from '@plblum/jivs-engine/build/Conditions/WhenCondition';
import { ValueHostName } from '@plblum/jivs-engine/build/DataTypes/BasicTypes';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { ValidatableValueHostBaseConfig } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { ValidatorConfig } from '@plblum/jivs-engine/build/Interfaces/Validator';
import { ValidatorsValueHostBaseConfig, isValidatableValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { ValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { CodingError, assertFunction, assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { resolveErrorCode } from '@plblum/jivs-engine/build/Utilities/Validation';
import {
    CompleteConfigBuilderHandler, IBuilderConfigHost,
    IStartConditionBuilder, IStartConditionWithOneChildBuilder,
    IValidatorBuilder
} from '../Interfaces/ChildBuilders';
import { FluentValidatorConfig } from '../Interfaces/ValueHostConfigBuilders';
import {
    AdapterValueHostConfig, BuilderOverrideOptions, IFormConfigAdapter,
    IManagerConfigBuilder, IModifyFieldBuilder, IModifyValidatorBuilder
} from '../Interfaces/ManagerConfigBuilder';
import { RulesConfigOptions } from '../Interfaces/ModelRules';
import { BuilderConfigHostBase } from './BuilderConfigHostBase';
import { BuilderState, ManagerConfigBuilderBase } from './ManagerConfigBuilderBase';
import { StartConditionWithOneChildBuilder } from './StartConditionWithOneChildBuilder';
import { ValidationManagerConfigBuilder } from './ValidationManagerConfigBuilder';

/**
 * Creates a FormConfigAdapter from a source IManagerConfigBuilder.
 * @param source 
 * @param options 
 * @returns 
 */
export function createFormConfigAdapter(source: IManagerConfigBuilder<any>, options?: RulesConfigOptions): IFormConfigAdapter
{
    if (source instanceof ManagerConfigBuilderBase) {
        const state = (source as ManagerConfigBuilderBase<ValidationManagerConfig>).handOffState();
        return new FormConfigAdapter(state, { favorUIMessages: options?.favorUIMessages });
    }
    throw new CodingError('createFormAdapter() expects a ManagerConfigBuilderBase instance.');
}

/** 
 * Variation of ValidationManagerConfigBuilder with extensions designed for the UI layer
 * to override and extend the business layer configuration.
 * It allows us to isolate methods specific to the UI layer, 
 * so that the business layer does not have to know about them.
*/
export class FormConfigAdapter
    extends ValidationManagerConfigBuilder
    implements IFormConfigAdapter
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

    /**
     * When the business logic provides the initial validators,
     * they include error messages designed from the business logic
     * perspective.
     * 
     * The UI layer can override them in several ways:
     * 1. Use this FormConfigAdapter.modify().validator() to change the error messages.
     * 2. By using those registered with TextLocalizationService.
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
        const tls = this.services.textLocalizerService;
        // goes through all validators, but only on the baseConfig which is setup by business logic.
        // For any with an error message, see if it exists
        // in TextLocalizationService as "*". If so, clear
        // errorMessage, errorMessagel10n, summaryMessage, summaryMessagel10n
        // This allows TextLocalizationService to supply messages.
        for (let i = 0; i < this.baseConfig.valueHostConfigs.length; i++) {
            const vhConfig = this.baseConfig.valueHostConfigs[i] as FieldValueHostConfig;
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
        const notFound: Array<ValueHostName> = modelFieldNames.slice();
        // uses baseConfig, not destinationValueHostConfigs(), 
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (const vhConfig of this.baseConfig.valueHostConfigs) {
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
            const msg = `useOnlyTheseModelFields specified names not already registered: ${notFound.join(', ')}`;
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
        const notFound: Array<ValueHostName> = modelFieldNames.slice();
        // uses baseConfig, not destinationValueHostConfigs(), 
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (const vhConfig of this.baseConfig.valueHostConfigs) {
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
            const msg = `disableTheseModelFields specified names not already registered: ${notFound.join(', ')}`;
            this.logger.message(LoggingLevel.Warn, () => msg);
        }
    }
    /**
     * Applies the validation group name to all valuehosts identified. 
     * This is useful alternative to assigning each valuehost individually to a group.
     * It will overwrite any existing group name. 
     * If you create a valuehost later, you can assign it like this:
     * ```ts
     * adapter.field('newfield', { group: 'groupname' });
     * ```
     * @param groupName - validation group name. Same name used in 
     * ValidationManager.validate(groupName) to validate all valuehosts in the group.
     * @param valueHostNames - names on ValueHosts already declared.
     */
    public assignToGroup(groupName: string, valueHostNames: Array<ValueHostName>): void
    {
        assertNotNull(groupName, 'groupName');
        assertNotNull(valueHostNames, 'valueHostNames');

        // uses baseConfig, not destinationValueHostConfigs()
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (const valueHostName of valueHostNames) {
            const vhConfig = this.getExistingValueHostConfig(valueHostName, false); 
            if (vhConfig) {
                if (isValidatableValueHostConfig(vhConfig))
                    (vhConfig as ValidatableValueHostBaseConfig).group = groupName;
                else
                    this.logger.message(LoggingLevel.Warn, () => `assignToGroup specified name is not a validatable ValueHost: ${valueHostName}`);
            }
            else {
                this.logger.message(LoggingLevel.Warn, () => `assignToGroup specified name not already registered: ${valueHostName}`);
            }
        }
    }

   /**
     * Modifies the configuration of a specific ValueHost by exposing its IModifyFieldBuilder
     * for extensions that it offers. Makes no direct changes to ValueHostConfig itself.
     * @param valueHostName - the name of the ValueHost to modify.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    public modify(valueHostName: ValueHostName): IModifyFieldBuilder;
    /**
     * Modifies the configuration of a specific ValueHost by applying the given adjustments.
     * Applies the specified adjustments to the ValueHostConfig.
     * This does not modify anything that must be retained from business logic itself.
     * It also omits the dataType property which is a special case for changes.
     * @param valueHostName - the name of the ValueHost to modify.
     * @param adjustments - the adjustments to apply to the ValueHostConfig.
     * @returns The IModifyValidatorBuilder for further modifications.
     */
    public modify(valueHostName: ValueHostName, adjustments: AdapterValueHostConfig): IModifyFieldBuilder;  // eslint-disable-line @typescript-eslint/unified-signatures
    
    /**
     * Updates just the ValueHostConfig.label property.
     * It is a shorthand for `modify(valueHostName, { label: label })` but is more convenient 
     * for the common case of just changing the label.
     * @param valueHostName - the name of the ValueHost to modify.
     * @param label - the new label to apply to the ValueHostConfig.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    public modify(valueHostName: ValueHostName, label: string): IModifyFieldBuilder;    // eslint-disable-line @typescript-eslint/unified-signatures

    /**
     * Modifies the configuration of a specific ValueHost by applying the given adjustments.
     * Applies the specified adjustments to the ValueHostConfig.
     * This does not modify anything that must be retained from business logic itself.
     * It contains the dataType property which is a special case for changes.
     * @param valueHostName - the name of the ValueHost to modify.
     * @param dataType - the data type of the ValueHost to modify. It must support falling back to the 
     * original dataType. (However, if the original is not supplied, it is used without verification.)
     * @param adjustments - the adjustments to apply to the ValueHostConfig.
     * @returns The IModifyValidatorBuilder for further modifications.
     */
    public modify(valueHostName: ValueHostName,
        arg2?: AdapterValueHostConfig | string,
        arg3?: AdapterValueHostConfig): IModifyFieldBuilder
    {
        // find the existing ValueHostConfig for the given valueHostName in destinationValueHostConfigs
        // If not found, throw an error
        const existingConfig = this.getExistingValueHostConfig(valueHostName, true)!;    // throws

        if (arg2 || arg3)
        {
            let configSource: AdapterValueHostConfig | undefined = undefined;
            let label: string | undefined = undefined;
            if (typeof arg2 === 'string') {
                label = arg2;
                configSource = arg3;
            } else {
                configSource = arg2;
            }   
            // we have something to modify
            if (label) {
                existingConfig.label = label;
            }
            if (configSource) {
                this.mergeConfigs(existingConfig, configSource);
            }
        }
        return new ModifyFieldBuilder(this.services, existingConfig);
    }

    /**
     * Assigns properties on existingConfig from adjustments, except for those in donotReplaceTheseProperties.
     * This strategy allows the user to supply properties not formally defined in AdapterValueHostConfig,
     * but they added to their own ValueHostConfigs.
     * @param existingConfig 
     * @param adjustments 
     */
    protected mergeConfigs(existingConfig: ValueHostConfig, adjustments: AdapterValueHostConfig): void
    {
        // go through all properties in adjustments and copy them to existingConfig,
        // except for those in donotReplaceTheseProperties. 
        // Those skipped are logged.
        for (const prop in adjustments) {
            if (FormConfigAdapter.doNotReplaceTheseValueHostProperties.includes(prop)) {
                // log that this property was skipped
                this.logger.message(LoggingLevel.Warn, ()=> `Skipped property "${prop}" as it is protected.`);
            }
            else 
                 (existingConfig as any)[prop] = (adjustments as any)[prop];
        }
    }
    // These property names are on ValueHostConfig and children that 
    // the modify() + mergeConfigs() methods are not allowed to change. 
    // They are considered essential to the business logic and should not be overridden by the UI layer.
    public static readonly doNotReplaceTheseValueHostProperties = [
        'name',
        'valueHostType',
        'dataType',
        'validatorConfigs'
    ];
}    

/**
 * Builder that is chained from IFormConfigAdapter.modify() to modify individual fields.
 */
export class ModifyFieldBuilder
    extends BuilderConfigHostBase<ValueHostConfig>
    implements IModifyFieldBuilder
{
    constructor(services: IValidationServices, parentConfig: ValueHostConfig) {
        super(services, null);
        assertNotNull(parentConfig, 'parentConfig');
        this.setConfig(parentConfig, { bubbleUp: false });
    }

    public override setConfig(config: ValueHostConfig, options?: object): void {
        if (config)
            assertNotNull(config.valueHostType, 'config.valueHostType');

        super.setConfig(config, options);
    }

    /**
     * Identifies an existing validator to modify. Returns the IModifyValidatorBuilder for further modifications.
     * It does not change the ValidatorConfig directly.
     * @param conditionType - aka 'errorCode'. The type of the validator condition to modify. 
     * If using an error code on the validator, you must specify it explicitly
     * as errorcode overrides conditionType.
     * @param errorMessage - optional. If specified, it will override the existing error message.
     * @param summaryMessage - optional. If specified, it will override the existing summary message.
     * @returns The IModifyValidatorBuilder for further modifications.
     */
    public validator(conditionType: string, errorMessage?: string | null, summaryMessage?: string | null): IModifyValidatorBuilder;
    public validator(conditionType: string, adjustments: FluentValidatorConfig): IModifyValidatorBuilder;
    public validator(conditionType: string, arg2?: string | FluentValidatorConfig | null, arg3?: string ): IModifyValidatorBuilder
    {
        assertNotNull(conditionType, 'conditionType');
        // find the existing validator with the specified conditionType/errorCode
        // in config.validatorConfigs array.
        // throws if the validator with the specified conditionType/errorCode does not exist
        const config = this.getConfig()! as ValidatorsValueHostBaseConfig;
        if (!isValidatableValueHostConfig(config)) {
            this.reportError(new Error(`ValueHost type ${config.valueHostType} config does not support validators.`));  // throws
        }
        let existingValidator: ValidatorConfig | undefined = undefined;
        if (config.validatorConfigs && config.validatorConfigs.length > 0)
            existingValidator = config.validatorConfigs.find(v => conditionType === resolveErrorCode(v));
        if (!existingValidator) {
            this.reportError(new Error(`Validator with conditionType/errorCode '${conditionType}' does not exist.`));
        }
        if (arg2 != null || arg3 !== undefined) // null/undefined
        {
            let adjustments: FluentValidatorConfig | undefined = undefined;
            if (typeof arg2 === 'string') {
                adjustments = { errorMessage: arg2, summaryMessage: arg3 };
            }
            else if (typeof arg3 === 'string') { // arg2 should be null
                adjustments = { errorMessage: null, summaryMessage: arg3 };
            }
            else if (typeof arg2 === 'object')
                adjustments = arg2 as FluentValidatorConfig;

            if (adjustments) {
                this.mergeConfigs(existingValidator!, adjustments);
            }
        }

        // Return the IModifyValidatorBuilder for the found validator.
        return new ModifyValidatorBuilder(this.services, this as any, existingValidator!);

    }

    /**
     * Transfers properties from adjustments to existingConfig, except for those in doNotReplaceTheseValidatorProperties.
     * This strategy allows the user to supply properties not formally defined in FluentValidatorConfig,
     * but they added to their own ValidatorConfigs.
     * @param existingConfig 
     * @param adjustments 
     */
    protected mergeConfigs(existingConfig: ValidatorConfig, adjustments: FluentValidatorConfig): void
    {
        // go through all properties in adjustments and copy them to existingConfig,
        // except for those in donotReplaceTheseProperties. 
        // Those skipped are logged.
        for (const prop in adjustments) {
            if (ModifyFieldBuilder.doNotReplaceTheseValidatorProperties.includes(prop)) {
                // log that this property was skipped
                this.logger.message(LoggingLevel.Warn, ()=> `Skipped property "${prop}" as it is protected.`);
            }
            else 
                 (existingConfig as any)[prop] = (adjustments as any)[prop];
        }
    }

    // These property names are on ValueHostConfig and children that 
    // the modify() + mergeConfigs() methods are not allowed to change. 
    // They are considered essential to the business logic and should not be overridden by the UI layer.
    public static readonly doNotReplaceTheseValidatorProperties = [
        'conditionConfig',
        'conditionCreator'
    ];

    /**
     * Adds a new validator to the current ValueHost.
     * Returns the IValidatorBuilder for further configuration of the new validator.
     * If the user adds any validators that share an error code/condition type of an existing validator,
     * it is an error.
     * 
     * ```ts
     * FormConfigAdapter.addValidator().requiredText({ errorMessage: 'error' });
     * ```
     * @returns The IValidatorBuilder for further modifications.
     */
    public addValidator(): IValidatorBuilder
    {
        // find the existing validator with the specified conditionType/errorCode
        // in config.validatorConfigs array.
        // throws if the validator with the specified conditionType/errorCode does not exist
        const config = this.getConfig()! as ValidatorsValueHostBaseConfig;
        if (!isValidatableValueHostConfig(config)) {
            this.reportError(new Error(`ValueHost type ${config.valueHostType} config does not support validators.`)); // throws
        }

        return this.services.buildersFactory.createValidatorBuilder(config);
    }

    /**
     * Establishes the condition that must be met for the ValueHost to be enabled. It is a fluent format that returns a ConditionBuilder
     * that can be used to build the conditionConfig. The resulting conditionConfig is attached to the ValueHost as its enabler.
     * If called on a ValueHost already with an enabler, it will replace the existing enabler.
     * ```ts
     * builder.whenToEnable((childBuilder)=>
     *  childBuilder.fieldName('Field2').equalToValue('YES'));
     * builder.whenToEnable((childBuilder)=>
     *  childBuilder.conditionConfig(existingConditionConfig));
     * builder.whenToEnable(handler).any validator can be chained
     * ```
     * Sets this value:
     * ```ts
     * valueHostConfig.enablerConfig = conditionConfig;
     * ```
     * @param callback - A function that receives a IStartConditionWithOneChildBuilder and returns a ConditionConfig.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    public whenToEnable(callback: (builder: IStartConditionWithOneChildBuilder) => void): IModifyFieldBuilder
    {
        assertFunction(callback);
        
        const vhConfig = this.getConfig()! as ValidatableValueHostBaseConfig;
        const startBuilder = new StartConditionWithOneChildBuilder(
            this.services as IValidationServices,
            null,
            (conditionConfig) => {
            if (conditionConfig)
                vhConfig.enablerConfig = conditionConfig;
        });
        callback(startBuilder);
        return this;

    }

    /**
     * Specifies the data type for this ValueHost. 
     * Use case 1: The business layer did not specify a data type, but the UI layer needs to specify one
     * for clarity.
     * Use case 2: The business layer specified a data type, but the UI layer needs to change it to a different one.
     * In this case, the new data type must be compatible with the original data type. If it is not, it is an error.
     * By "compatible", there must be a fallback defined between the new data type and existing one
     * in the LookupKeyFallbackService within the ValidationServices. If there is no fallback, it is an error.
     * @param newDataType - the new data type to apply to this ValueHost. It must be compatible with the existing data type.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    public refineDataType(newDataType: string): IModifyFieldBuilder
    {
        const vhConfig = this.getConfig()!;

        // Replace dataType only if unassigned or this value has a fallback
        // matching the existing data type.
        const existingDataType = vhConfig.dataType;
        if (existingDataType && (newDataType != existingDataType)) {
            if (!this.services.lookupKeyFallbackService.canFallbackTo(newDataType, existingDataType)) 
                this.reportError(new Error(`Cannot replace dataType '${existingDataType}' with '${newDataType}' as no fallback is available.`));
        }
        vhConfig.dataType = newDataType;
        this.logger.message(LoggingLevel.Debug, () => `ValueHost '${vhConfig.name}' dataType upgraded to '${newDataType}'.`);
    
        return this;
    }

}

/**
 * Builder that is chained from IModifyFieldBuilder to modify an existing validator,
 * whose ValidatorConfig is passed in through the constructor
 * and assigned to the config of setConfig/getConfig methods.
 */
export class ModifyValidatorBuilder
    extends BuilderConfigHostBase<ValidatorConfig>
    implements IModifyValidatorBuilder {
    
    constructor(services: IValidationServices,
        parentBuilder: IBuilderConfigHost<object>,
        existingValidator: ValidatorConfig,
        completed?: CompleteConfigBuilderHandler<any>) {
        super(services, parentBuilder, completed);
        assertNotNull(existingValidator, 'existingValidator');
        this.setConfig(existingValidator, { bubbleUp: false });
    }

    /**
     * Use this method when you want to combine the existing validator condition 
     * with a new condition using an AND logic.
     * Reworks an existing validator placing its condition as a child of AllMatchesCondition
     * together with one you supply.
     * While it uses the AllMatchesconditon, its syntax uses 'and' to be more intuitive.
     * ```ts
     * builder.validator(ConditionType.RequireText).and('customErrorCode', 
     *  (newCondBuilder)=>
     *      newCondBuilder.fieldName('Field2').equalToValue('YES'));
     * ```
     * NOTE: If an AllMatchesCondition is created, it inherits the error code from the existing validator. 
     * @param builderCallback - A callback function that receives a new StartConditionBuilder.
     * Use fluent syntax to build the desired condition to be combined with the existing one. 
     */
    public and(builderCallback: (newCondBuilder: IStartConditionBuilder) => void): void
    {
        this.replaceChildren(ConditionType.All, builderCallback);
    }
    /**
     * Use this method when you want to combine the existing validator condition 
     * with a new condition using an OR logic.
     * Reworks an existing validator placing its condition as a child of AnyMatchesCondition
     * together with one you supply.
     * While it uses the AnyMatchesconditon, its syntax uses 'or' to be more intuitive.
     * ```ts
     * builder.validator(ConditionType.RequireText).or('customErrorCode', 
     *  (newCondBuilder)=>
     *      newCondBuilder.fieldName('Field2').equalToValue('YES'));
     * ```
     * NOTE: If an AllMatchesCondition is created, it inherits the error code from the existing validator. 
     * @param builderCallback - A callback function that receives a new StartConditionBuilder.
     * Use fluent syntax to build the desired condition to be combined with the existing one. 
     */
    public or(builderCallback: (newCondBuilder: IStartConditionBuilder) => void): void
    {
        this.replaceChildren(ConditionType.Any, builderCallback);
    }

    /**
     * Worker for and/or condition combination.
     * Combines the existing condition with a new one based on the specified condition type (AND/OR).
     * If the existing condition already matches the specified condition type, it will add the new condition as a child.
     * Otherwise, it will create a new All/AnyMatchCondition with the existing and new conditions as children
     * and fully replace getConfig().conditionConfig.
     * @param conditionType 
     * @param builderCallback 
     * @returns 
     */
    protected replaceChildren(conditionType: ConditionType, 
        builderCallback: (newCondBuilder: IStartConditionBuilder) => void): void
    {
        assertFunction(builderCallback);
        const existingValidator = this.getConfig()!;
        const existingCondition = existingValidator.conditionConfig;
        if (!existingCondition)
            this.reportError(new Error('Existing condition is null or undefined.')); // throws
        const startBuilder = this.services.buildersFactory.createStartConditionBuilder(this as any);
        builderCallback(startBuilder);
        const newCondition = startBuilder.getConfig()!;
        if (!newCondition)
            this.reportError(new Error('Child builder was not used to define a Condition.')); // throws
        const originalErrorCode = resolveErrorCode(existingValidator);
        if (originalErrorCode === conditionType) {
            // Logic to combine the existing condition with the new one using AND logic
            const owner = (existingCondition as ConditionWithChildrenBaseConfig);
            if (owner.conditionConfigs == null) // null/undefined
                owner.conditionConfigs = [];
            owner.conditionConfigs.push(newCondition);
        // lock down the original error code
            existingValidator.errorCode = originalErrorCode;

            return;
        }
            // Logic to combine the existing condition with the new one using AND logic
        const combinedCondition: ConditionWithChildrenBaseConfig = {
            conditionType: conditionType,
            conditionConfigs: [existingCondition!, newCondition]
        };

        // lock down the original error code
        existingValidator.errorCode = originalErrorCode;
        existingValidator.conditionConfig = combinedCondition;      
    }
    /**
     * Use this method to specify a condition that must be met for the existing validator to be evaluated.
     * It replaces the existing validator with a WhenCondition where your new condition is
     * the whenToEnableCondition and the existing condition is the thenCondition.
     * The whenToEnableCondition is defined using a StartConditionBuilder and returns a ConditionConfig.
     * @param builderCallback - A callback function that receives a new StartConditionBuilder.
     * Use fluent syntax to build the desired condition to be combined with the existing one. 
     */
    public whenToEnable(builderCallback: (whenToEnableBuilder: IStartConditionWithOneChildBuilder) => void): void
    {
        const existingValidator = this.getConfig()!;
        const thenConfig = existingValidator.conditionConfig;
        if (!thenConfig)
            this.reportError(new Error('Existing condition is null or undefined.'));    // throws
        const startBuilder = this.services.buildersFactory.createStartConditionWithOneChildBuilder(this as any);
        builderCallback(startBuilder);
        const whenToEnableConfig = startBuilder.getConfig()!;
        if (!whenToEnableConfig)
            this.reportError(new Error('Child builder was not used to define a Condition.')); // throws

        existingValidator.conditionConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: whenToEnableConfig,
            thenConfig: thenConfig
        } as WhenConditionConfig;
    }

        /**
     * If the validator must not run, it can be disabled. It is preferred
     * that you combine another condition with this one instead of simply disabling it.
     * Use and(), or(), or whenToEnable() to combine conditions instead of simply disabling the validator.
     */
    public disable(): void
    {
        const existingValidator = this.getConfig()!;
        existingValidator.enabled = false;
    }
}