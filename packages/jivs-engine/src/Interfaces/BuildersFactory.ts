/**
 * @module DataTypes/Types
 */

import { IServiceWithAccessor } from './Services';
import { ConditionConfig } from './Conditions';
import {
    IBuilderConfigHost, CompleteConfigBuilderHandler, IConditionBuilder,
    IValidatorBuilder, IStartConditionBuilder, IStartConditionWithChildrenBuilder,
    IStartConditionWithOneChildBuilder
} from './ChildBuilders';
import { FieldValueHostConfig } from './FieldValueHost';
import { ConditionType } from '../Conditions/ConditionTypes';
import { ValidatorsValueHostBaseConfig } from './ValidatorsValueHostBase';
import { ValidationManagerConfig } from './ValidationManager';
import { IManagerConfigBuilder } from './ManagerConfigBuilder';

/**
 * Base interface to provide a factory that supplies:
 * 1. ValidatorBuilder or subclass replacement
 * 2. ConditionBuilder or subclass replacement
 */
export interface IBuildersFactory extends IServiceWithAccessor
{
    /**
     * Replaces the current ValidatorBuilderCreator
     * @param replacement 
     */
    setValidatorBuilderCreator(replacement:
        (parentConfig: FieldValueHostConfig) => IValidatorBuilder): void;

    /**
     * Replaces the current ValidatorBuilderCreator
     * @returns 
     */
    setValidatorBuilderCreator(replacement:
        (parentConfig: FieldValueHostConfig) => IValidatorBuilder): void;
    /**
     * Replaces the current ConditionBuilderCreator
     * @param replacement 
     */
    setConditionBuilderCreator(replacement: 
        (parentBuilder: IBuilderConfigHost<object>, 
        completed?: CompleteConfigBuilderHandler<any>) => IConditionBuilder): void;
    
    /**
     * Replaces the current StartConditionBuilderCreator
     * @param replacement 
     */
    setStartConditionBuilderCreator(replacement: 
        (parentBuilder: IBuilderConfigHost<object>, 
        completed?: CompleteConfigBuilderHandler<any>) => IStartConditionBuilder): void;
    /**
     * Replaces the current StartConditionWithChildrenBuilderCreator
     * @param replacement 
     */
    setStartConditionWithChildrenBuilderCreator(replacement: 
        (parentBuilder: IBuilderConfigHost<object>, 
        conditionType: ConditionType) => IStartConditionWithChildrenBuilder): void;
    /**
     * Replaces the current StartConditionWithOneChildBuilderCreator
     * @param replacement 
     */
    setStartConditionWithOneChildBuilderCreator(replacement: 
        (parentBuilder: IBuilderConfigHost<object>, 
        completed?: CompleteConfigBuilderHandler<any>) => IStartConditionWithOneChildBuilder): void;

    /**
     * Creates the instance of ManagerConfigBuilder.
     * Its parameter is used by the constructor's parameter.
     * @param parentConfig - Config object from the parent to host this builder.
     * It can be null, in which case the builder will use the services object that owns this factory.
     */
    createManagerConfigBuilder(parentConfig: ValidationManagerConfig | null): IManagerConfigBuilder<ValidationManagerConfig>;
    
    /**
     * Creates the instance of ValidatorBuilder.
     * Its parameter is used by the constructor's parameter.
     * @param parentConfig - Config object from the parent to host this validator.
     */
    createValidatorBuilder(parentConfig: ValidatorsValueHostBaseConfig): IValidatorBuilder;

    /**
     * Creates the instance of ConditionBuilder.
     * Its parameters are parameters for your classes' constructor.
     * @param parentBuilder - The Builder requesting this one.
     * It will consume the config generated either through the completed
     * callback or by calling getConfig().
     * @param completed - Optional callback that occurs when 
     * this builder has finished creating the config. It notifies
     * the builder with the config so it can consume it.
     * This is usually consumed by calling parentBuilder to use the child
     * builder's config.
     */
    createConditionBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, 
            completed?: CompleteConfigBuilderHandler<TConfig>): IConditionBuilder;
    
    /**
     * Creates the instance of StartConditionBuilder.
     * Its parameters are parameters for your classes' constructor.
     * @param parentBuilder - The Builder requesting this one.
     * It will consume the config generated either through the completed
     * callback or by calling getConfig().
     * @param completed - Optional callback that occurs when 
     * this builder has finished creating the config. It notifies
     * the builder with the config so it can consume it.
     * This is usually consumed by calling parentBuilder to use the child
     * builder's config.
     */
    createStartConditionBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, 
            completed?: CompleteConfigBuilderHandler<TConfig>): IStartConditionBuilder;
    
    /**
     * Creates the instance of StartConditionWithChildrenBuilder.
     * Its parameters are parameters for your classes' constructor.
     * @param parentBuilder - The Builder requesting this one.
     * It will consume the config generated either through the completed
     * callback or by calling getConfig().
     * @param completed - Optional callback that occurs when 
     * this builder has finished creating the config. It notifies
     * the builder with the config so it can consume it.
     * This is usually consumed by calling parentBuilder to use the child
     * builder's config.
     */
    createStartConditionWithChildrenBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, 
        conditionType: ConditionType): IStartConditionWithChildrenBuilder;
    
    /**
     * Creates the instance of StartConditionWithOneChildBuilder.
     * Its parameters are parameters for your classes' constructor.
     * @param parentBuilder - The Builder requesting this one.
     * It will consume the config generated either through the completed
     * callback or by calling getConfig().
     * @param completed - Optional callback that occurs when 
     * this builder has finished creating the config. It notifies
     * the builder with the config so it can consume it.
     * This is usually consumed by calling parentBuilder to use the child
     * builder's config.
     */
    createStartConditionWithOneChildBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, 
        completed?: CompleteConfigBuilderHandler<TConfig>): IStartConditionWithOneChildBuilder;

}
