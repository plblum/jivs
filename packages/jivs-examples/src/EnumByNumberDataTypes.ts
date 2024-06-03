import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { DataTypeFormatterBase } from '@plblum/jivs-engine/build/DataTypes/DataTypeFormatters';
import { DataTypeFormatterService } from '@plblum/jivs-engine/build/Services/DataTypeFormatterService';
import { DataTypeParserBase, DataTypeParserOptions } from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { DataTypeParserService } from '@plblum/jivs-engine/build/Services/DataTypeParserService';
import { DataTypeResolution } from '@plblum/jivs-engine/build/Interfaces/DataTypes';
import { assertNotNull, CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';

// Example: Data Types for enumerated types, where the native value is an integer.
// Shows:
// - Lookup Key - create one for each enum type
// - Formatter, converts number to localized text
// - Parser, converts text to number

// We'll demonstrate with this type:
export enum PhoneType
{
  Landline, // = 0
  Mobile,   // = 1
  Fax,      // = 2
  Other = 10
}
export const PhoneTypeLookupKey = 'PhoneType';

/**
 * IDataTypeFormatter implementation starting from our base implementation, DataTypeFormatterBase.
 * It is designed to be created for each enum type. 
 * 
 * To use it, register an instance with the validationServices.dataTypeFormatterService.
 * Each registration must have a lookup key for the enum type and the map of enum value to its string.
 */
export class EnumByNumberFormatter extends DataTypeFormatterBase
{
    constructor(lookupKey: string, enumValueInfos: Array<EnumValueInfo>)
    {
        super();
        assertNotNull(lookupKey, 'lookupKey');
        assertNotNull(enumValueInfos, 'enumValueInfos');
        if (enumValueInfos.length === 0)
            throw new CodingError('Must have at least one EnumValueInfo');
        this._lookupKey = lookupKey;
        this._enumValueInfos = enumValueInfos;
    }

    public get lookupKey(): string
    {
        return this._lookupKey;
    }
    private _lookupKey: string;

    protected get enumValueInfos(): Array<EnumValueInfo>
    {
        return this._enumValueInfos;
    }
    private _enumValueInfos: Array<EnumValueInfo>;

    protected get expectedLookupKeys(): string | string[] {
        return this.lookupKey;
    }
    protected supportsCulture(cultureId: string): boolean {
        return true;    // always because we handle all cultures through NumberToString.textl10n
    }

    public format(value: any, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>
    {
        if (value == null)  // null or undefined
            return { value: '' };
        if (typeof value === 'number')
        {
            let valueInfo = this.enumValueInfos.find((item) => item.value === value);
            if (valueInfo) {
                let localized = this.services.textLocalizerService.localize(cultureId, valueInfo.textl10n ?? null, valueInfo.text);
                if (localized)
                    return { value: localized }
            }
            // There are several ways to handle missing values, including returning returning the empty string
            // We've chosen to use an error message instead so the issue gets logged.
            return { errorMessage: `Missing value ${value}` };
        }
        return { errorMessage: 'Only supports numbers' };
    }
}

export type EnumValueInfo = {
    // When the value is this, use the text
    value: number,
    // The default text for this value
    text: string,
    // The localization lookup key to replace the default text.
    textl10n?: string
}


/**
 * Options to configure EnumByNumberParser
 */
export interface EnumByNumberParserOptions extends DataTypeParserOptions<number>
{
    /**
     * When true, match case insensitively.
     * When undefined, it is false.
     */
    caseInsensitive?: boolean;

    /**
     * When true, allow strings with numbers to be matched to the enum value.
     * When undefined, it is false.
     */
    supportNumbers?: boolean;

}
/**
 * 
 */
export class EnumByNumberParser
    extends DataTypeParserBase<number, EnumByNumberParserOptions>

{
    constructor(supportedLookupKey: string, enumValueInfos: Array<EnumValueInfo>, options: EnumByNumberParserOptions) {
        super(supportedLookupKey, options); 
        assertNotNull(enumValueInfos, 'enumValueInfos');
        if (enumValueInfos.length === 0)
            throw new CodingError('Must have at least one entry');       
        
        this._enumValueInfos = options.caseInsensitive ?
            enumValueInfos.map((item) => { return { text: item.text.toLowerCase(), value: item.value } } ) :
            enumValueInfos;
        
        this._hasLocalizedValues = enumValueInfos.find((item) => item.textl10n != null /* null or undefined */) !== undefined;

    }
    dispose(): void {
        super.dispose();
    // not absolutely required but Jivs supports on demand cleanup
        (this._cultureToEnumValuesMap as any) = undefined;
        (this._enumValueInfos as any) = undefined;
    }

    protected initUndefinedOptions(options: EnumByNumberParserOptions): void
    {
        super.initUndefinedOptions(options);
        if (options.caseInsensitive === undefined)
            options.caseInsensitive = false;
    }
    protected get enumValueInfos(): Array<EnumValueInfo>
    {
        return this._enumValueInfos;
    }
    private _enumValueInfos: Array<EnumValueInfo>;

    private _hasLocalizedValues: boolean;


    /**
     * Only used when options.emptyStringResult is undefined.
     * @returns 
     */
    protected defaultEmptyStringResult(): number | null {
        return null;   
    }

/**
 * If matching to localized strings, an array needs to be generated for each culture.
 * This is a cache for the results.
 * Key is cultureId
 */
    private _cultureToEnumValuesMap: Map<string, Array<EnumValueInfo>> = new Map();
    
    /**
     * At this point, we've handled trimming lead/trailing spaces and returned a value for the empty string.
     * This code should check the text against the map. If it gets a mapped value, return the mapped value.
     * Otherwise, return an error message.
     * @param text 
     * @param dataTypeLookupKey 
     * @param cultureId 
     */
    protected parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number | null> {
        let updated = this.options.caseInsensitive ? text.toLowerCase() : text;

        let found = this.enumValueInfos.find((item)=> item.text === updated);
        if (found)
            return { value: found.value };
        if (this._hasLocalizedValues) {
            // gather localized once to limit searching
            let localized = this._cultureToEnumValuesMap.get(cultureId);
            if (!localized) {
                localized = new Array<EnumValueInfo>();
                this._cultureToEnumValuesMap.set(cultureId, localized); // even if empty so we know not to create it again
                for (let checking of this.enumValueInfos)
                    if (checking.textl10n) {
                        let l = this.services.textLocalizerService.localize(cultureId, checking.textl10n, checking.text);
                        if (l)
                            localized.push({ value: checking.value, text: this.options.caseInsensitive ? l.toLowerCase() : l });
                        l = this.services.textLocalizerService.localize('*', checking.textl10n, checking.text);
                        if (l)
                            localized.push({ value: checking.value, text: this.options.caseInsensitive ? l.toLowerCase() : l });                        
                    }
            }
            if (localized.length > 0)
            {
                found = localized.find((item) => item.text === updated);
                if (found)
                    return { value: found.value };                
            }
        }

        if (this.options.supportNumbers && /^\d+$/.test(text))
        {
            let value = parseInt(text, 10);
            found = this.enumValueInfos.find((item)=> item.value === value);
            if (found)
                return { value: value };
        }

        return { errorMessage: `Unknown value ${text}` };

    }
}

export const phoneTypeEnumValues: Array<EnumValueInfo> = [
    {
        value: PhoneType.Landline,
        text: PhoneType[PhoneType.Landline],
        textl10n: 'PhoneType_0'
    },
    {
        value: PhoneType.Mobile,
        text: PhoneType[PhoneType.Mobile],
        textl10n: 'PhoneType_1'
    },
    {
        value: PhoneType.Fax,
        text: PhoneType[PhoneType.Fax],
        textl10n: 'PhoneType_2'
    },
    {
        value: PhoneType.Other,
        text: PhoneType[PhoneType.Other],
        textl10n: 'PhoneType_10'
    },
];


// Register after you have a ValidationService instance. Setup only on the ValidationService
export function registerEnumDataTypes(validationServices: IValidationServices): void
{

    let dtfs = validationServices.dataTypeFormatterService as DataTypeFormatterService;
    // or move just this line into registerDataTypeFormatter() function         
    dtfs.register(new EnumByNumberFormatter(PhoneTypeLookupKey, phoneTypeEnumValues)); 
    let dtps = validationServices.dataTypeParserService as DataTypeParserService;
    // or move just this line into registerDataTypeParser() function         
    dtps.register(new EnumByNumberParser(PhoneTypeLookupKey, phoneTypeEnumValues, { caseInsensitive: true }));     
}
