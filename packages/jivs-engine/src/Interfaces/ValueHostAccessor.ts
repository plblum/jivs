/**
 * @module ValueHosts/Types/ValueHostAccessor
 */

import { ValueHostName } from "../DataTypes/BasicTypes";
import { ICalcValueHost } from "./CalcValueHost";
import { IInputValueHost } from "./InputValueHost";
import { IPropertyValueHost } from "./PropertyValueHost";
import { IStaticValueHost } from "./StaticValueHost";
import { IValidatorsValueHostBase } from "./ValidatorsValueHostBase";
import { IValueHost } from "./ValueHost";

export interface IValueHostAccessor
{
    /**
     * Returns the associated InputValueHost or throws an error when
     * the valueHostName is unknown or not an InputValueHost.
     * @param valueHostName 
     */
    input(valueHostName: ValueHostName): IInputValueHost;
    /**
     * Returns the associated PropertyValueHost or throws an error when
     * the valueHostName is unknown or not an PropertyValueHost.
     * @param valueHostName 
     */
    property(valueHostName: ValueHostName): IPropertyValueHost;

     /**
     * Returns the associated StaticValueHost or throws an error when
     * the valueHostName is unknown or not an StaticValueHost.
     * @param valueHostName 
     */
    static(valueHostName: ValueHostName): IStaticValueHost;
    /**
     * Returns the associated CalcValueHost or throws an error when
     * the valueHostName is unknown or not an CalcValueHost.
     * @param valueHostName 
     */
    calc(valueHostName: ValueHostName): ICalcValueHost;

    /**
     * Returns the associated ValueHost or throws an error when
     * the valueHostName is unknown.
     * @param valueHostName 
     */
    any(valueHostName: ValueHostName): IValueHost;

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
    // validatable(valueHostName: ValueHostName): IValidatableValueHostBase;    
    /**
     * Returns the associated Validatable ValueHost that supports validators or throws an error when
     * the valueHostName is unknown or does not implement IValidatorsValueHostBase.
     * Includes InputValueHost and PropertyValueHost.
     * @param valueHostName 
     */
    validators(valueHostName: ValueHostName): IValidatorsValueHostBase;
}