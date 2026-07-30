/**
 *  @module jivs-builder/Builders/ConcreteClasses
 */

import { OneValueConditionBaseConfig } from '@plblum/jivs-engine/build/Conditions/OneValueConditionBase';
import { ValueHostName } from '@plblum/jivs-engine/build/DataTypes/BasicTypes';
import { ConditionConfig } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import {
    CompleteConfigBuilderHandler,
    IBuilderConfigHost,
    IConditionBuilder, IStartConditionBuilder,
    SetConfigOptions
} from '../Interfaces/ChildBuilders';
import { ConditionBuilderBase } from './ConditionBuilderBase';

/**
 * The starting point for building a condition, where you identify the valueHostName for the condition
 * prior to selecting the actual condition to apply to it.
 */

export class StartConditionBuilder
    extends ConditionBuilderBase<ConditionConfig>
    implements IStartConditionBuilder {
    constructor(services: IValidationServices,
        parentBuilder: IBuilderConfigHost<object> | null,
        completed?: CompleteConfigBuilderHandler<ConditionConfig>
    ) {
        super(services, parentBuilder,
            (config: ConditionConfig, source: IBuilderConfigHost<ConditionConfig>) => {
                this.setConfig(config, { bubbleUp: true });
            }
        );
        this.childCompleted = completed;
    }

    protected config?: ConditionConfig;
    protected childCompleted?: CompleteConfigBuilderHandler<ConditionConfig>;

    /**
     * When assigned, it is copied to the child condition config's valueHostName property,
     * which is used by conditions that require a value host name.
     */
    public get valueHostName(): ValueHostName | undefined {
        return this._valueHostName;
    }
    protected set valueHostName(value: ValueHostName | undefined) {
        this._valueHostName = value;
    }
    private _valueHostName?: ValueHostName;

    /**
     * Will assign the config.valueHostName property to the valueHostName property of this builder,
     * if it is defined, unless it was already assigned by the child.
     * Will pass up the config to the parent builder's setConfig method.
     * @param config
     */
    public setConfig(config: ConditionConfig, options?: SetConfigOptions): void {
        const revise = !options || options.applyValueHostName != false;
        if (revise)
            this.reviseValueHostName(config);
        super.setConfig(config, options);
        if (this.childCompleted)
            this.childCompleted(config, this);
    }

    protected reviseValueHostName(config: ConditionConfig): void {
        if (this._valueHostName) {
            const oneValueConfig = config as OneValueConditionBaseConfig;
            if (oneValueConfig.valueHostName == null) // null/undefined
                oneValueConfig.valueHostName = this._valueHostName;
        }
    }

    /**
     * Starts building a condition that uses the parent value host as its source.
     *
     * Hands off the next part to a new ConditionBuilder,
     * where the user can select the actual condition to build.
     * setConfig() will not assign a valueHostName property to the child condition config,
     * which means the parent value host is used.
     * @returns
     */
    public parentValue(): IConditionBuilder {
        this._valueHostName = undefined;
        return this.services.buildersFactory.createConditionBuilder(this as IBuilderConfigHost<object>,
            (childCondition: ConditionConfig, source: IBuilderConfigHost<ConditionConfig>) => { this.setConfig(childCondition, { bubbleUp: true, applyValueHostName: false }); }
        );
    }

    /**
     * Starts building a condition that uses the supplied valueHostName as its source.
     *
     * Hands off the next part to a new ConditionBuilder,
     * where the user can select the actual condition to build.
     * setConfig() will later bind the valueHostName to the child condition config's valueHostName property.
     * @param valueHostName
     * @returns
     */
    public fieldValue(valueHostName: string): IConditionBuilder {
        this._valueHostName = valueHostName;
        return this.services.buildersFactory.createConditionBuilder(this as IBuilderConfigHost<object>,
            (childCondition: ConditionConfig, source: IBuilderConfigHost<ConditionConfig>) => { this.setConfig(childCondition,
                { bubbleUp: true, applyValueHostName: true }
            ); } // sets childConfig.valueHostName and calls parent.completed
        );
    }
}
