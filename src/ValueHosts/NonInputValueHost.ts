/**
 * {@inheritDoc NonInputValueHost}
 * @module ValueHosts/NonInputValueHost
 */
import { IInputValueHostDescriptor } from "../Interfaces/InputValueHost";
import { INonInputValueHost, INonInputValueHostDescriptor, INonInputValueHostState } from "../Interfaces/NonInputValueHost";
import { IValueHostDescriptor } from "../Interfaces/ValueHost";
import { IValueHostsManager } from "../Interfaces/ValueHostResolver";
import { ValueHostBase, ValueHostBaseGenerator } from "./ValueHostBase";


/**
 * ValueHost implementation that does not handle validation. (See InputValueHost for validation)
 * Use ValueHostDescriptor.Type = "NonInput" for the ValidationManager to use this class.
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
export class NonInputValueHost extends ValueHostBase<INonInputValueHostDescriptor, INonInputValueHostState>
    implements INonInputValueHost
{
    constructor(valueHostsManager: IValueHostsManager, descriptor: INonInputValueHostDescriptor, state: INonInputValueHostState)
    {
        super(valueHostsManager, descriptor, state);
    }
}

export const NonInputValueHostType = 'NonInput';
/**
 * Supports NonInputValueHost class. Used when the Descriptor.Type = NonInputValueHostType
 * or when the Type property is null/undefined and there are no InputValueHost specific
 * properties, like ValidationDescriptors or InputValue.
 */
export class NonInputValueHostGenerator extends ValueHostBaseGenerator {

    public CanCreate(descriptor: IValueHostDescriptor): boolean {
        if (descriptor.Type != null)    // null/undefined
            return descriptor.Type === NonInputValueHostType;
        let test = descriptor as unknown as IInputValueHostDescriptor;
        if (test.ValidatorDescriptors === undefined)
            return true;
        return false;
    }
    public Create(valueHostsManager: IValueHostsManager, descriptor: INonInputValueHostDescriptor, state: INonInputValueHostState): INonInputValueHost {
        return new NonInputValueHost(valueHostsManager, descriptor, state);
    }

    public CleanupState(state: INonInputValueHostState, descriptor: INonInputValueHostDescriptor): void {
        // nothing needed.
    }
}