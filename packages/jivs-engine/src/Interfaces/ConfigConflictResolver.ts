/**
 * 
 * @module ValueHosts/Types/ConfigConflictResolver
 */
import { ILoggerService } from '../Interfaces/LoggerService';
import { ConditionConfig } from '../Interfaces/Conditions';
import { ValidatorConfig } from './Validator';
import { ValueHostConfig } from './ValueHost';
import { ValidatorsValueHostBaseConfig } from './ValidatorsValueHostBase';

/**
 * @inheritdoc ValueHosts/ConcreteClasses/ConfigConflictResolver!ConfigConflictResolverBase:class
 */
export interface IConfigConflictResolverBase<TConfig> {

    /**
     * Assigns the rule for a property on any Config and subclass.
     * Once assigned, some rules allow change and others, like 'locked' cannot be changed and throw an error.
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
    setConditionConflictRule(containingPropertyName: string, resolver: ConditionConflictResolverHandler): void;    

    /**
     * Available to report details of merging. Preventing replacement is generally a warning
     * because the user might expect their supplied value to be overwriting the destination.
     * Expected to be assigned by ValueHostBuilder.
     * Call log() to use it with null taken into account.
     */
    logger: ILoggerService | null;

    /**
     * PropertyConflictResolverHandler for properties that host a ConditionConfig object.
     * This call expects the property to be defined in both source and destination.
     * @param propertyName 
     * @param source 
     * @param destination 
     * @param identity 
     */
    handleConditionConfigProperty(source: TConfig, destination: TConfig, propertyName: string, identity: MergeIdentity): PropertyConflictResolverHandlerResult;
}

/**
 * Interface for all ConfigConflictResolvers built for the ValueHostConfig and its subclasses.
 */
export interface IValueHostConflictResolver extends IConfigConflictResolverBase<ValueHostConfig> {
    /**
     * Entrypoint to resolve ValueHostConfig whose valueHostName matches.
     * As it arrives here, it already has valueHostName and errorCode assigned.
     */    
    resolve(source: ValueHostConfig, destination: ValueHostConfig): void;
}

/**
 * Interface for all ConfigConflictResolvers built for the ValidatorConfig.
 */
export interface IValidatorConflictResolver extends IConfigConflictResolverBase<ValidatorConfig> {
    /**
     * Handles merging and conflict resolution for the validatorConfigs in
     * both source and destination.
     * Depends on user customizable 
     * @param source 
     * @param destination 
     * @returns 
     */
    resolve(source: ValidatorsValueHostBaseConfig, destination: ValidatorsValueHostBaseConfig): void;

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
     * @param validatorSrc 
     * @param validatorsInDest 
     * @param identity 
     */
    identifyValidatorConflict(validatorSrc: ValidatorConfig,
        validatorsInDest: Array<ValidatorConfig>, identity: MergeIdentity):
        ValidatorConfig | undefined
}

/**
 * Possible actions to take to resolve a property found in both configs.
 */
export type PropertyConflictResolverAction =
    /**
     * Copy the value overwriting phase 1
     */
    'replace' |
    /**
     * No change allowed to phase 1 property value
     */
    'nochange' |

    /**
     * delete the property
     */
    'delete' |

    /**
     * Replace when not null. Delete when null.
     */
    'replaceOrDelete';

/**
 * Settings (aside from an event handler) that are permitted in PropertyConflictRules. 
 */
export type PropertyConflictResolverSetting =
    /**
     * For values not locked, these are the actions that can be taken.
     */
    PropertyConflictResolverAction |
    /**
     * The user cannot change this property. It is always 'nochange' behavior.
     * Applied automatically to validatorConfigs and conditionConfig.
     */
    'locked';

/**
 * This handler is an alternative to PropertyConflictResolverAction, allowing you to deal with the issue
 * in your own way. You can return either useAction with an Action or useValue with the replacement value.
 * @param identify - Identifies either the ValueHostName or ErrorCode of the containing Config object.
 */
export type PropertyConflictResolverHandler<T> = (source: T, destination: T, propertyName: string, identity: MergeIdentity) => PropertyConflictResolverHandlerResult;

/**
 * The result for a PropertyConflictResolverHandler. It should return one of the two properties,
 * leaving the other undefined.
 */
export interface PropertyConflictResolverHandlerResult
{
    /**
     * Provide the action to take and the caller will follow it.
     * Use 'nochange' to prevent any changes.
     */
    useAction?: PropertyConflictResolverAction,
    /**
     * Provide the value to set to the destination property.
     */
    useValue?: any
}
/**
 * PropertiesConflictRules uses this as the values.
 */
export type PropertyConflictRule<T> = PropertyConflictResolverSetting | PropertyConflictResolverHandler<T>;

export type ConditionConflictResolverAction =
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
 * This handler is an alternative to ConditionConflictResolverAction, allowing you to deal with the issue
 * in your own way. You can return either useAction with an Action or useValue with the replacement value.
 * @param identify - Identifies either the ValueHostName or ErrorCode of the containing Config object.
 */
export type ConditionConflictResolverHandler = (source: ConditionConfig, destination: ConditionConfig, identity: MergeIdentity) => ConditionConflictResolverHandlerResult;

/**
 * The result for a PropertyConflictResolverHandler. It should return one of the two properties,
 * leaving the other undefined.
 */
export interface ConditionConflictResolverHandlerResult
{
    /**
     * Provide the action to take and the caller will follow it.
     * Use 'nochange' to prevent any changes.
     */
    useAction?: ConditionConflictResolverAction,
    /**
     * Provide the value to set to the destination property.
     */
    useValue?: ConditionConfig
}

/**
 * Used by your PropertyConflictResolverHandler function to know what specifically is being resolved.
 */
export interface MergeIdentity
{
    valueHostName: string;
    errorCode?: string;
    containingProperty?: string;
}

/**
 * Used by ValidatorConflictResolver to identify if the source ValidatorConfig
 * is in conflict with a destination ValidatorConfig. If one is identified,
 * it is returned and the caller should use ValidatorConflictResolver.resolve
 * to determine how to handle the conflict.
 */
export type ConditionConflictIdentifierHandler = (validatorSrc: ValidatorConfig,
    validatorsInDest: Array<ValidatorConfig>, identity: MergeIdentity) =>
    ValidatorConfig | undefined;