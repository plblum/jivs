/**
 * @module DataTypes/Types
 */

import { ConditionBuilder } from "../Builder/ConditionBuilder";
import { FluentValidatorBuilder } from '../Builder/FluentValidatorBuilder';
import { ConditionConfig } from '../Interfaces/Conditions';
import { FieldValueHostConfig } from '../Interfaces/FieldValueHost';
import { IFluentFactory } from '../Interfaces/FluentFactory';
import { ServiceWithAccessorBase } from './ServiceWithAccessorBase';
import {
    CompleteConfigBuilderHandler, IBuilderConfigHost, IConditionBuilder,
    IFluentValidatorBuilder, IStartConditionBuilder,
    IStartConditionWithChildrenBuilder, IStartConditionWithOneChildBuilder
} from '../Interfaces/ChildBuilders';
import { StartConditionBuilder } from "../Builder/StartConditionBuilder";
import { StartConditionWithChildrenBuilder } from "../Builder/StartConditionWithChildrenBuilder";
import { StartConditionWithOneChildBuilder } from "../Builder/StartConditionWithOneChildBuilder";
import { ConditionType } from '../Conditions/ConditionTypes';
import { ValidatorsValueHostBaseConfig } from "../Interfaces/ValidatorsValueHostBase";

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
        this._startConditionBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
                new StartConditionBuilder(this.services, parentBuilder, completed);
        this._startConditionWithChildrenBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, conditionType: ConditionType) =>
                new StartConditionWithChildrenBuilder(this.services, parentBuilder, conditionType);
        this._startConditionWithOneChildBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
                new StartConditionWithOneChildBuilder(this.services, parentBuilder, completed);
    }
    private _fluentValidatorBuilderCreator: (parentConfig: FieldValueHostConfig) => IFluentValidatorBuilder;
    private _conditionBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
        IConditionBuilder;
    private _startConditionBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
        IStartConditionBuilder;
    private _startConditionWithChildrenBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, conditionType: ConditionType) =>
        IStartConditionWithChildrenBuilder;
    private _startConditionWithOneChildBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
        IStartConditionWithOneChildBuilder;
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
     * Replaces the current StartConditionBuilderCreator
     * @param replacement 
     */
    public setStartConditionBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => StartConditionBuilder): void
    {
        this._startConditionBuilderCreator = replacement;
    }

    /**
     * Replaces the current StartConditionWithChildrenBuilderCreator
     * @param replacement 
     */
    public setStartConditionWithChildrenBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, conditionType: ConditionType) => StartConditionWithChildrenBuilder): void
    {
        this._startConditionWithChildrenBuilderCreator = replacement;
    }

    /**
     * Replaces the current StartConditionWithOneChildBuilderCreator
     * @param replacement 
     */
    public setStartConditionWithOneChildBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => StartConditionWithOneChildBuilder): void
    {
        this._startConditionWithOneChildBuilderCreator = replacement;
    }
    
    /**
     * Creates the instance of FluentValidatorBuilder.
     * Its parameter is used by the constructor's parameter.
     * @param parentConfig - Config object from the parent to host this validator.
     */
    public createFluentValidatorBuilder(parentConfig: ValidatorsValueHostBaseConfig): IFluentValidatorBuilder
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
            completed?: CompleteConfigBuilderHandler<TConfig>): IConditionBuilder
    {
        return this._conditionBuilderCreator(parentBuilder, completed);
    }

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
    public createStartConditionBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<TConfig>): IStartConditionBuilder
    {
        return this._startConditionBuilderCreator(parentBuilder, completed);
    }
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
    public createStartConditionWithChildrenBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, conditionType: ConditionType): IStartConditionWithChildrenBuilder
    {
        return this._startConditionWithChildrenBuilderCreator(parentBuilder, conditionType);
    }

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
    public createStartConditionWithOneChildBuilder<TConfig extends ConditionConfig>
        (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<TConfig>): IStartConditionWithOneChildBuilder
    {
        return this._startConditionWithOneChildBuilderCreator(parentBuilder, completed);
    }
}
