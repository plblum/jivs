/**
  Example of using the Builder API to create a ValidationManager configuration from business logic.
  
  When working with business logic, you want to ensure that what you supply to Jivs always matches
  the business rules. There are two approaches.
  
  1. Write a code generator that takes your business logic rules as input and generates the Config objects
     used by Jivs.
     With a code generator, you can ensure that the configuration always matches the business rules.
     See "Config_with_BusinessLogic_using_code_generator.ts" for an example.
  2. Use the Jivs Builder API to create the Config objects. It is far easier to read, but needs to
     be manually updated as business logic changes. 
     That's the approach of this example.

  There are 3 phases to configuration when using business logic:
  Phase 1
     Generate the Config objects using business logic rules, using either the code generator or the Builder API.
  Phase 2
     Let the UI layer extend and override those Config objects, changing the UI presentation like
     labels and error messages. Plus adding its own validation rules and configuration.
     Once completed, create the ValidationManager from that configuration and begin using it.
     This phase uses the Builder API.
  Phase 3
     While the ValidationManager is running, the UI layer can still change the configuration.
     This phase uses the Modifier API, available from the startModifier() method on the ValidationManager.
 
  You will see all three phases in this example.
 
  Refer to Config_example_common_code.ts for the common code used in this example, including
  model, services, and the differenceBetweenDates() function.

  To accomplish our goal, we will setup the ValidationManager with the following
  ValueHosts and validators:
  * 'startDate' - an InputValueHost with a Date data type and validators.
    This comes from FilterDatesModel.startDate.
  * 'endDate' - an InputValueHost with a Date data type and validators.
    This comes from FilterDatesModel.endDate.
  * 'timeZone' - an InputValueHost with a String data type and validators.
    This comes from FilterDatesModel.timeZone.
  * 'numOfDays' - a StaticValueHost with an integer data type that holds the number of days
    limit between StartDate and EndDate.
    The UI layer will define this ValueHost.
  * 'diffDays' - a CalcValueHost with an integer data type that calculates 
    the difference in days. It uses the differenceBetweenDates() function defined
    below.
    The UI layer will define this ValueHost.
*/

import { createValidationServices, differenceBetweenDates, onValueChangedUsingModifierAPI, timeZoneRegex } from "./Config_example_common_code";
import { build } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ValidationManagerConfigBuilder } from "@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";

/* General steps:
 1. UI layer creates the ValidationServices object and Builder object.
 2. UI passes the Builder object to the business logic layer where it is used to generate the Config objects.
 3. Back in the UI layer, use its startUILayerConfig() method to indicate that the upcoming configuration must be merged carefully
    into the existing configuration, so that business logic rules are not overwritten.
 4. Use the builder API to add and modify ValueHosts and validators.
 5. Attach callbacks to Builder object
 6. Create the ValidationManager, passing in the builder object.
 7. Where you need to change the configuration, after this point, use the Modifier API.
    Call the startModifier() method on the ValidationManager to get a Modifier object
    and use its API. Once done, call the apply() method to apply the changes.
    In this demo, look for the Modifier API in the onValueChanged callback.
*/
export function configExample(): ValidationManager
{
    // Step 1: Create the ValidationServices object and builder object
    let services = createValidationServices('en');
    let builder = build(services);

    // Step 2: Hand off the Builder object to the Business Logic layer where it gets populated.
    let reportingBuilder = new ReportingBusinessLogicBuilder(builder);
    reportingBuilder.populate();

    // now builder is ready for the UI layer to extend and override it.

    // Step 3: Indicates that the upcoming configuration must be merged carefully.
    // Option favorUIMessages discards error messages from business logic for which you have
    // replacements in the services.TextLocalizationService.
    // Option convertPropertyToInput is used to convert PropertyValueHosts
    // to InputValueHosts. PropertyValueHosts are often generated by the business logic
    // so its output can be used for Model validation with Jivs.
    builder.startUILayerConfig({ favorUIMessages: true, convertPropertyToInput: true});

    // Step 4: Add the ValueHosts for numOfDays and diffDays.
    // Add the validator to startDate to ensure it is less than numOfDays
    // Update labels
    builder.static('numOfDays', LookupKey.Integer, { initialValue: 10 });
    builder.calc('diffDays', LookupKey.Integer, differenceBetweenDates);
    builder.input('startDate', null, { label: 'Start date'})
        .lessThanOrEqual('numOfDays',   // right operand of the comparison
            { valueHostName: 'diffDays' },  // compare to this ValueHost, not 'startDate'
            'Less than {compareTo} days apart',   // our preferred error message
            { errorCode: 'NumOfDays'}   // ensures a unique error code, not usually needed because the condition supplies a default of 'LessThanOrEqual'
    );
    builder.input('endDate', null, { label: 'End date' });

    // Step 5: Attach callbacks to the Builder object
    // NOTE: Functions are declared in Config_example_common_code.ts
    builder.onValueChanged = onValueChangedUsingModifierAPI;
  
  // TESTING OPPORTUNITY: You can test the configuration that you have built so far.
  // by using the ConfigAnalysisService.
  // See: packages/jivs-examples/src/ConfigAnalysisService_example.ts
  // However, here you might just want to throw an error if the configuration contains errors
  // but only do so in a development environment.
  // For example:
  // if (process.env.NODE_ENV === 'development') {
  //     let analysisResults = builder.analyze();
  //     analysisResults.throwOnErrors(true); // writes info into Error object
  //     or
  //     analysisResults.throwOnErrors(true, new ConsoleConfigAnalysisOutputter()); // also writes to console
  // }

    // Step 6: Create the ValidationManager, passing in the builder object.
    // The builder object is now merged with the existing configuration.
    let vm = new ValidationManager(builder);
    // at this point, use the ValidationManager to validate your model.

    // Step 7: This is where we use the Modifier API.
    // We want to show the current time zone in the start date label.
    // When timeZonePicker's change event fires, we'll pass the input value to the timeZone ValueHost,
    // where the CleanUpStringParser will convert it into a native value.
    // Then the ValueHost will trigger the onValueChanged callback, which will update the start date label.
    // The parser is setup in the ValidationServices object and selected because of the LookupKey.String data type
    // on the TimeZone ValueHost.
    let element: HTMLSelectElement = document.getElementById('timeZonePicker') as HTMLSelectElement;
    element.addEventListener('change', () => {
        vm.vh.input('timeZone').setInputValue(element.value);
    });
    
    return vm;
}

/*
 How business logic exposes its rules depends on your application.
 In this example, we have provided a companion class to the Reporting business logic object
 specifically to populate the builder object.
 */
export class ReportingBusinessLogicBuilder {
    private _builder: ValidationManagerConfigBuilder;

    constructor(builder: ValidationManagerConfigBuilder) {
        this._builder = builder;
    }
    public populate(): void {
    // Remember to update this when Reporting business logic changes
        this._builder.property('startDate', LookupKey.Date).lessThan('endDate', null, 'Second date less than first');
        this._builder.property('endDate', LookupKey.Date);
        this._builder.property('timeZone', LookupKey.String).regExp(timeZoneRegex, false, null, 'Invalid time zone', { errorCode: 'TimeZone' });
    }
}

