/**
  Example of using the Builder API to create a ValidationManager configuration entirely in the UI Layer.
  The business logic layer is best practice for defining the rules, but the UI layer can also do it.
  
  There are 3 phases to configuration when using UI layer alone:
  Phase 1
     Subclass FormRulesBase and consume the Builder API within its configureRules() method.
     This class allows a nice testing experience too, independent of actual UI code.
  Phase 2
     Create the ValidationManager through your FormRulesBase subclass.
     Wire up any callbacks from the ValidationManagerConfig object to your UI layer.
  Phase 3
     While the ValidationManager is running, the UI layer can still change the configuration.
     This phase uses the Modifier API, available from the startModifier() method on the ValidationManager.
 
  You will see all phases in this example.
 
  Refer to Config_example_common_code.ts for the common code used in this example, including
  model, services, and the differenceBetweenDates() function.

  To accomplish our goal, we will setup the ValidationManager with the following
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

import { IValueHost } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { ICalcValueHost } from "@plblum/jivs-engine/build/Interfaces/CalcValueHost";
import { IValueHostsManager, } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";
import { SimpleValueType } from "@plblum/jivs-engine/build/Interfaces/DataTypeConverterService";
import { IValidationServices, } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { IValidationManager, } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";

import { createValidationServices, timeZoneRegex } from "./Config_example_common_code";
import { ValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";
import { RulesConfigOptions } from "@plblum/jivs-engine/build/Interfaces/ModelRules";
import { FormRulesBase } from "@plblum/jivs-engine/build/Validation/ModelRules";

/**
 * Our Forms rules class, which is a subclass of FormRulesBase.
 * This is step 1.
 */
export class DateRangeFormRules extends FormRulesBase
{
    constructor(services: IValidationServices) {
        super(services);
    }
    protected configureRules(builder: ValidationManagerConfigBuilder,
        options?: RulesConfigOptions): void {
        builder.field('startDate', LookupKey.Date, { label: 'Start date' })
            .lessThan('endDate')
            .lessThanOrEqual('numOfDays',   // right operand of the comparison
                { valueHostName: 'diffDays' },  // compare to this ValueHost, not 'startDate'
                'Less than {compareTo} days apart',   // our preferred error message
                { errorCode: 'NumOfDays' });   // ensures a unique error code, not usually needed because the condition supplies a default of 'LessThanOrEqual'
        builder.field('endDate', LookupKey.Date, { label: 'End date' });
        builder.field('timeZone', LookupKey.String).regExp(timeZoneRegex, false, null, null, { errorCode: 'TimeZone'})    
        builder.static('numOfDays', LookupKey.Integer, { initialValue: 10 });
        builder.calc('diffDays', LookupKey.Integer, this.differenceBetweenDates);        
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

export function configExample(): ValidationManager
{
    // Step 2: Configure and create the ValidationManager.
    let services = createValidationServices('en');
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();
    config.onValueChanged = onValueChangedUsingModifierAPI; // shows the modifier API in action.
    let vm = new ValidationManager(config);

    // at this point, use the ValidationManager to validate your model.

    // Step 3: This is where we use the Modifier API.
    // We want to show the current time zone in the start date label.
    // When timeZonePicker's change event fires, we'll pass the input value 
    // to the timeZone ValueHost,
    // where the CleanUpStringParser will convert it into a native value.
    // Then the ValueHost will trigger the onValueChanged callback, 
    // which will update the start date label.
    // The parser is setup in the ValidationServices object and 
    // selected because of the LookupKey.String data type
    // on the TimeZone ValueHost.
    let element: HTMLSelectElement = document.getElementById('timeZonePicker') as HTMLSelectElement;
    element.addEventListener('change', () => {
        vm.vh.field('timeZone').setTextValue(element.value);
    });
    
    return vm;
}

// Phase 4:
// Builder.onValueChanged is called each time any ValueHost's value changes.
// Here we want a change in the timeZone ValueHost to trigger a change 
// in the startDate ValueHost's label.
// It demonstrates the use of the Modifier API
export function onValueChangedUsingModifierAPI(vh: IValueHost, oldValue: any) : void {
    if (vh.getName() === 'timeZone')
    {
        let vm = vh.valueHostsManager as IValidationManager;
        let modifier = vm.startModifying();
        modifier.field('startDate', null, { label: `Start date (${vm.getValueHost('timeZone')?.getValue()})` });
        modifier.apply();
    }
}