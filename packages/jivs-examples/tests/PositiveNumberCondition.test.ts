import { build } from '@plblum/jivs-engine/build/ValueHosts/ValueHostsBuilder';
import { ConditionEvaluateResult } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { InputValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/InputValueHost";
import { ValueHostType } from "@plblum/jivs-engine/build/Interfaces/ValueHostFactory";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";
import { createMinimalValidationServices } from "../src/support";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { PositiveNumberCondition, PositiveNumberConditionConfig, positiveNumberConditionType } from "../src/PositiveNumberCondition";
import { ConditionFactory } from "@plblum/jivs-engine/build/Conditions/ConditionFactory";
import { ValidationManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';

describe('PositiveNumberCondition tests', () => {
    test('Demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalValidationServices('en');
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };

        let vm = new ValidationManager(vmConfig);
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,  //NOTE: optional so long as you have setup the validationConfigs property
            name: 'Field1',
            dataType: LookupKey.Number,
            validatorConfigs: []    // normally our condition is declared here so its exposed to VM.validate(), but we want to test the class directly
        };
        let vh = vm.addValueHost(vhConfig, null);
        let config: PositiveNumberConditionConfig = {
            conditionType: ConditionType.PositiveNumber,
            valueHostName: 'Field1',
        };
        let testItem = new PositiveNumberCondition(config);

        vh.setValue(1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);    
        vh.setValue(0.1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);            
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
    // anything other than a Number is Undetermined
        vh.setValue('TEXT');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);            
        vh.setValue(new Date());
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Using Fluent Syntax, demonstrate validate() returns Valid and Invalid as expected', () => {
        let services = createMinimalValidationServices('en');
        (services.conditionFactory as ConditionFactory).register<PositiveNumberConditionConfig>(
            positiveNumberConditionType, (config)=> new PositiveNumberCondition(config)
        );

        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        build(vmConfig).input('Field1', LookupKey.Number).positiveNumber('Must be a number above 0.');
        let vm = new ValidationManager(vmConfig);
        let vh = vm.getInputValueHost('Field1')!;

        vh.setValue(1);
        let valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Valid);    
        vh.setValue(0.1);
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Valid);    
        vh.setValue(0);
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Invalid);        
        vh.setValue(-1);
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Invalid);    
    });    
});
