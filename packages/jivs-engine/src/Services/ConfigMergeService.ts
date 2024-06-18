/**
 * @module Services/ConcreteClasses/ConfigMergeService
 */

import { CodingError } from '../Utilities/ErrorHandling';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { ValidatorConfig } from '../Interfaces/Validator';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { resolveErrorCode } from '../Utilities/Validation';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { AllMatchConditionConfig } from '../Conditions/ConcreteConditions';
import { ConditionType } from '../Conditions/ConditionTypes';
import { ConditionConfig } from '../Interfaces/Conditions';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import {
    PropertyConflictRule, MergeIdentity, PropertyConfigMergeServiceHandlerResult,
    IConfigMergeServiceBase, IValueHostConfigMergeService, IValidatorConfigMergeService,
    ConditionConfigMergeServiceHandler,
    ConditionConfigMergeServiceAction,
    ConditionConflictIdentifierHandler
} from '../Interfaces/ConfigMergeService';
import { deepEquals } from '../Utilities/Utilities';
import { ServiceWithAccessorBase } from './ServiceWithAccessorBase';

/**
 * The ValidationManagerConfig file may be populated in 2 phases:
 * - Phase 1: Business Logic provides its ValueHosts and validators. Many aspects of this is 
 *   not ideal for the UI, including anything localizable, additional validators, and additional enabler conditions.
 * - Phase 2: UI updates what the Business Logic created, and adds its own ValueHosts and validators.
 *   The UI developer will use the ValueHostBuilder and fluent syntax to describe their changes.
 * 
 * The IConfigMergeService interface and its class are used by Phase 2. It allows the UI developer
 * to effectively create the same named ValueHosts, but with different characteristics.
 * ConfigMergeService will merge the business logic's configuration but only where it does not lose
 * the goals established, especially in validation rules.
 * 
 * Suppose that Phase 1 creates this (with services passed to it from the UI):
 * ```ts
 * let vmConfig: ValidationManagerConfig = { services: services };
 * let builder = build(vmConfig);
 * builder.property('Field1', LookupKey.Number, { label: 'Field 1' }).notNull().greaterThanValue(10);
 * // same as:
 * {
 *   valueHostType: 'Property',
 *   valueHostName: 'Field1',
 *   dataType: 'Number',
 *   label: 'Field 1',
 *   validatorConfigs: [
 *     {
 *       conditionConfig: { conditionType: 'NotNull' }
 *     },
 *     {
 *       conditionConfig: { conditionType: 'GreaterThanValue', value: 10 }
 *     }
 *   ]
 * }
 * ```
 * The UI can use the ConfigMergeService by installing it with the builder.clientImplementation() function.
 * From that point on, builder will make it available to the fluent syntax system and fluent will
 * call upon it to address conflicts.
 * 
 * Here is the Phase 2 continuation of the above:
 * ```ts
 * builder.input('Field1', LookupKey.Integer, { label: 'Name', labell10n: 'ProductNameLabel', parserLookupKey: LookupKey.Number }).requireText()
 * ```
 * The resulting valueHostConfig will be (* where changes where made)
 * ```ts
 * {
 *   valueHostType: 'Input',    //* upscaled from Property
 *   valueHostName: 'Field1',
 *   dataType: 'Integer',       //* upscaled from Number
 *   label: 'Name',     //*
 *   labell10n: 'ProductNameLabel', //*
 *   parserLookupKey: 'Number' //*
 *   validatorConfigs: [
 *     {
 *       conditionConfig: { conditionType: 'RequireText' } //* upscaled from NotNull
 *     },
 *     {
 *       conditionConfig: { conditionType: 'GreaterThanValue', value: 10 }
 *     }
 *   ]
 * }
 * ```
 * 
 * 
 * ConfigMergeService has to deal with several types of Config objects:
 * - ValueHost (including all subclasses)
 * - Validator
 * - Condition
 * 
 * Its basic behavior is to copy a list of properties from phase 2 over phase 1's object.
 * When phase2 has a property not found in phase1, its just copied.
 * When phase1 and phase2 both have that property (not assigned to undefined), we have to resolve the conflict.
 * The user controls some of those properties, providing rules of: replace, nochange, delete, and a callback.
 * 
 * There are some properties that are strictly controlled by ConfigMergeService like ValueHostName (cannot change it)
 * and ValueHostType (changes automatically for upscaling Property to Input). Also ValidationConfig, ConditionConfig cannot be 
 * specified for replacement. But their children can. 
 * 
 * Condition properties are preconfigured to use a callback to handle condition resolution.
 * You must supply a function that determines how you want the destination's condition to change.
 * 
 */
