/**
 * 
 * @module Services/Types/ConfigMergeService
 */
import { ILoggerService } from './LoggerService';
import { ConditionConfig } from './Conditions';
import { ValidatorConfig } from './Validator';
import { ValueHostConfig } from './ValueHost';
import { ValidatorsValueHostBaseConfig } from './ValidatorsValueHostBase';
import { IServiceWithAccessor } from './Services';

/**
 * @inheritdoc Services/ConcreteClasses/ConfigMergeService!ConfigMergeServiceBase:class
 */
export interface IConfigMergeServiceBase<TConfig> extends IServiceWithAccessor {

    /**
     * Assigns the rule for a property on any Config and subclass.
     * Once assigned, some rules allow change and others, like 'locked' cannot be changed and throw an error.
     * If no rule has been assigned to a property, merge() assumes "replace" for that property.
     * @param propertyName 
     * @param rule 
     */
    setPropertyConflictRule(propertyName: string, rule: PropertyConflictRule<TConfig>): void;

    /**
     * Assigns the resolver function for a condition, associated with the property containing
     * that ConditionConfig.
     * Any containingPropertyName unassigned is effectively 'nochange'.
     * @param containingPropertyName 
     * @param resolver 
     */
    setConditionConflictRule(containingPropertyName: string, resolver: ConditionConfigMergeServiceHandler): void;    

    /**
     * PropertyConfigMergeServiceHandler for properties that host a ConditionConfig object.
     * This call expects the property to be defined in both source and destination.
     * @param propertyName 
     * @param source 
     * @param destination 
     * @param identity 
     */
    handleConditionConfigProperty(source: TConfig, destination: TConfig, propertyName: string, identity: MergeIdentity): PropertyConfigMergeServiceHandlerResult;
}

/**
 * Interface for all ConfigMergeServices built for the ValueHostConfig and its subclasses.
 */
export interface IValueHostConfigMergeService extends IConfigMergeServiceBase<ValueHostConfig> {
    /**
     * Attempts to merge the source's properties into the destination.
     * It only makes changes to the destination based on the rules
     * of setPropertyConfigRule()
     */    
    merge(source: ValueHostConfig, destination: ValueHostConfig): void;

    /**
     * Identifies a ValueHostConfig in the destination that should be merged
     * with the source. If none need to be merged, it returns null
     * and the caller should add their ValueHostConfig to ValidationManagerConfig.ValueHostConfigs.
     * @param source 
     * @param destinations 
     */
    identifyValueHostConflict(source: ValueHostConfig,
        destinations: Array<ValueHostConfig>):
        ValueHostConfig | undefined;    
}

/**
 * Interface for all ConfigMergeServices built for the ValidatorConfig.
 */
export interface IValidatorConfigMergeService extends IConfigMergeServiceBase<ValidatorConfig> {
    /**
     * Handles merging and conflict resolution for the validatorConfigs in
     * both source and destination.
     * Depends on user customizable 
     * @param source 
     * @param destination 
     * @returns 
     */
    merge(source: ValidatorsValueHostBaseConfig, destination: ValidatorsValueHostBaseConfig): void;

    /**
     * Provides a function to determine if the validatorSrc is in conflict with
     * one in the destination. It must always be set, and defaults to
     * identifyValidatorConflict().
     */
    identifyHandler: ConditionConflictIdentifierHandler;

    /**
     * Default conflict handler function for identifyHandler property.
     * This determines a conflict when the destination validatorConfig
     * has the same errorCode as the validatorSrc.
     * @param source 
     * @param destinations 
     * @param identity 
     */
    identifyValidatorConflict(source: ValidatorConfig,
        destinations: Array<ValidatorConfig>, identity: MergeIdentity):
        ValidatorConfig | undefined;
}

/**
 * Possible actions to take to resolve a property found in both configs.
 */
