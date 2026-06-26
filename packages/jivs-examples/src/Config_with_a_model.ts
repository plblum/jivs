/**
  Example of using the Builder API to create a ValidationManager configuration from business logic.
  
  There are 4 phases to configuration when using business logic:
  Phase 1
     Subclass ModelRulesBase and consume the Builder API within its configureRules() method
     to define the model's rules. Keep it specific to the business logic.
     This class allows a nice testing experience too, independent of actual UI code.
  Phase 2
     Subclass the class from Phase 1 and extend it to provide UI layer specific configuration, 
     such as labels and error messages.
     It must implement the IAdaptModelRulesToForm interface and consume the Builder API
     from within its adaptToForm() method.
  Phase 3
     Create the ValidationManager through the class from Phase 2.
     Wire up any callbacks from the ValidationManagerConfig object to your UI layer.
  Phase 4
     While the ValidationManager is running, the UI layer can still change the configuration.
     This phase uses the Modifier API, available from the startModifier() method on the ValidationManager.
 
  You will see all four phases in this example.
 
  Refer to Config_example_common_code.ts for the common code used in this example, including
  model, services, and the differenceBetweenDates() function.

  To accomplish our goal, we will setup the ValidationManager with the following
  ValueHosts and validators:
  * 'startDate' - an FieldValueHost with a Date data type and validators.
    This comes from FilterDatesModel.startDate.
  * 'endDate' - an FieldValueHost with a Date data type and validators.
    This comes from FilterDatesModel.endDate.
  * 'timeZone' - an FieldValueHost with a String data type and validators.
    This comes from FilterDatesModel.timeZone.
  * 'numOfDays' - a StaticValueHost with an integer data type that holds the number of days
    limit between StartDate and EndDate.
    The UI layer will define this ValueHost.
  * 'diffDays' - a CalcValueHost with an integer data type that calculates 
    the difference in days. It uses the differenceBetweenDates() function defined
    below.
    The UI layer will define this ValueHost.
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
import { RulesConfigOptions, IAdaptModelRulesToForm } from "@plblum/jivs-engine/build/Interfaces/ModelRules";
import { ModelRulesBase } from "@plblum/jivs-engine/build/Validation/ModelRules";

// The Model
export class Person {
  firstName!: string;
  lastName!: string;
  birthDate!: Date | null;
}

// Phase 1: Business logic layer defines the rules for the model in ModelRulesBase subclass.
export class PersonModelRules extends ModelRulesBase {
  constructor(services: IValidationServices) {
    super(services);
  }
  protected override configureRules(
    builder: ValidationManagerConfigBuilder,
    options?: RulesConfigOptions
  ): void {
    builder.field('FirstName', LookupKey.String)
      .requireText()
      .stringLength(50);

    builder.field('LastName', LookupKey.String)
      .requireText()
      .stringLength(50);

    builder.field('BirthDate', LookupKey.Date)
      .notNull();
  }
}

// Phase 2: UI layer extends the business logic rules to provide form specific configuration
// by implementing the IAdaptModelRulesToForm interface.
export class PersonEditFormRules
  extends PersonModelRules
  implements IAdaptModelRulesToForm
{
  constructor(services: IValidationServices) {
    super(services);
  }
  public adaptToForm(
    builder: ValidationManagerConfigBuilder,
    options?: RulesConfigOptions
  ): void {
    builder.field('FirstName', null, { label: 'First name' })
      .stringLength({ errorMessage: 'No more than {maximum} characters. You entered {length}.'});
    builder.field('LastName', null, { label: 'Last name' })
      .stringLength({ errorMessage: 'No more than {maximum} characters. You entered {length}.'});
    builder.field('BirthDate', null, { label: 'Birth date' });
  }
}

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
    // Step 2: Configure and create the ValidationManager.
    let services = createValidationServices('en');
    let rules = new PersonEditFormRules(services);
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
        modifier.input('startDate', null, { label: `Start date (${vm.getValueHost('timeZone')?.getValue()})` });
        modifier.apply();
    }
}