export abstract class ConfigMergeServiceBase<TConfig> extends ServiceWithAccessorBase
    implements IConfigMergeServiceBase<TConfig> {

    public dispose(): void {
        super.dispose();
        this._configConditions = undefined!;
        this._configProperties = undefined!;
        this._cacheNoChangePropertyNames = undefined;
    }
    /**
     * Assigns the rule for a property on any Config and subclass.
     * Once assigned, some rules allow change and others, like 'locked' cannot be changed and throw an error.
     * If no rule has been assigned, merge() assumes "replace".
     * @param propertyName 
     * @param rule 
     */
    public setPropertyConflictRule(propertyName: string, rule: PropertyConflictRule<TConfig>): void {
        let current = this.configProperties.get(propertyName);
        switch (current) {
            case 'locked':
                throw new CodingError(`${propertyName} is locked`);
            default:
                if (typeof current === 'function')
                    throw new CodingError('Cannot change');
                break;
        }

        this.configProperties.set(propertyName, rule);
        this._cacheNoChangePropertyNames = undefined;
    }
    /**
     * The rule assigned to the property or undefined if not assigned.
     * @param propertyName 
     * @returns 
     */
    public getPropertyConflictRule(propertyName: string): PropertyConflictRule<TConfig> | undefined {
        return this.configProperties.get(propertyName);
    }

    protected get configProperties(): Map<string, PropertyConflictRule<TConfig>> {
        return this._configProperties;
    }
    private _configProperties: Map<string, PropertyConflictRule<TConfig>> = new Map<string, PropertyConflictRule<TConfig>>();

    /**
     * Assigns the resolver function for a condition, associated with the property containing
     * that ConditionConfig.
     * Any containingPropertyName unassigned is effectively 'nochange'.
     * Your function can indicate nochange, delete (destination),
     * all (combine under an AllMatchCondition), any (combine under an AnyMatchCondition),
     * or it can supply any condition it wants, hopefully based on the source information.
     * Your function should be very selective about making any changes the condition from phase 1.
     * Take into consideration the ValueHostName which is available in the identifier property.
     * @param containingPropertyName
     * @param resolver
     */
    public setConditionConflictRule(containingPropertyName: string, resolver: ConditionConfigMergeServiceHandler): void {
        let existing = this.configConditions.get(containingPropertyName);
        if (typeof existing === 'function')
            throw new CodingError('Cannot change');
        this.configConditions.set(containingPropertyName, resolver);
    }
    /**
     * The ConditionConfigMergeServiceHandler assigned to the property or undefined if not assigned.
     * @param containingPropertyName 
     * @returns 
     */
    public getConditionConflictRule(containingPropertyName: string): ConditionConfigMergeServiceHandler | undefined {
        return this.configConditions.get(containingPropertyName);
    }

    // Key is the containingPropertyName
    protected get configConditions(): Map<string, ConditionConfigMergeServiceHandler> {
        return this._configConditions;
    }
    private _configConditions: Map<string, ConditionConfigMergeServiceHandler> = new Map<string, ConditionConfigMergeServiceHandler>();

    protected log(message: (() => string) | string, logLevel: LoggingLevel, logCategory?: LoggingCategory): void {
        if (this.hasServices()) {
            let logger = this.services.loggerService;
            if (logger.minLevel <= logLevel) {
                logger.log((typeof message === 'function') ? message() : message,
                    logLevel, logCategory ?? LoggingCategory.Configuration, this.constructor.name);
            }
        }
    }

    /**
     * Applies the ConfigMergeService rules to all properties found in the source config.
     * If the destination does not have the same property, it is copied.
     * Otherwise, we use the ConfigMergeService rule.
     * If there is no ConfigMergeService rule for a property found on source, 
     * it is always copied.
     * The result is changes made to destination.
     * If the rule is 'delete', then it checks for the property in the destination config
     * and deletes that, without regard to the property being present in the source.
     * @param source 
     * @param destination 
     * @param identity - Used by your PropertyConfigMergeServiceHandler function to know what specifically is being resolved.
     */
    protected mergeConfigs(source: TConfig, destination: TConfig, identity: MergeIdentity): void {
        for (let propertyName in source) {
            if (destination[propertyName] === undefined) {
                destination[propertyName] = source[propertyName];
                this.log(() => `${logLabel(identity, propertyName)} assigned`, LoggingLevel.Info);
                continue;
            }
            let rule = this.configProperties.get(propertyName);
            this.mergeProperty(propertyName, rule ?? 'replace', source, destination, identity);
        }
        // delete action determined by property on the destination
        this.configProperties.forEach((rule, propertyName) => {
            if (rule === 'delete')
                this.mergeProperty(propertyName, rule, source, destination, identity);
        });
    }
    /**
     * Handle one property based on the rule.
     * Expects both source and destination to have the same property.
     */
    protected mergeProperty(propertyName: string, rule: PropertyConflictRule<TConfig>,
        source: TConfig, destination: TConfig, identity: MergeIdentity): void {
        switch (rule) {
            case 'nochange':
            case 'locked':
                this.log(() => `${logLabel(identity, propertyName)}. Rule prevents changes.`, LoggingLevel.Debug);
                break;  // no change for all of these
            case 'replace':
            case 'replaceExceptNull':
                let sourceVal = (source as any)[propertyName];
                if (sourceVal === undefined)
                    break;
                if (rule === 'replaceExceptNull' && sourceVal === null)
                    break;
                let destVal = (destination as any)[propertyName];
                if (deepEquals(sourceVal, destVal))
                    break;
                (destination as any)[propertyName] = sourceVal;
                this.log(() => `${logLabel(identity, propertyName)} replaced`, LoggingLevel.Info);
                break;
            case 'delete':
                if ((destination as any)[propertyName] !== undefined) {
                    delete (destination as any)[propertyName];
                    this.log(() => `${logLabel(identity, propertyName)} deleted`, LoggingLevel.Info);
                }
                break;
            case 'replaceOrDelete':
                let sourceValue = (source as any)[propertyName];
                this.mergeProperty(propertyName, (sourceValue !== null) ? 'replace' : 'delete',
                    source, destination, identity);
                break;
            default:
                if (typeof rule === 'function') {
                    let result = rule.call(this, source, destination, propertyName, identity);
                    if (result.useValue) {
                        (destination as any)[propertyName] = result.useValue;
                        this.log(() => `${logLabel(identity, propertyName)} replaced`, LoggingLevel.Debug);
                    }
                    else if (result.useAction)
                        this.mergeProperty(propertyName, result.useAction, source, destination, identity); // recursion
                    return;
                }
                throw new CodingError(`Unknown rule ${rule}`);
        }
    }

    /**
     * PropertyConfigMergeServiceHandler for properties that host a ConditionConfig object.
     * This call expects the property to be defined in both source and destination.
     * @param propertyName 
     * @param source 
     * @param destination 
     * @param identity 
     */
    public handleConditionConfigProperty(source: TConfig, destination: TConfig, propertyName: string, identity: MergeIdentity): PropertyConfigMergeServiceHandlerResult {
        let sourceCond = (source as any)[propertyName];
        if (sourceCond === null)
            return { useAction: 'nochange' };
        let destCond = (destination as any)[propertyName];
        let fn = this.configConditions.get(propertyName);
        if (!fn) {
            if (destCond === null)
                return { useValue: sourceCond };
            return { useAction: 'nochange' };
        }
        let updatedIdentity: MergeIdentity = { ...identity, containingProperty: propertyName };
        let result = fn.call(this, sourceCond, destCond, updatedIdentity);
        if (result.useValue)
            return { useValue: result.useValue };
        if (result.useAction) {
            let action = this.replaceCondition(sourceCond, destCond, updatedIdentity, result.useAction);
            if (typeof action === 'object')
                return { useValue: action };
            return { useAction: action };
        }
        throw new CodingError('conditionConfig function has invalid result');
    }

    /**
     * Determines how to handle when both the source and destination have a condition with the same conditionType.
     * Follows the rule set by setConditionConflictRule.
     * If there is no rule but the destination has a null condition,
     * it is replaced by the source condition. This is the only place
     * where replacement happens automatically. If you wanted to replace
     * any other case, provide a rule with function to resolve it,
     * as great care should be taken on overwriting rules from phase 1.
     * It does not change anything, but the result tells the caller how to proceed.
     * @param source 
     * @param destination 
     * @param identity 
     * @param action
     */
    protected replaceCondition(source: ConditionConfig, destination: ConditionConfig, identity: MergeIdentity, action: ConditionConfigMergeServiceAction): ConditionConfig | 'delete' | 'nochange' {
        switch (action) {
            case 'all':
                {
                    let container = <AllMatchConditionConfig>{
                        conditionType: ConditionType.All,
                        category: destination.category,
                        conditionConfigs: [destination, source]
                    };
                    if (destination.category)
                        container.category = destination.category;
                    return container;
                }
            case 'any':
                {
                    let container = <AllMatchConditionConfig>{
                        conditionType: ConditionType.Any,
                        category: destination.category,
                        conditionConfigs: [destination, source]
                    };
                    if (destination.category)
                        container.category = destination.category;
                    return container;
                }
            default:
                return action;
        }
    }
    /**
     * Exposes property names that are not expected to be changed by the rules.
     * Ignores rules with functions. 
     * Intent is to allow ValueHostsManagerConfigModifier to know of properties
     * to strip out instead of allowing them to make it into the merge code.
     * Value is cached upon first request. Cache is cleared if rules are changed.
     * @returns 
     */
    public getNoChangePropertyNames(): Array<string>
    {
        if (!this._cacheNoChangePropertyNames) {
            let namesFound: Array<string> = [];
            for (let [name, rule] of this.configProperties)
                if (rule === 'nochange' || rule === 'locked' || rule === 'delete')
                    namesFound.push(name);
            this._cacheNoChangePropertyNames = namesFound;
        }
        return this._cacheNoChangePropertyNames;
    }
    private _cacheNoChangePropertyNames: Array<string> | undefined = undefined;    
}