export type PropertyConfigMergeServiceAction =
    /**
     * Copy the value overwriting phase 1
     */
    'replace' |
    /**
     * Copy the value assigned in phase 1 if the phase 2 value is not null
     */
    'replaceExceptNull' |
    /**
     * No change allowed to phase 1 property value
     */
    'nochange' |

    /**
     * delete the property from phase 1
     */
    'delete' |

    /**
     * Replace when not null. Delete when null.
     */
    'replaceOrDelete';

/**
 * Settings (aside from an event handler) that are permitted in PropertyConflictRules. 
 */
export type PropertyConfigMergeServiceSetting =
    /**
     * For values not locked, these are the actions that can be taken.
     */
    PropertyConfigMergeServiceAction |
    /**
     * The user cannot change this property. It is always 'nochange' behavior.
     * Applied automatically to validatorConfigs and conditionConfig.
     */
    'locked';

/**
 * This handler is an alternative to PropertyConfigMergeServiceAction, allowing you to deal with the issue
 * in your own way. You can return either useAction with an Action or useValue with the replacement value.
 * @param identify - Identifies either the ValueHostName or ErrorCode of the containing Config object.
 */
export type PropertyConfigMergeServiceHandler<T> = (source: T, destination: T, propertyName: string, identity: MergeIdentity) => PropertyConfigMergeServiceHandlerResult;

/**
 * The result for a PropertyConfigMergeServiceHandler. It should return one of the two properties,
 * leaving the other undefined.
 */
export interface PropertyConfigMergeServiceHandlerResult
{
    /**
     * Provide the action to take and the caller will follow it.
     * Use 'nochange' to prevent any changes.
     */
    useAction?: PropertyConfigMergeServiceAction,
    /**
     * Provide the value to set to the destination property.
     */
    useValue?: any
}
/**
 * PropertiesConflictRules uses this as the values.
 */
export type PropertyConflictRule<T> = PropertyConfigMergeServiceSetting | PropertyConfigMergeServiceHandler<T>;

export type ConditionConfigMergeServiceAction =
    /**
     * Leave the destination condition unchanged
     */
    'nochange' |
    /**
     * Remove the condition in the destination by deleting its property
     */
    'delete' |
    /**
     * Creates an AllCondition with the conditions from both phase 1 and phase 2 as its children.
     * Once set, it cannot be changed.
     */
    'all' |
    /**
     * Creates an AnyCondition with the conditions from both phase 1 and phase 2 as its children.
     * Once set it cannot be changed.
     */
    'any';
    
/**
 * This handler is an alternative to ConditionConfigMergeServiceAction, allowing you to deal with the issue
 * in your own way. You can return either useAction with an Action or useValue with the replacement value.
 * @param identify - Identifies either the ValueHostName or ErrorCode of the containing Config object.
 */
export type ConditionConfigMergeServiceHandler = (source: ConditionConfig, destination: ConditionConfig, identity: MergeIdentity) => ConditionConfigMergeServiceHandlerResult;

/**
 * The result for a PropertyConfigMergeServiceHandler. It should return one of the two properties,
 * leaving the other undefined.
 */
export interface ConditionConfigMergeServiceHandlerResult
{
    /**
     * Provide the action to take and the caller will follow it.
     * Use 'nochange' to prevent any changes.
     */
    useAction?: ConditionConfigMergeServiceAction,
    /**
     * Provide the value to set to the destination property.
     */
    useValue?: ConditionConfig
}

/**
 * Used by your PropertyConfigMergeServiceHandler function to know what specifically is being resolved.
 */
export interface MergeIdentity
{
    valueHostName: string;
    errorCode?: string;
    containingProperty?: string;
}

/**
 * Used by ValidatorConfigMergeService to identify if the source ValidatorConfig
 * is in conflict with a destination ValidatorConfig. If one is identified,
 * it is returned and the caller should use ValidatorConfigMergeService.resolve
 * to determine how to handle the conflict.
 */
export type ConditionConflictIdentifierHandler = (validatorSrc: ValidatorConfig,
    validatorsInDest: Array<ValidatorConfig>, identity: MergeIdentity) =>
    ValidatorConfig | undefined;