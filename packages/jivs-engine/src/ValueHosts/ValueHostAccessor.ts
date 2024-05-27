/**
 * @module ValueHosts/ConcreteClasses/ValueHostAccessor
 */

import { IValueHostAccessor } from "../Interfaces/ValueHostAccessor";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { CodingError, assertNotNull, assertWeakRefExists } from "../Utilities/ErrorHandling";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { toIInputValueHost } from "./InputValueHost";
import { IValueHost, toIValueHost } from "../Interfaces/ValueHost";
import { IStaticValueHost } from "../Interfaces/StaticValueHost";
import { ICalcValueHost } from "../Interfaces/CalcValueHost";
import { toIStaticValueHost } from "./StaticValueHost";
import { toICalcValueHost } from "./CalcValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import { IValidatorsValueHostBase, toIValidatorsValueHostBase } from "../Interfaces/ValidatorsValueHostBase";
import { IPropertyValueHost } from "../Interfaces/PropertyValueHost";
import { toIPropertyValueHost } from "./PropertyValueHost";


/**
 * Used by ValueHostResolver's vm property to make it easier for the user
 * to get strongly typed ValueHosts, compared to ValueHostResolver.getValueHost().
 * 
 * It simplies this syntax, shown for getting a value from a InputValueHost:
 * ```ts
 * let ivh = vm.getValueHost("valuehostname") as IInputValueHost;
 * if (ivh)
 *    x = ivh.getInputValue();
 * ```
 * The improved syntax:
 * ```ts
 * x = vm.vh.input("valuehostname").getInputValue();
 * ```
 * A key difference is that getValueHost may return null. The ValueHostAccessor treats
 * unknown valuehosts and those that don't typecast correctly as exceptions.
 */
export class ValueHostAccessor implements IValueHostAccessor
{
    constructor(resolver: IValueHostResolver)
    {
        assertNotNull(resolver, 'resolver');
        this._valueHostsResolver = new WeakRef<IValueHostResolver>(resolver);
    }
    protected get valueHostResolver(): IValueHostResolver
    {
        assertWeakRefExists(this._valueHostsResolver, 'ValueHostResolver disposed');
        return this._valueHostsResolver.deref()!;
    }
    private _valueHostsResolver: WeakRef<IValueHostResolver>;

    /**
     * Gets the ValueHost for the valueHostName or throws exception if not found.
     * @param valueHostName 
     * @returns 
     */
    protected ensureValueHost(valueHostName: ValueHostName): IValueHost
    {
        let vh = this.valueHostResolver.getValueHost(valueHostName);
        if (vh)
            return vh;
        throw new CodingError(`ValueHost named ${valueHostName} is unknown.`);
    }

    /**
     * Utility to get the strongly typed ValueHost, or throw exceptions for not found
     * or not the correct class.
     * @param valueHostName 
     * @param fn 
     * @param className 
     * @returns 
     */
    protected ensureCorrectValueHost<T extends IValueHost>(valueHostName: ValueHostName, fn: (vh: IValueHost) => T | null, className: string): T
    {
        let vh = fn(this.ensureValueHost(valueHostName));
        if (vh)
            return vh;
        throw new CodingError(`ValueHost named ${valueHostName} is not an ${className}.`);
    }

    /**
     * Returns the associated InputValueHost or throws an error when
     * the valueHostName is unknown or not an InputValueHost.
     * @param valueHostName 
     */
    public input(valueHostName: ValueHostName): IInputValueHost
    {
        return this.ensureCorrectValueHost(valueHostName, toIInputValueHost, 'InputValueHost');
    }
    /**
     * Returns the associated PropertyValueHost or throws an error when
     * the valueHostName is unknown or not an PropertyValueHost.
     * @param valueHostName 
     */
    public property(valueHostName: ValueHostName): IPropertyValueHost
    {
        return this.ensureCorrectValueHost(valueHostName, toIPropertyValueHost, 'PropertyValueHost');
    }    
    /**
     * Returns the associated StaticValueHost or throws an error when
     * the valueHostName is unknown or not an StaticValueHost.
     * @param valueHostName 
     */
    public static(valueHostName: ValueHostName): IStaticValueHost
    {
        return this.ensureCorrectValueHost(valueHostName, toIStaticValueHost, 'StaticValueHost');        
    } 
    /**
     * Returns the associated CalcValueHost or throws an error when
     * the valueHostName is unknown or not an CalcValueHost.
     * @param valueHostName 
     */
    public calc(valueHostName: ValueHostName): ICalcValueHost
    {
        return this.ensureCorrectValueHost(valueHostName, toICalcValueHost, 'CalcValueHost');        
    }     
    /**
     * Returns the associated ValueHost or throws an error when
     * the valueHostName is unknown.
     * @param valueHostName 
     */
    public any(valueHostName: ValueHostName): IValueHost
    {
        return this.ensureCorrectValueHost(valueHostName, toIValueHost, 'ValueHost');        
    }         

    // NOT USED to avoid confusion with "validators" as they both are supporting
    // the same major implementations: InputValueHost and PropertyValueHost.
    // So why would the user consider this one?    
    // /**
    //  * Returns the associated Validatable ValueHost or throws an error when
    //  * the valueHostName is unknown or does not implement IValidatableValueHostBase.
    //  * At this level, there is no support for Validator classes. Only the basic framework of validation
    //  * like validate(), isValid, and doNotSave.
    //  * @param valueHostName 
    //  */
    // public validatable(valueHostName: ValueHostName): IValidatableValueHostBase
    // {
    //     return this.ensureCorrectValueHost(valueHostName, toIValidatableValueHostBase, 'ValidatableValueHostBase');        
    // }         
    /**
     * Returns the associated Validatable ValueHost that supports validators or throws an error when
     * the valueHostName is unknown or does not implement IValidatorsValueHostBase.
     * Includes InputValueHost and PropertyValueHost.
     * @param valueHostName 
     */
    public validators(valueHostName: ValueHostName): IValidatorsValueHostBase
    {
        return this.ensureCorrectValueHost(valueHostName, toIValidatorsValueHostBase, 'ValidatorsValueHostBase');        
    }
}