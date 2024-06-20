
import { RegExpConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { InputValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/InputValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { InputValueHost } from '@plblum/jivs-engine/build/ValueHosts/InputValueHost';
import { ValidationManager } from '@plblum/jivs-engine/build/Validation/ValidationManager';
import { EmailAddressCondition, EmailAddressDataTypeCheckGenerator, emailAddressConditionType, emailAddressLookupKey, registerEmailAddress } from '../src/EmailAddressDataType';
import { ValidationManagerConfig } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { build } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { createMinimalValidationServices } from '../src/support';

describe('EmailAddressCondition tests', () => {
    test('Demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalValidationServices('en');
        registerEmailAddress(services);

        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: []
        });
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,  //NOTE: optional so long as you have setup the validationConfigs property
            name: 'Field1',
            dataType: emailAddressLookupKey,
            validatorConfigs: []    // normally our condition is declared here so its exposed to VM.validate(), but we want to test the class directly
        };
        let vh = vm.addValueHost(vhConfig, null);
        let config: RegExpConditionConfig = {
            conditionType: emailAddressConditionType,
            valueHostName: 'Field1',
        };
        let testItem = new EmailAddressCondition(config);
        vh.setValue('ABC@DEF.com');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);    
        vh.setValue('A1@B2.gov');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('ABC@');
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.NoMatch);        
        vh.setValue(null);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);            
        vh.setValue(100);
        expect(testItem.evaluate(vh, vm)).toBe(ConditionEvaluateResult.Undetermined);
    });
});
describe('EmailAddressDataTypeCheckGenerator tests', () => {
    test('supportsValue() function', () => {
        let testItem = new EmailAddressDataTypeCheckGenerator();
        expect(testItem.supportsValue(emailAddressLookupKey)).toBe(true);
        expect(testItem.supportsValue(LookupKey.String)).toBe(false);
    });
    test('createCondition() function (only supports EmailAddressLookupKey)', () => {
        let services = createMinimalValidationServices('en');
        registerEmailAddress(services);        
        let vm = new ValidationManager({
            services: services,
            valueHostConfigs: []
        });
        let vhConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,  //NOTE: optional so long as you have setup the validationConfigs property
            name: 'Field1',
            dataType: emailAddressLookupKey,
            validatorConfigs: []    // normally our condition is declared here so its exposed to VM.validate(), but we want to test the class directly
        };
        let vh = vm.addValueHost(vhConfig, null) as InputValueHost;

        let testItem = new EmailAddressDataTypeCheckGenerator();
        let result = testItem.createConditions(vh, emailAddressLookupKey, services.conditionFactory);
        expect(result.length).toBe(1);
        expect(result[0]).toBeInstanceOf(EmailAddressCondition);
    });    
    test('Using fluent syntax, demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalValidationServices('en');
        registerEmailAddress(services);
        let vmConfig: ValidationManagerConfig = {
            services: services,
            valueHostConfigs: []
        };
        build(vmConfig).input('Field1', emailAddressLookupKey).emailAddress();
        
        let vm = new ValidationManager(vmConfig);
        let vh = vm.getInputValueHost('Field1')!;

        vh.setValue('ABC@DEF.com');
        let valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Valid);    

        vh.setValue('A1@B2.gov');
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Valid);       
        vh.setValue('ABC');
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Invalid);    
        vh.setValue('ABC@');
        valResult = vh.validate();
        expect(valResult?.status).toBe(ValidationStatus.Invalid);           
    });
});    
