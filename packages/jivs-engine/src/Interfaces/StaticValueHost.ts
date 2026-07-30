/**
 * StaticValueHost is a specialized ValueHost designed to hold a fixed/static value.
 * It has several uses:
 * - A value from the Model that is needed by validation but not edited in the UI.
 * - Expose a global value - something not part of the form - that can be used by your
 *   Conditions, such as the current Country code used to select the right regular expression
 *   for postal codes, phone numbers, etc.
 * - Store all of the remaining members of your Model. Makes ValidationManager's ValueHosts
 *   your ---Single Source of Truth (SSOT)--- for that Model.
 *   When working with a Model, you will need to write code that transfers the Model's property values
 *   into the UI elements. Since ValidationManager needs those same values, you can build
 *   your input fields/elements to get their value from ValidationManager and upon change, provide
 *   the new values back.

 * You assign it during configuration or by calling its setValue() method.
 * 
 * When configuring the ValidationManager for a StaticValueHost, use the builder's static() method.
 * ```ts
 * builder.static("pi", LookupKey.Number, { initialValue: 3.14159, label: 'Pi' });
 * builder.static("today", LookupKey.Date); // use vm.getValueHost("today").setValue(new Date()); after creating the ValidationManager
 * ```
 * If configuring directly from a Config object, use the ValueHostType.Static type and provide a list of ValidatorConfigs.
 * ```ts
 * const config: FieldValueHostConfig = <FieldValueHostConfig>{
 *    valueHostType: ValueHostType.Static,
 *    name: "pi",
 *    dataType: LookupKey.Number,
 *    initialValue: 3.14159,
 * ...and more...
 * };
 * ```
 * @module jivs-engine/ValueHosts/Types/StaticValueHost
 */

import { IValueHost, ValueHostConfig, ValueHostInstanceState } from './ValueHost';

export interface IStaticValueHost extends IValueHost {
}

/**
 * InstanceState for StaticValueHost
 */
export interface StaticValueHostInstanceState extends ValueHostInstanceState {
}

/**
 * Config for configuring StaticValueHost
 */
export interface StaticValueHostConfig extends ValueHostConfig {
}    
