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


import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { ValidationManager } from '@plblum/jivs-engine/build/Validation/ValidationManager';
import { createJivsServices } from './Config_example_common_code';
import { IFormConfigAdapter, IValidationManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';
import { IAdaptModelRulesToForm, RulesConfigOptions } from '@plblum/jivs-builder/build/Interfaces/ModelRules';
import { ModelRulesBase } from '@plblum/jivs-builder/build/ModelRules/ModelRules';

// The Model
export class Person {
  public firstName!: string;
  public lastName!: string;
  public birthDate!: Date | null;
}

// Phase 1: Business logic layer defines the rules for the model in ModelRulesBase subclass.
export class PersonModelRules extends ModelRulesBase {
  constructor(services: IJivsServices) {
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
  constructor(services: IJivsServices) {
    super(services);
  }
  public adaptToForm(
    adapter: IFormConfigAdapter,
    options?: RulesConfigOptions
  ): void {
    adapter.modify('FirstName', 'First name' )
      .validator(ConditionType.StringLength, 'No more than {maximum} characters. You entered {length}.');
      // same idea but using an object to supply numerous parameters
    adapter.modify('LastName', { label: 'Last name' })
      .validator(ConditionType.StringLength, 
        { errorMessage: 'No more than {maximum} characters. You entered {length}.'});
    adapter.modify('BirthDate', { label: 'Birth date' });
  }
}

/* General steps:
 1. UI layer creates the JivsServices object and Builder object.
 2. UI passes the Builder object to the business logic layer where it is used to generate the Config objects.
 3. Back in the UI layer, use its startUILayerConfig() method to indicate that the upcoming configuration must be merged carefully
    into the existing configuration, so that business logic rules are not overwritten.
 4. Use the builder API to add and modify ValueHosts and validators.
 5. Attach callbacks to Builder object
 6. Create the ValidationManager, passing in the builder object.
*/
export function configPersonEditFormRules(): ValidationManager
{
    // Step 2: Configure and create the ValidationManager.
    let services = createJivsServices('en');
    let rules = new PersonEditFormRules(services);
    let config = rules.configure();
    config.onValueChanged = onValueChangedHandler; 
    let vm = new ValidationManager(config);

    // at this point, use the ValidationManager to validate your model.
    return vm;
}

export function onValueChangedHandler(vh: IValueHost, oldValue: any) : void {
  // just a stub to show that the onValueChanged callback is available for use.
}