/**
 * Default ConfigMergeService for ValueHosts. Automatically used if none is supplied to the ValueHostBuilder.
 * It locks only the valueHostName and validatorConfigs.
 * It upscales ValueHostType from Property to Input (but not anything else).
 * It uses the ValidatorConfigResolver to handle all validatorConfigs.
 */
export class ValueHostConfigMergeService extends ConfigMergeServiceBase<ValueHostConfig>
    implements IValueHostConfigMergeService {

    constructor() {
        super();

        this.setPropertyConflictRule('name', 'locked');
        this.setPropertyConflictRule('validatorConfigs', 'locked');
        this.setPropertyConflictRule('valueHostType', this.updateValueHostType);
        this.setPropertyConflictRule('dataType', 'replaceExceptNull');

        // everything else has no initial value which means 'replace'
    }

    /**
     * Handling upscaling for the valueHostType property, which switching from Property to Input
     * when the source is Input. No change otherwise.
     * @param source 
     * @param destination 
     * @param identity - Used by your PropertyConfigMergeServiceHandler function to know what specifically is being resolved.
     * @param propertyName 
     * @returns 
     */
    protected updateValueHostType(source: ValueHostConfig, destination: ValueHostConfig, propertyName: string, identity: MergeIdentity): PropertyConfigMergeServiceHandlerResult {
        if (source.valueHostType === ValueHostType.Input && destination.valueHostType === ValueHostType.Property)
            return { useValue: ValueHostType.Input };
        if (source.valueHostType !== destination.valueHostType)
            this.log(() => `Will not change ValueHostType from ${destination.valueHostType} to ${source.valueHostType}.`, LoggingLevel.Warn);
        return { useAction: 'nochange' };
    }

    /**
     * Attempts to merge the source's properties into the destination.
     * It only makes changes to the destination based on the rules
     * of setPropertyConfigRule()
     */    
    public merge(source: ValueHostConfig, destination: ValueHostConfig): void {
        if (source.name !== destination.name)
            return;
        this.mergeConfigs(source, destination, { valueHostName: destination.name });
        let vcms = this.services?.validatorConfigMergeService;  // may be undefined if services is ValueHostsServices
        if (vcms)
            vcms.merge(source as ValidatorsValueHostBaseConfig,
                destination as ValidatorsValueHostBaseConfig);
    }

    /**
     * Identifies a ValueHostConfig in the destination that should be merged
     * with the source. If none need to be merged, it returns null
     * and the caller should add their ValueHostConfig to ValidationManagerConfig.ValueHostConfigs.
     * @param source 
     * @param destinations 
     */
    public identifyValueHostConflict(source: ValueHostConfig,
        destinations: Array<ValueHostConfig>):
        ValueHostConfig | undefined
    {
        return destinations.find((item) => item.name === source.name);
    }
}

