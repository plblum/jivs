/**
  Example of using the Builder API to create a ValidationManager configuration from business logic.
  
  There are 3 phases to configuration when using business logic:
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
 
  You will see all three phases in this example.
*/

import { IValueHost } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { IValidationServices, } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";

import { createValidationServices } from "./Config_example_common_code";
import { IValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Interfaces/ManagerConfigBuilder';
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";
import { RulesConfigOptions, IAdaptModelRulesToForm } from "@plblum/jivs-engine/build/Interfaces/ModelRules";
import { ModelRulesBase } from "@plblum/jivs-engine/build/Validation/ModelRules";
import { IValidationManagerConfigFormAdapter } from "@plblum/jivs-engine/build/Interfaces/ManagerConfigBuilder";

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
    builder: IValidationManagerConfigBuilder,
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
    adapter: IValidationManagerConfigFormAdapter,
    options?: RulesConfigOptions
  ): void {
    adapter.field('FirstName', null, { label: 'First name' })
      .stringLength(null, null, 'No more than {maximum} characters. You entered {length}.');
    adapter.field('LastName', null, { label: 'Last name' })
      .stringLength(null, null, 'No more than {maximum} characters. You entered {length}.');
    adapter.field('BirthDate', null, { label: 'Birth date' });
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
export function configPersonEditFormRules(): ValidationManager
{
    // Step 2: Configure and create the ValidationManager.
    let services = createValidationServices('en');
    let rules = new PersonEditFormRules(services);
    let config = rules.configure();
    config.onValueChanged = onValueChanged; 
    let vm = new ValidationManager(config);

    // at this point, use the ValidationManager to validate your model.
    return vm;
}

export function onValueChanged(vh: IValueHost, oldValue: any) : void {
  // just a stub to show that the onValueChanged callback is available for use.
}