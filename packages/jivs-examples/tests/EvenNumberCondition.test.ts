import { build } from '@plblum/jivs-engine/build/ValueHosts/ValueHostsBuilder';
import { ConditionEvaluateResult } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { InputValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/InputValueHost";
import { ValueHostType } from "@plblum/jivs-engine/build/Interfaces/ValueHostFactory";
import { ValidationManager } from "@plblum/jivs-engine/build/Validation/ValidationManager";
import { createMinimalValidationServices } from "../src/support";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { EvenNumberCondition, EvenNumberConditionConfig, evenNumberConditionType, registerEvenNumberCondition } from "../src/EvenNumberCondition";
import { ValidationManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';

describe('EvenNumberCondition tests', () => {
    test('Demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalValidationServices('en');
        registerEvenNumberCondition(services);
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
        let config: EvenNumberConditionConfig = {
            conditionType: evenNumberConditionType,
            valueHostName: 'Field1',
        };
        let testItem = new EvenNumberCondition(config);

        vh.setValue(2);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);    
        vh.setValue(1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);            
        vh.setValue(0);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue(-1);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue(-2);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);            
    // anything other than an integer is Undetermined
        vh.setValue(1.5);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
        vh.setValue('TEXT');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);        
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);            
        vh.setValue(new Date());
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
    test('Using Fluent Syntax, demonstrate validate() returns Valid and Invalid as expected', () => {
        let services = createMinimalValidationServices('en');
        registerEvenNumberCondition(services);

        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        build(vmConfig).input('Field1', LookupKey.Number).evenNumber('Must be an even number.');
        let vm = new ValidationManager(vmConfig);
        let vh = vm.getInputValueHost('Field1')!;

        vh.setValue(2);
        let valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Valid);    
        vh.setValue(1);
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Invalid);
        vh.setValue(0);
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Valid);    
   
        vh.setValue(-1);
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Invalid);    
        vh.setValue(-2);
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Valid);            
    });    
});
