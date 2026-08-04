/**
 * {@inheritDoc jivs-engine/DataTypes/Types/IDataTypeFormatter }
 * @module jivs-engine/DataTypes/AbstractClasses/DataTypeFormatterBase
 */

import { IDataTypeFormatter } from '../Interfaces/DataTypeFormatters';
import { DataTypeResolution } from '../Interfaces/DataTypes';
import { IJivsServices } from '../Interfaces/JivsServices';
import { IServicesAccessor } from '../Interfaces/Services';
import { assertWeakRefExists, assertNotNull } from '../Utilities/ErrorHandling';

/**
 * Abstract implementation of IDataTypeFormatter.
 * @see {@link jivs-engine/DataTypes/Types/IDataTypeFormatter} for details.
 */
export abstract class DataTypeFormatterBase implements IDataTypeFormatter, IServicesAccessor
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        this._services = undefined!;
    }
    /**
     * Services accessor.
     * Note: Not passed into the constructor because this object should be created before
     * JivsServices itself. So it gets assigned when JivsServices.dataTypeFormatterService is assigned a value.
     */
    public get services(): IJivsServices
    {
        assertWeakRefExists(this._services, 'Register with JivsServices.dataTypeFormatterService first.');
        return this._services!.deref()!;
    }
    public set services(services: IJivsServices)
    {
        assertNotNull(services);
        this._services = new WeakRef<IJivsServices>(services);
    }
    protected get hasServices(): boolean
    {
        return this._services !== null && this._services.deref() !== undefined;
    }
    private _services: WeakRef<IJivsServices> | null = null;

    /**
     * The DataTypeLookup key(s) that this class supports.
     */
    protected abstract get expectedLookupKeys(): string | Array<string>;

    /**
     * Return true so long as the CultureId is supported by this class.
     * @param cultureId
     */
    protected abstract supportsCulture(cultureId: string): boolean;
    /**
     * Evaluates the parameters to determine if its format() method should handle the value
     * with those same parameters.
     * It should always match the DataTypeLookupKey.
     * It does not have to evaluate the cultureID, as there are implementations
     * where the format() function handles eve
     * @param dataTypeLookupKey
     * @param cultureId - Such as 'en-US' and 'en'
     * @returns Use its format() method when true. Do not use format() when false.
     */
    public supports(dataTypeLookupKey: string, cultureId: string): boolean
    {
        return this.matchingLookupKeys(dataTypeLookupKey, this.expectedLookupKeys) &&
            this.supportsCulture(cultureId);
    }

    /**
     * Creates a formatted string for the value, applying the goals of the DataTypeLookupKey
     * and making it culture specific.
     * @param value
     * @param dataTypeLookupKey
     * @param cultureId
     */
    public abstract format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>;

    protected prepString(value: any): DataTypeResolution<string>
    {
        if (value == null) // null/undefined
            return { value: '' };
        // filter out invalid values
        if (typeof value === 'object')
            return this.returnError('Not a string or primitive', DataTypeFormatterBase.IncompatibleDataTypeErrorCode);
        return {
            value: value.toString()
        };
    }

    public static readonly IncompatibleDataTypeErrorCode = 'IncompatibleDataType';

    /**
     * LookupKeys must be case insensitive matched.
     * @param luk1
     * @param luk2
     * @returns
     */
    protected matchingLookupKeys(luk1: string, luk2: string | Array<string>): boolean
    {
        function isMatch(a: string, b: string): boolean
        {
            if (a.length === b.length) // to avoid converting two strings when its obvious we don't need to
            {
                return a.toLocaleLowerCase() === b.toLocaleLowerCase();
            }
            return false;
        }
        if (Array.isArray(luk2))
        {
            for (let i = 0; i < luk2.length; i++)
                if (isMatch(luk1, luk2[i]))
                    return true;
        }
        else if (isMatch(luk1, luk2))
            return true;
        return false;
    }

    /**
     * Utility function to return an error in a DataTypeResolution.
     * It will use the errorCode property to provide a default errorCode if one is not supplied.
     * Unlike parsers, formatters are not expecting their errors to be viewed by the user,
     * so they do not need to provide a l10n key for the error message. The errorCode is sufficient.
     * @param message - Error message to return in the DataTypeResolution.
     * @param errorCode - Optional error code to return in the DataTypeResolution. If not supplied, the default errorCode property is used.
     * @returns
     */
    protected returnError(message: string, errorCode?: string): DataTypeResolution<string>
    {
        if (!errorCode)
        {
            errorCode = this.defaultErrorCode;
        }
        let lookupKey: string = Array.isArray(this.expectedLookupKeys) ? this.expectedLookupKeys[0] : this.expectedLookupKeys ?? 'Unknown';

        return {
            errorDetails: {
                errorMessage: message,
                errorCode: errorCode
            }
        };
    }
    protected get defaultErrorCode(): string
    {
        return DataTypeFormatterBase.FormatterErrorCode;
    }

    public static readonly FormatterErrorCode = 'FormatterError';
}
