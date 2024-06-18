/**
  Example of configuring Jivs using a code generator with business logic.
 
  When working with business logic, you want to ensure that what you supply to Jivs always matches
  the business rules.
  
  1. Write a code generator that takes your business logic rules as input and generates the Config objects
     used by Jivs. That's the approach of this example.
     With a code generator, you can ensure that the configuration always matches the business rules.
  2. Use the Jivs Builder API to create the Config objects. It is far easier to read, but needs to
     be manually updated as business logic changes. 
     See "Config_with_BusinessLogic_using_Builder.ts" for an example.
 
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


import { createValidationServices, differenceBetweenDates, timeZoneRegex } from "./Config_example_common_code";
import { build } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ValidationManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import { ValidatorConfig } from "@plblum/jivs-engine/build/Interfaces/Validator";
import { ConditionConfig } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { PropertyValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/PropertyValueHost";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { ValidationServices } from "@plblum/jivs-engine/build/Services/ValidationServices";

/* General steps:
 1. Create the ValidationServices object, configured for UI building. The UI Layer often creates it
    and passes it to the business logic layer.
 2. Create a code generator that takes your business logic rules and generates the Config objects.
    Those objects are placed into a ValidationManagerConfig object.
 3. Now for the UI Layer. Create the builder object with the ValidationManagerConfig object.
 4. Use its override() method to indicate that the upcoming configuration must be merged carefully
    into the existing configuration, so that business logic rules are not overwritten.
 5. Use the builder API to add and modify ValueHosts and validators.
 6. Create the ValidationManager, passing in the builder object.
 7. Where you need to change the configuration, after this point, use the Modifier API.
    Call the startModifier() method on the ValidationManager to get a Modifier object
    and use its API. Once done, call the apply() method to apply the changes.

*/
export function configExample(): ValidationManager
{
    // Step 1: Create the ValidationServices object, configured for UI building
    let services = createValidationServices('en');

    // Step 2: Create a code generator that takes your business logic rules and generates the Config objects
    let codeGen = new BusinessLogicCodeGen(new ReportingBusinessLogic(), services);
    codeGen.generate();
    let vmConfig = codeGen.getValidationManagerConfig();

    // Step 3: Now for the UI Layer. Create the builder object with the ValidationManagerConfig object.
    let builder = build(vmConfig);

    // Step 4: Indicates that the upcoming configuration must be merged carefully.
    // Option favorUIMessages discards error messages from business logic for which you have
    // replacements in the services.TextLocalizationService.
    // Option convertPropertyToInput is used to convert PropertyValueHosts
    // to InputValueHosts. PropertyValueHosts are often generated by the business logic
    // so its output can be used for Model validation with Jivs.
    builder.override({ favorUIMessages: true, convertPropertyToInput: true});

    // Step 5: Add the ValueHosts for numOfDays and diffDays.
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

    // Step 6: Create the ValidationManager, passing in the builder object.
    // The builder object is now merged with the existing configuration.
    let vm = new ValidationManager(builder);
    // at this point, use the ValidationManager to validate your model.

    // Step 7: We want to show the current time zone in the start date label.
    let element: HTMLSelectElement = document.getElementById('timeZonePicker') as HTMLSelectElement;
    if (element)    // since our demo doesn't actually have this element, we'll skip this step
        element.addEventListener('change', () => {
            vm.vh.any('timeZone').setValue(element.value);

            let modifier = vm.startModifying();
            modifier.input('startDate', null, { label: `Start date (${vm.getValueHost('timeZone')?.getValue()})` })
            modifier.apply();
        });
/* --- this code doesn't belong here, it is showing some changes to the above    
    // In Step 5, we could also have setup this code while working with the builder, above.
    // A call to timeZone's setValue will trigger this.
    builder.onValueChanged = (vh, oldValue) => {
        if (vh.getName() === 'timeZone')
        {
            let modifier = vm.startModifying();
            modifier.input('startDate', null, { label: `Start date (${vm.getValueHost('timeZone')?.getValue()})` })
            modifier.apply();
        }
    }
    // then our Step 7 would look like this:
    let elementAlt: HTMLSelectElement = document.getElementById('timeZonePicker') as HTMLSelectElement;
    if (elementAlt)    // since our demo doesn't actually have this element, we'll skip this step
        elementAlt.addEventListener('changed', () => {
            vm.vh.any('timeZone').setValue(elementAlt.value);  // invokes onValueChanged
        });    
    */
    
    return vm;
}

/*
 How business logic exposes its rules depends on your application.
 In this example, we can ask our business logic layer class for reporting
 to supply a list of field names and their metadata.
 Then we can convert that data into the Config objects.
 */

export class BusinessLogicCodeGen {

    constructor(businessLogic: IBusinessLogic, services: ValidationServices) {
        this._businessLogic = businessLogic;
        this._vmConfig = { services: services, valueHostConfigs: [] };
    }
    private _businessLogic: IBusinessLogic;
    private _vmConfig: ValidationManagerConfig;

