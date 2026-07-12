/**
 * @module DataTypes/Types
 */

import { ConditionBuilder } from '../Builder/ConditionBuilder_classes';
import { FluentValidatorBuilder } from '../Builder/FluentValidatorBuilder';
import { ConditionConfig } from '../Interfaces/Conditions';
import { IBuilderConfigHost, CompleteConfigBuilderHandler } from '../Builder/Fluent';
import { FieldValueHostConfig } from '../Interfaces/FieldValueHost';
import { IFluentFactory } from '../Interfaces/FluentFactory';
import { ServiceWithAccessorBase } from './ServiceWithAccessorBase';

/**
 * Base interface to provide a factory that supplies:
 * 1. FluentValidatorBuilder or subclass replacement
 * 2. ConditionBuilder or subclass replacement
 */
export class FluentFactory extends ServiceWithAccessorBase implements IFluentFactory
{
    constructor() {
        super();
        this._fluentValidatorBuilderCreator =
            (parentConfig: FieldValueHostConfig) =>
                new FluentValidatorBuilder(this.services, parentConfig);
        this._conditionBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
                new ConditionBuilder(this.services, parentBuilder, completed);
    }
    private _fluentValidatorBuilderCreator: (parentConfig: FieldValueHostConfig) => FluentValidatorBuilder;
    private _conditionBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => ConditionBuilder;
    /**
     * Replaces the current FluentValidatorBuilderCreator
     * @returns 
     */
    public setFluentValidatorBuilderCreator(replacement:
        (parentConfig: FieldValueHostConfig) => FluentValidatorBuilder): void
    {
        this._fluentValidatorBuilderCreator = replacement;
    }

    /**
     * Replaces the current ConditionBuilderCreator
     * @param replacement 
     */
    public setConditionBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => ConditionBuilder): void
    {
        this._conditionBuilderCreator = replacement;
    }
    
    /**
     * Creates the instance of FluentValidatorBuilder.
     * Its parameter is used by the constructor's parameter.
     * @param parentConfig - Config object from the parent to host this validator.
     */
    public createFluentValidatorBuilder(parentConfig: FieldValueHostConfig): FluentValidatorBuilder
    {
        return this._fluentValidatorBuilderCreator(parentConfig);
    }

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
    public createConditionBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, 
            completed?: CompleteConfigBuilderHandler<TConfig>): ConditionBuilder
    {
        return this._conditionBuilderCreator(parentBuilder, completed);
    }
}
