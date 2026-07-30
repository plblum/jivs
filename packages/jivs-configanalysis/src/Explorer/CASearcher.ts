/**
 * @module jivs-configanalysis/Explorer/ConcreteClasses
 */
import { ICASearcher, IConfigAnalysisSearchCriteria } from '../Types/Explorer';
import { CAIssueSeverity } from '../Types/ConfigAnalysisResults';

/**
 * Provides the tools to match values from a CAResult against
 * the search criteria.
 */
export class CASearcher implements ICASearcher
{

    constructor(criteria: IConfigAnalysisSearchCriteria | null)
    {
        this._allMatch = criteria === null || Object.keys(criteria).length === 0;
        this._criteria = this._allMatch ? {} : this.prepCriteria(criteria)!;
    }

    protected get criteria(): IConfigAnalysisSearchCriteria
    {
        return this._criteria;
    }
    private readonly _criteria: IConfigAnalysisSearchCriteria;
    /**
     * When true, there are no criteria setup. All results are considered a match.
     */
    public get allMatch(): boolean
    {
        return this._criteria === null || Object.keys(this._criteria).length === 0;
    }
    private readonly _allMatch: boolean;

    /**
     * When true, the search should skip children when the parent does not match.
     */
    public get skipChildrenIfParentMismatch(): boolean
    {
        return this.criteria.skipChildrenIfParentMismatch ?? false;
    }
    /**
     * Return a clone of the criteria object with all string values converted to lowercase.
     * This is to prepare for case-insensitive matching without having
     * each Explorer class do the conversion.
     * @param criteria
     * @returns
     */
    protected prepCriteria(criteria: IConfigAnalysisSearchCriteria | null): IConfigAnalysisSearchCriteria | null
    {
        if (criteria !== null)
        {
            const newCriteria: any = {};
            for (const key in criteria)
            {
                const value = (criteria as any)[key];
                if (Array.isArray(value))
                {
                    newCriteria[key] = value.map((item) =>
                    {
                        if (typeof item === 'string')
                        {
                            return item.toLowerCase();
                        }
                        return item;
                    });
                }
                else
                {
                    newCriteria[key] = value;
                }
            }
            return newCriteria as IConfigAnalysisSearchCriteria;
        }
        // istanbul ignore next // currently preCriteria is only called when criteria is not null
        return null;
    }

    /**
     * Determines if the given feature matches the search criteria.
     * @param feature The feature to match.
     * @returns True if the feature matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchFeature(feature: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(feature, this.criteria.features);
    }

    /**
     * Determines if the given severity matches the search criteria.
     * @param severity The severity to match. When supplied with null,
     * it means that the severity property is undefined in the Result.
     * @returns True if the severity matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchSeverity(severity: CAIssueSeverity | null | undefined): boolean | undefined
    {
        if (this.allMatch)
            return true;
        if (!this.criteria.severities || this.criteria.severities.length === 0)
            return undefined;
        if (severity === undefined)
            severity = null;
        // severity of null will match if the criteria includes null in the array.
        return this.criteria.severities.includes(severity);
    }

    /**
     * Determines if the given lookup key matches the search criteria.
     * @param lookupKey The lookup key to match.
     * @returns True if the lookup key matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchLookupKey(lookupKey: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(lookupKey, this.criteria.lookupKeys);
    }

    /**
     * Determines if the given service name matches the search criteria.
     * @param serviceName The service name to match.
     * @returns True if the service name matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchServiceName(serviceName: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(serviceName, this.criteria.serviceNames);
    }


    /**
     * Determines if the given value host name matches the search criteria.
     * @param valueHostName The value host name to match.
     * @returns True if the value host name matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchValueHostName(valueHostName: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(valueHostName, this.criteria.valueHostNames);
    }

    /**
     * Determines if the given error code matches the search criteria.
     * @param errorCode The error code to match.
     * @returns True if the error code matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchErrorCode(errorCode: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(errorCode, this.criteria.errorCodes);
    }

    /**
     * Determines if the given condition type matches the search criteria.
     * @param conditionType The condition type to match.
     * @returns True if the condition type matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchConditionType(conditionType: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(conditionType, this.criteria.conditionTypes);
    }

    /**
     * Determines if the given property name matches the search criteria.
     * @param propertyName The property name to match.
     * @returns True if the property name matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchPropertyName(propertyName: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(propertyName, this.criteria.propertyNames);
    }

    /**
     * Determines if the given culture ID matches the search criteria.
     * @param cultureId The culture ID to match.
     * @returns True if the culture ID matches the search criteria,
     * false if it does not match the search criteria,
     * and undefined if the criteria is not applicable to the object.
     */
    public matchCultureId(cultureId: string | null | undefined): boolean | undefined
    {
        return this.matchStringCriteria(cultureId, this.criteria.cultureIds);
    }

    /**
     *
     * @param valuesToMatch - From a single property of Criteria. Expects all strings to be lowercase.
     * @param valueFromResult - To compare to valuesToMatch case insensitively.
     * @returns When valuesToMatch is null or empty, return undefined
     */
    protected matchStringCriteria(valueFromResult: string | null | undefined, valuesToMatch: Array<string> | undefined): boolean | undefined
    {
        if (this.allMatch)
        {
            return true;
        }
        if (!valuesToMatch || valuesToMatch.length === 0)
            return undefined;
        if (!valueFromResult)
            return false;
        return valuesToMatch.includes(valueFromResult.toLowerCase());
    }
}