    public generate(): void {
        // Generate the Config objects using business logic rules
        let fields = this._businessLogic.getFields();
        for (let field of fields)
        {
            this.generateField(field);
        }
    }
    protected generateField(field: FieldMetadata): void {
        // we could use InputValueHostConfig here too, as the UI needs it.
        // If you use Jivs features for model validation, you'll use PropertyValueHostConfig..
        // But we are using PropertyValueHostConfig to show how to convert it.
        // see builder.override({ convertPropertyToInput: true }); above.
        let vh: PropertyValueHostConfig = {
            valueHostType: 'Property',
            name: field.name,
            dataType: this.convertDataType(field.dataType),
            validatorConfigs: []
        };
        for (let validator of field.validators)
        {
            let conditionConfig = this.createConditionConfig(validator, field);
            let validatorConfig: ValidatorConfig = {
                errorCode: validator.errorCode,
                errorMessage: validator.errorMessage,
                conditionConfig: conditionConfig
            };
            vh.validatorConfigs!.push(validatorConfig);
        }
        this._vmConfig.valueHostConfigs.push(vh);
    }

    protected createConditionConfig(validator: ValidatorMetadata, field: FieldMetadata): ConditionConfig {
        let conditionConfig = <any> {
            conditionType: null,
            valueHostName: field.name!, // not needed in many Conditions, but its safe to inject it as its ignored if not needed
        };
        switch (validator.rule.type)
        {
            case 'notNull':
                conditionConfig.conditionType = ConditionType.NotNull;
                break;
            case 'lessThan':
                conditionConfig.conditionType = ConditionType.LessThan;
                conditionConfig.secondValueHostName = (validator.rule as lessThanRuleMetadata).rightOperandField;
                break;
            case 'lessThanOrEqual':
                conditionConfig.conditionType = ConditionType.LessThanOrEqual;
                conditionConfig.secondValueHostName = (validator.rule as lessThanOrEqualRuleMetadata).rightOperandField;
                break;
            case 'regularExpression':
                conditionConfig.conditionType = ConditionType.RegExp;
                conditionConfig.expression = (validator.rule as regularExpressionRuleMetadata).regex;
                break;
        }
        return conditionConfig;
    }

    public getValidationManagerConfig(): ValidationManagerConfig {
        return this._vmConfig;
    }
    protected convertDataType(dataType: supportedDataTypes): string | undefined {
        switch (dataType)
        {
            case 'date':
                return LookupKey.Date;
            case 'string':
                return LookupKey.String;
            case 'number':
                return LookupKey.Number;
            case 'boolean':
                return LookupKey.Boolean;
            default:
                return undefined;
        }
    }    
}

export interface IBusinessLogic
{
    getFields(): FieldMetadata[];
}
export class ReportingBusinessLogic implements IBusinessLogic{
    public getFields(): FieldMetadata[] {
        let fields: FieldMetadata[] = [
            {
                name: 'startDate',
                dataType: 'date',
                validators: [
                    {
                        errorCode: 'LessThan',
                        errorMessage: 'Second date less than first',
                        rule: new lessThanRuleMetadata('endDate')
                    }
                ]
            },
            {
                name: 'endDate',
                dataType: 'date',
                validators: []
            },
            {
                name: 'timeZone',
                dataType: 'string',
                validators: [
                    {
                        errorCode: 'TimeZone',
                        errorMessage: 'Invalid time zone',
                        // UTC, UTC+1, UTC-1, UTC+1.5, UTC-1.5, UTC+1.75, UTC-1.75
                        rule: new regularExpressionRuleMetadata(timeZoneRegex)
                    }
                ]
            }
        ];
        // Return the list of fields and their metadata
        // Add your code here
        return fields;
    }
}

export interface FieldMetadata {
    name: string;
    dataType: supportedDataTypes;
    validators: ValidatorMetadata[];
}
export type supportedDataTypes = 'date' | 'string' | 'number' | 'boolean';

export interface ValidatorMetadata {
    errorCode: string;
    errorMessage: string;
    rule: ruleMetadata
}
export interface ruleMetadata
{
    type: string;
    validate: (value: any) => boolean;
}
export class notNullRuleMetadata implements ruleMetadata
{
    public readonly type: string = "notNull";
    public validate(value: any): boolean {
        throw new Error("Exercise for the user.");
    }
}
export class lessThanRuleMetadata implements ruleMetadata
{
    public readonly type: string = "lessThan";
    public rightOperandField: string;
    public constructor(rightOperandField: string) {
        this.rightOperandField = rightOperandField;
    }
    public validate(value: any): boolean {
        throw new Error("Exercise for the user.");
    }
}

export class lessThanOrEqualRuleMetadata implements ruleMetadata
{
    public readonly type: string = "lessThanOrEqual";
    public rightOperandField: string;
    constructor(rightOperandField: string) {
        this.rightOperandField = rightOperandField;
    }
    public validate(value: any): boolean {
        throw new Error("Exercise for the user.");
    }
}
// Will be used for the timeZone field.
export class regularExpressionRuleMetadata implements ruleMetadata
{
    public readonly type: string = "regularExpression";
    public regex: RegExp;
    constructor(regex: RegExp) {
        this.regex = regex;
    }
    public validate(value: any): boolean {
        throw new Error("Exercise for the user.");
    }
}
