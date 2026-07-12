/**
 * @module DataTypes/Types
 */

import { IServiceWithAccessor } from './Services';
import { ConditionBuilder } from '../Builder/ConditionBuilder_classes';
import { FluentValidatorBuilder } from '../Builder/FluentValidatorBuilder';
import { ConditionConfig } from './Conditions';
import { IBuilderConfigHost, CompleteConfigBuilderHandler } from '../Builder/Fluent';
import { FieldValueHostConfig } from './FieldValueHost';

/**
 * Base interface to provide a factory that supplies:
 * 1. FluentValidatorBuilder or subclass replacement
 * 2. ConditionBuilder or subclass replacement
 */
export interface IFluentFactory extends IServiceWithAccessor
{
    /**
     * Replaces the current FluentValidatorBuilderCreator
     * @returns 
     */
    setFluentValidatorBuilderCreator(replacement: (parentConfig: FieldValueHostConfig) => FluentValidatorBuilder): void;
    /**
     * Replaces the current ConditionBuilderCreator
     * @param replacement 
     */
    setConditionBuilderCreator(replacement: 
        (parentBuilder: IBuilderConfigHost<object>, 
        completed?: CompleteConfigBuilderHandler<any>) => ConditionBuilder): void;
    
    /**
     * Creates the instance of FluentValidatorBuilder.
     * Its parameter is used by the constructor's parameter.
     * @param parentConfig - Config object from the parent to host this validator.
     */
    createFluentValidatorBuilder(parentConfig: FieldValueHostConfig): FluentValidatorBuilder;

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
        completed?: CompleteConfigBuilderHandler<TConfig>): ConditionBuilder;
}
