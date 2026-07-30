/**
 * @module jivs-builder/Services/Types
 */

import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { ConditionConfig } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValidationManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { ValidatorsValueHostBaseConfig } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { ServiceWithAccessorBase } from '@plblum/jivs-engine/build/Services/ServiceWithAccessorBase';
import { ConditionBuilder } from '../Builder/ConditionBuilder';
import { StartConditionBuilder } from '../Builder/StartConditionBuilder';
import { StartConditionWithChildrenBuilder } from '../Builder/StartConditionWithChildrenBuilder';
import { StartConditionWithOneChildBuilder } from '../Builder/StartConditionWithOneChildBuilder';
import { ValidationManagerConfigBuilder } from '../Builder/ValidationManagerConfigBuilder';
import { ValidatorBuilder } from '../Builder/ValidatorBuilder';
import { IBuildersFactory } from '../Interfaces/BuildersFactory';
import {
    CompleteConfigBuilderHandler, IBuilderConfigHost, IConditionBuilder,
    IStartConditionBuilder,
    IStartConditionWithChildrenBuilder, IStartConditionWithOneChildBuilder,
    IValidatorBuilder
} from '../Interfaces/ChildBuilders';
import { IManagerConfigBuilder } from '../Interfaces/ManagerConfigBuilder';
/**
 * Base interface to provide a factory that supplies:
 * 1. ValidatorBuilder or subclass replacement
 * 2. ConditionBuilder or subclass replacement
 */
export class BuildersFactory extends ServiceWithAccessorBase implements IBuildersFactory
{
    constructor() {
        super();
        this._managerConfigBuilder = (parentConfig: ValidationManagerConfig | null) : IManagerConfigBuilder<ValidationManagerConfig> =>
            new ValidationManagerConfigBuilder(parentConfig as ValidationManagerConfig ?? this.services);
        this._validatorBuilderCreator =
            (parentConfig: FieldValueHostConfig): IValidatorBuilder =>
                new ValidatorBuilder(this.services, parentConfig);
        this._conditionBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>): IConditionBuilder<ConditionConfig> =>
                new ConditionBuilder(this.services, parentBuilder, completed);
        this._startConditionBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>): IStartConditionBuilder =>
                new StartConditionBuilder(this.services, parentBuilder, completed);
        this._startConditionWithChildrenBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, conditionType: ConditionType): IStartConditionWithChildrenBuilder =>
                new StartConditionWithChildrenBuilder(this.services, parentBuilder, conditionType);
        this._startConditionWithOneChildBuilderCreator =
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>): IStartConditionWithOneChildBuilder =>
                new StartConditionWithOneChildBuilder(this.services, parentBuilder, completed);
    }
    private _managerConfigBuilder: (parentConfig: ValidationManagerConfig | null) => IManagerConfigBuilder<ValidationManagerConfig>;
    private _validatorBuilderCreator: (parentConfig: FieldValueHostConfig) => IValidatorBuilder;
    private _conditionBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
        IConditionBuilder;
    private _startConditionBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
        IStartConditionBuilder;
    private _startConditionWithChildrenBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, conditionType: ConditionType) =>
        IStartConditionWithChildrenBuilder;
    private _startConditionWithOneChildBuilderCreator: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
        IStartConditionWithOneChildBuilder;

    /**
     * Replaces the current ManagerConfigBuilderCreator
     * @param replacement 
     */
    public setManagerConfigBuilder(replacement:
        (parentConfig: ValidationManagerConfig | null) => IManagerConfigBuilder<ValidationManagerConfig>): void
    {
        this._managerConfigBuilder = replacement;
    }

    /**
     * Replaces the current ValidatorBuilderCreator
     * @returns 
     */
    public setValidatorBuilderCreator(replacement:
        (parentConfig: FieldValueHostConfig) => IValidatorBuilder): void
    {
        this._validatorBuilderCreator = replacement;
    }

    /**
     * Replaces the current ConditionBuilderCreator
     * @param replacement 
     */
    public setConditionBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => IConditionBuilder): void
    {
        this._conditionBuilderCreator = replacement;
    }

    /**
     * Replaces the current StartConditionBuilderCreator
     * @param replacement 
     */
    public setStartConditionBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => IStartConditionBuilder): void
    {
        this._startConditionBuilderCreator = replacement;
    }

    /**
     * Replaces the current StartConditionWithChildrenBuilderCreator
     * @param replacement 
     */
    public setStartConditionWithChildrenBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, conditionType: ConditionType) => IStartConditionWithChildrenBuilder): void
    {
        this._startConditionWithChildrenBuilderCreator = replacement;
    }

    /**
     * Replaces the current StartConditionWithOneChildBuilderCreator
     * @param replacement 
     */
    public setStartConditionWithOneChildBuilderCreator(replacement: (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => IStartConditionWithOneChildBuilder): void
    {
        this._startConditionWithOneChildBuilderCreator = replacement;
    }

    /**
     * Creates the instance of ManagerConfigBuilder.
     * Its parameter is used by the constructor's parameter.
     * @param parentConfig - Config object from the parent to host this manager config builder.
     * @returns The instance of IManagerConfigBuilder.
     */
    public createManagerConfigBuilder(parentConfig: ValidationManagerConfig | null): IManagerConfigBuilder<ValidationManagerConfig>
    {
        return this._managerConfigBuilder(parentConfig);
    }
    
    /**
     * Creates the instance of ValidatorBuilder.
     * Its parameter is used by the constructor's parameter.
     * @param parentConfig - Config object from the parent to host this validator.
     */
    public createValidatorBuilder(parentConfig: ValidatorsValueHostBaseConfig): IValidatorBuilder
    {
        return this._validatorBuilderCreator(parentConfig);
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
     */
    public createStartConditionWithChildrenBuilder
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