/**
 * Default ConfigMergeService for Validators. Automatically used if none is supplied to the default ValueHostConfigMergeService.
 * It copies all properties except: errorCode, conditionConfig, enablerConfig, conditionCreator, enablerCreator.
 * It uses the conditionConfigResolver rules to handle any conditionConfig. It defaults the Creators to 'nochange',
 * meaning you could attach a function to it to handle it yourself.
 */
export class ValidatorConfigMergeService extends ConfigMergeServiceBase<ValidatorConfig>
    implements IValidatorConfigMergeService {
    constructor() {
        super();
        this.setPropertyConflictRule('validatorType', 'locked');
        this.setPropertyConflictRule('errorCode', 'nochange');
        this.setPropertyConflictRule('conditionConfig', this.handleConditionConfigProperty);
        this.setPropertyConflictRule('enablerConfig', this.handleConditionConfigProperty);
        this.setPropertyConflictRule('conditionCreator', 'nochange');   //!!! haven't worked on a solution for the creator callback functions
        this.setPropertyConflictRule('enablerCreator', 'nochange');

        // everything else has no initial value which means 'replace'
    }

    public dispose(): void {
        super.dispose();
        this._identifyHandler = undefined!;
    }

    /**
     * Provides a function to determine if the validatorSrc is in conflict with
     * one in the destination. It must always be set, and defaults to
     * identifyValidatorConflict().
     */
    public get identifyHandler(): ConditionConflictIdentifierHandler {
        return this._identifyHandler ?? this.identifyValidatorConflict;
    }
    public set identifyHandler(value: ConditionConflictIdentifierHandler) {
        this._identifyHandler = value;
    }
    private _identifyHandler: ConditionConflictIdentifierHandler | null = null;

    /**
     * Determines if source is in conflict with an existing ValidatorConfig
     * in destinations. Returns the destination in conflict,
     * ready to be passed to validatorConfigMergeService.resolve.
     * @param source 
     * @param destinations
     * @param identity 
     */
    public identifyValidatorConflict(source: ValidatorConfig,
        destinations: Array<ValidatorConfig>, identity: MergeIdentity):
        ValidatorConfig | undefined {
        let srcErrorCode = identity.errorCode ?? resolveErrorCode(source);
        return destinations.find((item) => resolveErrorCode(item) === srcErrorCode);
    }

    /**
     * Handles merging and conflict resolution for the validatorConfigs in
     * both source and destination.
     * Depends on user customizable 
     * @param source 
     * @param destination 
     * @returns 
     */
    public merge(source: ValidatorsValueHostBaseConfig, destination: ValidatorsValueHostBaseConfig): void {

        if (!source.validatorConfigs)
            return;

        if (!destination.validatorConfigs)
            destination.validatorConfigs = [];

        for (let validatorSrc of source.validatorConfigs) {
            let identity: MergeIdentity = { valueHostName: destination.name, errorCode: resolveErrorCode(validatorSrc) };
            let validatorDest = this.identifyHandler.call(this, validatorSrc, destination.validatorConfigs, identity)
            if (validatorDest) {
                if (validatorSrc.conditionConfig?.conditionType !==
                    validatorDest.conditionConfig?.conditionType)
                    this.log(() => `ConditionType mismatch for ${identity.errorCode}`, LoggingLevel.Warn);

                this.mergeConfigs(validatorSrc, validatorDest, identity);
            }
            else {
                destination.validatorConfigs.push(validatorSrc);
                this.log(() => `Validator ${identity.errorCode} added to ${logLabel({ valueHostName: destination.name, containingProperty: 'validatorConfigs' }, null)}`, LoggingLevel.Debug);
            }
        }
    }
}

/**
 * Provide text for the log that identifies the specific detail being logged.
 * @param identity 
 * @param propertyName 
 * @returns 
 */
function logLabel(identity: MergeIdentity, propertyName: string | null): string {
    let label = `${identity.valueHostName}.`;   // assumes valueHostName is always defined
    if (identity.errorCode)
        label += `${identity.errorCode}.`;
    if (identity.containingProperty)
        label += `${identity.containingProperty}`;
    if (propertyName)
        label += propertyName;
    return label;
}