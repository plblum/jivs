/**
  Example of putting all configuration into the UI layer.
  No model is used nor is there a business logic layer. 

  ALERT: The business logic layer is best practice for defining the rules, but the UI layer can also do it.
  
  There are 2 phases to configuration when using UI layer alone:
  Phase 1
     Subclass ValueHostRulesBase and consume the Builder API within its configureRules() method.
     This class allows a nice testing experience too, independent of actual UI code.
  Phase 2
     Create the ValueHostsManager through your ValueHostRulesBase subclass.
     Wire up any callbacks from the ValueHostsManagerConfig object to your UI layer.

  To accomplish our goal, we will setup the ValueHostsManager with the following
  ValueHosts and validators:
  * 'startDate' - an FieldValueHost with a Date data type and validators.
  * 'endDate' - an FieldValueHost with a Date data type and validators.
  * 'timeZone' - an FieldValueHost with a String data type and validators.
  * 'numOfDays' - a StaticValueHost with an integer data type that holds the number of days
    limit between StartDate and EndDate.
  * 'diffDays' - a CalcValueHost with an integer data type that calculates 
    the difference in days. It uses the differenceBetweenDates() function defined
    below.
*/

import { IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { ICalcValueHost } from '@plblum/jivs-engine/build/Interfaces/CalcValueHost';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { SimpleValueType } from '@plblum/jivs-engine/build/Interfaces/DataTypeConverterService';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { valueHost } from '@plblum/jivs-builder/build/Builder/ValidatorBuilder';
import { createJivsServices, TimeZoneRegex } from './Config_example_common_code';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { IValueHostsManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';
import { ValueHostRulesOptions } from '@plblum/jivs-builder/build/Interfaces/ValueHostRules';
import { ValueHostRulesBase } from '@plblum/jivs-builder/build/ValueHostRules/ValueHostRules';

/**
 * Our Forms rules class.
 * This is Phase 1.
 */
export class DateRangeFormRules extends ValueHostRulesBase
{
    constructor(services: IJivsServices) {
        super(services);
    }
    protected configureRules(builder: IValueHostsManagerConfigBuilder,
        options?: ValueHostRulesOptions): void {
        builder.field('startDate', LookupKey.Date, { label: 'Start date' })
            .lessThanValue(valueHost('endDate'))
            .lessThanOrEqualValue(valueHost('numOfDays'),   // right operand of the comparison
                {
                    valueHostName: 'diffDays',  // compare to this valueHost, not StartDate
                    errorMessage: 'Less than {compareTo} days apart',   // our preferred error message,
                    errorCode: 'numOfDays' // ensures a unique error code, not usually needed because the condition supplies a default of 'LessThanOrEqual'
                }); 
        builder.field('endDate', LookupKey.Date, { label: 'End date' });
        builder.field('timeZone', LookupKey.String).regExp(TimeZoneRegex, { errorCode: 'TimeZone'});    
        builder.static('numOfDays', LookupKey.Integer, { initialValue: 10 });
        builder.calc('diffDays', LookupKey.Integer, this.differenceBetweenDates);   // eslint-disable-line @typescript-eslint/unbound-method    
    }
    // For our diffDays CalcValueHost
    private differenceBetweenDates(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
        let totalDays1 = callingValueHost.convert(
            findValueHosts.getValueHost('startDate')?.getValue(),
            null, LookupKey.TotalDays);
        let totalDays2 = callingValueHost.convert(
            findValueHosts.getValueHost('endDate')?.getValue(),
            null, LookupKey.TotalDays);
        if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
            return undefined;   // can log with findValueHosts.services.logger.log();
        return Math.abs(totalDays2 - totalDays1);
    }
}

export function configUsingDateRangeFormRules(): ValueHostsManager
{
    // Step 2: Configure and create the ValueHostsManager.
    let services = createJivsServices('en');
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();
    config.onValueChanged = onValueChangedHandler;
    let vhm = new ValueHostsManager(config);

    // at this point, use the ValueHostsManager to validate your model.

    return vhm;
}

// Phase 4:
// Builder.onValueChanged is called each time any ValueHost's value changes.
export function onValueChangedHandler(vh: IValueHost, oldValue: any) : void {
    if (vh.getName() === 'timeZone')
    {
        // do something here
    }
}