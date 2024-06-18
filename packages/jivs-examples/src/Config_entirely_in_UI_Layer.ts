/**
  Example of using the Builder API to create a ValidationManager configuration entirely in the UI Layer.
  The business logic layer is best practice for defining the rules, but the UI layer can also do it.
  
  There are 3 phases to configuration when using UI layer alone:
  Phase 1
     Generate the Config objects using the Builder API.
  Phase 2
     While the ValidationManager is running, the UI layer can still change the configuration.
     This phase uses the Modifier API, available from the startModifier() method on the ValidationManager.
 
  You will see both phases in this example.
 
  Refer to Config_example_common_code.ts for the common code used in this example, including
  model, services, and the differenceBetweenDates() function.

  To accomplish our goal, we will setup the ValidationManager with the following
  ValueHosts and validators:
  * 'startDate' - an InputValueHost with a Date data type and validators.
  * 'endDate' - an InputValueHost with a Date data type and validators.
  * 'timeZone' - an InputValueHost with a String data type and validators.
  * 'numOfDays' - a StaticValueHost with an integer data type that holds the number of days
    limit between StartDate and EndDate.
  * 'diffDays' - a CalcValueHost with an integer data type that calculates 
    the difference in days. It uses the differenceBetweenDates() function defined
    below.
*/

import { createValidationServices, differenceBetweenDates, timeZoneRegex } from "./Config_example_common_code";
import { build } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ValidationManagerConfigBuilder } from "@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";

/* General steps:
 1. UI layer creates the ValidationServices object and Builder object.
 2. It uses the Builder object to generate the Config objects.
 3. Create the ValidationManager, passing in the builder object.
 4. Where you need to change the configuration, after this point, use the Modifier API.
    Call the startModifier() method on the ValidationManager to get a Modifier object
    and use its API. Once done, call the apply() method to apply the changes.

*/
export function configExample(): ValidationManager
{
    // Step 1: Create the ValidationServices object and builder object
    let services = createValidationServices('en');
    let builder = build(services);

    // Step 2: Create all ValueHosts and their validators.
    // We'll omit inline error messages in favor of those we setup in TextLocalizationService,
    // expect in one case (for demo purposes).
    builder.input('startDate', LookupKey.Date, { label: 'Start date' })
        .lessThan('endDate')
        .lessThanOrEqual('numOfDays',   // right operand of the comparison
            { valueHostName: 'diffDays' },  // compare to this ValueHost, not 'startDate'
            'Less than {compareTo} days apart',   // our preferred error message
            { errorCode: 'NumOfDays' });   // ensures a unique error code, not usually needed because the condition supplies a default of 'LessThanOrEqual'
    builder.input('endDate', LookupKey.Date, { label: 'End date' });
    builder.input('timeZone', LookupKey.String).regExp(timeZoneRegex, false, null, null, { errorCode: 'TimeZone'})    
    builder.static('numOfDays', LookupKey.Integer, { initialValue: 10 });
    builder.calc('diffDays', LookupKey.Integer, differenceBetweenDates);


    // Step 3: Create the ValidationManager, passing in the builder object.
    let vm = new ValidationManager(builder);
    // at this point, use the ValidationManager to validate your model.

    // Step 4: We want to show the current time zone in the start date label.
    let element: HTMLSelectElement = document.getElementById('timeZonePicker') as HTMLSelectElement;
    if (element)    // since our demo doesn't actually have this element, we'll skip this step
        element.addEventListener('change', () => {
            vm.vh.any('timeZone').setValue(element.value);

            let modifier = vm.startModifying();
            modifier.input('startDate', null, { label: `Start date (${vm.getValueHost('timeZone')?.getValue()})` })
            modifier.apply();
        });
/* --- this code doesn't belong here, it is showing some changes to the above    
    // In Step 1 or 2, we could also have setup this code while working with the builder, above.
    // A call to timeZone's setValue will trigger this.
    builder.onValueChanged = (vh, oldValue) => {
        if (vh.getName() === 'timeZone')
        {
            let modifier = vm.startModifying();
            modifier.input('startDate', null, { label: `Start date (${vm.getValueHost('timeZone')?.getValue()})` })
            modifier.apply();
        }
    }
    // then our Step 4 would look like this:
    let elementAlt: HTMLSelectElement = document.getElementById('timeZonePicker') as HTMLSelectElement;
    if (elementAlt)    // since our demo doesn't actually have this element, we'll skip this step
        elementAlt.addEventListener('changed', () => {
            vm.vh.any('timeZone').setValue(elementAlt.value);  // invokes onValueChanged
        });    
    */
    
    return vm;
}
