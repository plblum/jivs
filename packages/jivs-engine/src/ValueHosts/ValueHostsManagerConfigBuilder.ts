/**
 * @inheritDoc ValueHosts/ConcreteClasses/ValueHostsManagerConfigBuilder!ValueHostsManagerConfigBuilder:class
 * @module ValueHosts/ConcreteClasses/ValueHostsManagerConfigBuilder
 */

import { FluentConditionCollector, ValueHostsManagerStartFluent } from "./Fluent";
import { InputValueChangedHandler } from "../Interfaces/InputValueHost";
import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { ManagerConfigBuilderBase } from "./ManagerConfigBuilderBase";
import { ValueHostsManagerConfig, ValueHostsManagerConfigChangedHandler, ValueHostsManagerInstanceState, ValueHostsManagerInstanceStateChangedHandler } from "../Interfaces/ValueHostsManager";
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';
import { ValueChangedHandler, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from "../Interfaces/ValueHost";
import { IValueHostsManagerConfigBuilder } from "../Interfaces/ManagerConfigBuilder";

/**
 * For populating the ValueHostsManagerConfig and ValidationManagerConfig's ValueHostsConfig
 * property using the guidance of functions. Otherwise you would have to define Config objects
 * carefully following their syntax.
 * 
 * ```ts
 * let builder = new ValueHostsManagerConfigBuilder(createValidationServices());
 * builder.input('Field1').requireText();
 * 
 * let vm = new ValidationManager(builder);
 * ```
 * instead of
 * ```ts
 * let vmConfig: ValidationManagerConfig = {
 *      services: createValidationServices(),
 *      valueHostConfigs: [
 *          {
 *              valueHostType: ValueHostType.Input,
 *              name: 'Field1',
 *              validatorConfigs: [
 *                  {
 *                      conditionConfig: { conditionType: ConditionType.RequireText }
 *                  }
 *              ]
 *          }
 *      ]
 * }
 * 
 * let vm = new ValidationManager(vmConfig);
 * ```
 */
export class ValueHostsManagerConfigBuilder<T extends ValueHostsManagerConfig = ValueHostsManagerConfig> extends ManagerConfigBuilderBase<T>
    implements IValueHostsManagerConfigBuilder<T>
{
/**
 * If the business logic provides ValueHostConfigs, they should already
 * be assigned to vmConfig.valueHostsConfig, and the developer
 * will be modifying those configs and adding their own.
 * If the UI is going to create all ValueHostConfigs, vmConfig.valueHostsConfig
 * can be null or []. The user will use the input(), static(), and calc() functions
 * to populate it.
 */
    constructor(services: IValueHostsServices)
    constructor(config: T)
    constructor(arg1: IValueHostsServices | T)
    {
        super(arg1 as any);
    }
    //#region InstanceState
    /**
     * @inheritDoc ValueHosts/Types/ValueHostsManager!ValueHostsManagerConfig.savedInstanceState
     */
    public get savedInstanceState(): ValueHostsManagerInstanceState | null {
        return this.baseConfig.savedInstanceState ?? null;
    }
    public set savedInstanceState(value: ValueHostsManagerInstanceState | null) {
        this.baseConfig.savedInstanceState = value;
    }
    /**
     * @inheritDoc ValueHosts/Types/ValueHostsManager!ValueHostsManagerConfig.savedValueHostInstanceStates
     */
    public get savedValueHostInstanceStates(): Array<ValueHostInstanceState> | null {
        return this.baseConfig.savedValueHostInstanceStates ?? null;
    }
    public set savedValueHostInstanceStates(value: Array<ValueHostInstanceState> | null) {
        this.baseConfig.savedValueHostInstanceStates = value;
    }
    //#endregion InstanceState

    //#region IValueHostsManagerCallbacks

    /**
     * @inheritDoc ValueHosts/Types/ValueHost!IValueHostCallbacks.onValueHostInstanceStateChanged
     */
    public get onValueHostInstanceStateChanged(): ValueHostInstanceStateChangedHandler | null | undefined {
        return this.baseConfig.onValueHostInstanceStateChanged;
    }
    public set onValueHostInstanceStateChanged(value: ValueHostInstanceStateChangedHandler | null) {
        this.baseConfig.onValueHostInstanceStateChanged = value;
    }

    /**
     * @inheritDoc ValueHosts/Types/ValueHost!IValueHostCallbacks.onValueChanged
     */
    public get onValueChanged(): ValueChangedHandler | null {
        return this.baseConfig.onValueChanged ?? null;
    }
    public set onValueChanged(value: ValueChangedHandler | null) {
        this.baseConfig.onValueChanged = value;
    }

    /**
     * @inheritDoc ValueHosts/Types/InputValueHost!IInputValueHostChangedCallback.onInputValueChanged
     */
    public get onInputValueChanged(): InputValueChangedHandler | null {
        return this.baseConfig.onInputValueChanged ?? null;
    }
    public set onInputValueChanged(value: InputValueChangedHandler | null) {
        this.baseConfig.onInputValueChanged = value;
    }

    /**
     * @inheritDoc ValueHosts/Types/ValueHostsManager!IValueHostsManagerCallbacks.onInstanceStateChanged
     */

    public get onInstanceStateChanged(): ValueHostsManagerInstanceStateChangedHandler | null {
        return this.baseConfig.onInstanceStateChanged ?? null;
    }
    public set onInstanceStateChanged(value: ValueHostsManagerInstanceStateChangedHandler | null) {
        this.baseConfig.onInstanceStateChanged = value;
    }

    /**
     * @inheritDoc ValueHosts/Types/ValueHostsManager!IValueHostsManagerCallbacks.onConfigChanged
     */
    public get onConfigChanged(): ValueHostsManagerConfigChangedHandler | null {
        return this.baseConfig.onConfigChanged ?? null;
    }
    public set onConfigChanged(value: ValueHostsManagerConfigChangedHandler | null) {
        this.baseConfig.onConfigChanged = value;
    }
  
//#endregion    

/**
 * Supplies the ValidationManagerStartFluent object, already setup
 */
    protected createFluent(): ValueHostsManagerStartFluent
    {
        return new ValueHostsManagerStartFluent(this.destinationValueHostConfigs(), this.services);
    }


    /**
     * Start of a series to collect ConditionConfigs into any condition that
     * implements EvaluateChildConditionResultsConfig.
     * For example, builder.input('Field1').all(builder.conditions().required('Field2').required('Field3'))
     * The fluent function for allCondition (and others that support EvaluateChildConditionResultsConfig)
     * will get a FluentConditionCollector whose conditionConfigs collection is fully populated.
    * @param parentConfig - When null/undefined, the instance is created and the caller is expected
    * to retrieve its conditionConfigs from the config property.
    * When assigned, that instance gets conditionConfigs populated and 
    * there is no need to get a value from configs property.
     * @returns a FluentConditionCollector for chaining conditions.
    */
    public conditions(parentConfig?: ConditionWithChildrenBaseConfig): FluentConditionCollector
    {
        let fluent = this.createFluent();
        return fluent.conditions(parentConfig);
    }    

    //#endregion fluent for creating ValueHosts

}
