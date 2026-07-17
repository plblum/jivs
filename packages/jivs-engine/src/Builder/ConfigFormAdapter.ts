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
 * @module Builder/ConcreteClasses/ConfigFormAdapter
 */

import { ValueHostName } from "../DataTypes/BasicTypes";
import { ValidatableValueHostBaseConfig } from "../Interfaces/ValidatableValueHostBase";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { LoggingLevel } from "../Interfaces/LoggerService";
import {
    AdapterValueHostConfig, BuilderOverrideOptions, IConfigFormAdapter,
    IManagerConfigBuilder, IModifyFieldBuilder, IModifyValidatorBuilder
} from "../Interfaces/ManagerConfigBuilder";
import { RulesConfigOptions } from "../Interfaces/ModelRules";
import { ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { CodingError, assertFunction, assertNotNull } from "../Utilities/ErrorHandling";
import { resolveErrorCode } from "../Utilities/Validation";
import { BuilderState, ManagerConfigBuilderBase } from "./ManagerConfigBuilderBase";
import { ValidationManagerConfigBuilder } from "./ValidationManagerConfigBuilder";
import { ValueHostConfig } from "../Interfaces/ValueHost";
import { IValidationServices } from "../Interfaces/ValidationServices";
import {
    CompleteConfigBuilderHandler, IBuilderConfigHost, IFluentValidatorBuilder,
    IStartConditionBuilder, IStartConditionWithOneChildBuilder
} from "../Interfaces/ChildBuilders";
import { BuilderConfigHostBase } from "../Builder/BuilderConfigHostBase";
import { ValidatorsValueHostBaseConfig, isValidatableValueHostConfig } from '../Interfaces/ValidatorsValueHostBase';
import { ValidatorConfig } from '../Interfaces/Validator';
import { ConditionType } from '../Conditions/ConditionTypes';
import { ConditionWithChildrenBaseConfig } from '../Conditions/ConditionWithChildrenBase';
import { WhenConditionConfig } from '../Conditions/WhenCondition';
import { FluentValidatorConfig } from "../Interfaces/Fluent";
import { StartConditionWithOneChildBuilder } from './StartConditionWithOneChildBuilder';

/**
 * Creates a ConfigFormAdapter from a source IManagerConfigBuilder.
 * @param source 
 * @param options 
 * @returns 
 */
export function createConfigFormAdapter(source: IManagerConfigBuilder<any>, options?: RulesConfigOptions): IConfigFormAdapter
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
        let notFound: Array<ValueHostName> = valueHostNames.slice();
        // uses baseConfig, not destinationValueHostConfigs()
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (let valueHostName of valueHostNames) {
            let vhConfig = this.getExistingValueHostConfig(valueHostName, false); 
            if (vhConfig) {
                if (isValidatableValueHostConfig(vhConfig))
                    (<ValidatableValueHostBaseConfig>vhConfig).group = groupName;
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
    public modify(valueHostName: ValueHostName, adjustments: AdapterValueHostConfig): IModifyFieldBuilder;
    
    /**
     * Modifies the configuration of a specific ValueHost by applying the given adjustments.
     * Applies the specified adjustments to the ValueHostConfig.
     * This does not modify anything that must be retained from business logic itself.
     * It contains the dataType property which is a special case for changes.
     * @param valueHostName - the name of the ValueHost to modify.
     * @param dataType - the data type of the ValueHost to modify. It must support falling back to the 
     * original dataType. (However, if the original is not supplied, it is used without verification.)
     * @param adjustments - the adjustments to apply to the ValueHostConfig.
     * @returns The IModifyFieldBuilder for further modifications.
     */
    public modify(valueHostName: ValueHostName, dataType: string, adjustments?: AdapterValueHostConfig): IModifyFieldBuilder;    

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
        let existingConfig = this.getExistingValueHostConfig(valueHostName, true)!;    // throws

        if (arg2 || arg3)
        {
            let configSource: AdapterValueHostConfig | undefined;
            let dataType: string | undefined;
            if (typeof arg2 === 'string') {
                dataType = arg2;
                configSource = arg3;
            } else {
                configSource = arg2;
            }   
            // we have something to modify
            if (dataType) {
                this.replaceDataType(existingConfig, dataType);
            }
            if (configSource) {
                this.mergeConfigs(existingConfig, configSource);
            }
        }
        return new ModifyFieldBuilder(this.services, existingConfig);
    }
    protected replaceDataType(valueHostConfig: ValueHostConfig, dataType: string): void
    {
        // Replace dataType only if unassigned or this value has a fallback
        // matching the existing data type.
        let existingDataType = valueHostConfig.dataType;
        if (existingDataType && (dataType != existingDataType)) {
            if (!this.services.lookupKeyFallbackService.canFallbackTo(dataType, existingDataType)) 
                this.reportError(new Error(`Cannot replace dataType '${existingDataType}' with '${dataType}' as no fallback is available.`));
        }
        valueHostConfig.dataType = dataType;
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
            if (ConfigFormAdapter.doNotReplaceTheseValueHostProperties.includes(prop)) {
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
    static readonly doNotReplaceTheseValueHostProperties = [
        'name',
        'valueHostType',
        'dataType',
        'validatorConfigs',
    ];
}    

/**
 * Builder that is chained from IConfigFormAdapter.modify() to modify individual fields.
 */
export class ModifyFieldBuilder
    extends BuilderConfigHostBase<ValueHostConfig>
    implements IModifyFieldBuilder
{
    constructor(services: IValidationServices, parentConfig: ValueHostConfig) {
        super(services, null);
        assertNotNull(parentConfig, "parentConfig");
        this.setConfig(parentConfig, { bubbleUp: false });
    }

    override setConfig(config: ValueHostConfig, options?: object): void {
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
     * @returns The IModifyValidatorBuilder for further modifications.
     */
    public validator(conditionType: string): IModifyValidatorBuilder;
    public validator(conditionType: string, adjustments: FluentValidatorConfig): IModifyValidatorBuilder
    public validator(conditionType: string, arg2?: FluentValidatorConfig): IModifyValidatorBuilder
    {
        assertNotNull(conditionType, "conditionType");
        // find the existing validator with the specified conditionType/errorCode
        // in config.validatorConfigs array.
        // throws if the validator with the specified conditionType/errorCode does not exist
        let config = this.getConfig()! as ValidatorsValueHostBaseConfig;
        if (!isValidatableValueHostConfig(config)) {
            this.reportError(new Error(`ValueHost type ${config.valueHostType} config does not support validators.`));  // throws
        }
        let existingValidator: ValidatorConfig | undefined;
        if (config.validatorConfigs && config.validatorConfigs.length > 0)
            existingValidator = config.validatorConfigs.find(v => conditionType === resolveErrorCode(v));
        if (!existingValidator) {
            this.reportError(new Error(`Validator with conditionType/errorCode '${conditionType}' does not exist.`));
        }
        if (arg2) {
            this.mergeConfigs(existingValidator!, arg2);
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
    static readonly doNotReplaceTheseValidatorProperties = [
        'conditionConfig',
        'conditionCreator',
    ];

    /**
     * Adds a new validator to the current ValueHost.
     * Returns the IFluentValidatorBuilder for further configuration of the new validator.
     * If the user adds any validators that share an error code/condition type of an existing validator,
     * it is an error.
     * 
     * ```ts
     * configFormAdapter.addValidator().requiredText({ errorMessage: 'error' });
     * ```
     * @returns The IFluentValidatorBuilder for further modifications.
     */
    public addValidator(): IFluentValidatorBuilder
    {
        // find the existing validator with the specified conditionType/errorCode
        // in config.validatorConfigs array.
        // throws if the validator with the specified conditionType/errorCode does not exist
        let config = this.getConfig()! as ValidatorsValueHostBaseConfig;
        if (!isValidatableValueHostConfig(config)) {
            this.reportError(new Error(`ValueHost type ${config.valueHostType} config does not support validators.`)); // throws
        }

        return this.services.fluentFactory.createFluentValidatorBuilder(config);
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
        
        let vhConfig = this.getConfig()! as ValidatableValueHostBaseConfig;
        let startBuilder = new StartConditionWithOneChildBuilder(
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
        let vhConfig = this.getConfig()!;

        // Replace dataType only if unassigned or this value has a fallback
        // matching the existing data type.
        let existingDataType = vhConfig.dataType;
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
     * @param errorCode 
     * @param builderCallback 
     * @returns 
     */
    protected replaceChildren(conditionType: ConditionType, 
        builderCallback: (newCondBuilder: IStartConditionBuilder) => void): void
    {
        assertFunction(builderCallback);
        let existingValidator = this.getConfig()!;
        let existingCondition = existingValidator.conditionConfig;
        if (!existingCondition)
            this.reportError(new Error('Existing condition is null or undefined.')); // throws
        let startBuilder = this.services.fluentFactory.createStartConditionBuilder(this as any);
        builderCallback(startBuilder);
        let newCondition = startBuilder.getConfig()!;
        if (!newCondition)
            this.reportError(new Error('Child builder was not used to define a Condition.')); // throws
        let originalErrorCode = resolveErrorCode(existingValidator);
        if (originalErrorCode === conditionType) {
            // Logic to combine the existing condition with the new one using AND logic
            let owner = (<ConditionWithChildrenBaseConfig>existingCondition);
            if (owner.conditionConfigs == null) // null/undefined
                owner.conditionConfigs = [];
            owner.conditionConfigs.push(newCondition);
        // lock down the original error code
            existingValidator.errorCode = originalErrorCode;

            return;
        }
            // Logic to combine the existing condition with the new one using AND logic
        let combinedCondition: ConditionWithChildrenBaseConfig = {
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
        let existingValidator = this.getConfig()!;
        let thenConfig = existingValidator.conditionConfig;
        if (!thenConfig)
            this.reportError(new Error('Existing condition is null or undefined.'));    // throws
        let startBuilder = this.services.fluentFactory.createStartConditionWithOneChildBuilder(this as any);
        builderCallback(startBuilder);
        let whenToEnableConfig = startBuilder.getConfig()!;
        if (!whenToEnableConfig)
            this.reportError(new Error('Child builder was not used to define a Condition.')); // throws

        existingValidator.conditionConfig = <WhenConditionConfig>{
            conditionType: ConditionType.When,
            whenToEnableConfig: whenToEnableConfig,
            thenConfig: thenConfig
        };
    }

        /**
     * If the validator must not run, it can be disabled. It is preferred
     * that you combine another condition with this one instead of simply disabling it.
     * Use and(), or(), or whenToEnable() to combine conditions instead of simply disabling the validator.
     */
    public disable(): void
    {
        let existingValidator = this.getConfig()!;
        existingValidator.enabled = false;
    }
}