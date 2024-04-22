/**
 * {@inheritDoc NonInputValueHost}
 * @module ValueHosts/ConcreteClasses/NonInputValueHost
 */
import { InputValueHostConfig } from '../Interfaces/InputValueHost';
import { INonInputValueHost, NonInputValueHostConfig, NonInputValueHostState } from '../Interfaces/UtilityValueHost';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { IValueHostsManager } from '../Interfaces/ValueHostResolver';
import { ValueHostBase, ValueHostBaseGenerator } from './ValueHostBase';


/**
 * ValueHost implementation that does not handle validation. (See InputValueHost for validation)
 * Use ValueHostConfig.type = "NonInput" for the ValidationManager to use this class.
 * 
 * Generally create these when:
 * - Expose a value from the UI that doesn't need validation, but its value is used by 
 *   other validators.
 * - Expose a global value - something not part of the form - that can be used by your
 *   Conditions, such as the current Country code used to select the right regular expression
 *   for postal codes, phone numbers, etc.
 * - Store all of the remaining members of your Model. Makes ValidationManager's ValueHosts
 *   your ---Single Source of Truth (SSOT)--- for that Model.
 *   When working with a Model, you will need to write code that transfers the Model's property values
 *   into the UI elements. Since ValidationManager needs those same values, you can build
 *   your input fields/elements to get their value from ValidationManager and upon change, provide
 *   the new values back.
 */
export class NonInputValueHost extends ValueHostBase<NonInputValueHostConfig, NonInputValueHostState>
    implements INonInputValueHost
{
    constructor(valueHostsManager: IValueHostsManager, config: NonInputValueHostConfig, state: NonInputValueHostState)
    {
        super(valueHostsManager, config, state);
    }
}

/**
 * Supports NonInputValueHost class. Used when the Config.type = ValueHostType.NonInput
 * or when the Type property is null/undefined and there are no InputValueHost specific
 * properties, like ValidationConfigs or InputValue.
 */
export class NonInputValueHostGenerator extends ValueHostBaseGenerator {

    public canCreate(config: ValueHostConfig): boolean {
        if (config.type != null)    // null/undefined
            return config.type === ValueHostType.NonInput;
        let test = config as unknown as InputValueHostConfig;
        if (test.validatorConfigs === undefined)
            return true;
        return false;
    }
    public create(valueHostsManager: IValueHostsManager, config: NonInputValueHostConfig, state: NonInputValueHostState): INonInputValueHost {
        return new NonInputValueHost(valueHostsManager, config, state);
    }

    public cleanupState(state: NonInputValueHostState, config: NonInputValueHostConfig): void {
        // nothing needed.
    }
}