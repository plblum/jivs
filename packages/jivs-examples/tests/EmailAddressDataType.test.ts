import { RegExpConditionDescriptor } from '@plblum/jivs-engine/src/Conditions/ConcreteConditions';
import { LookupKey } from '@plblum/jivs-engine/src/DataTypes/LookupKeys';
import { ConditionEvaluateResult } from '@plblum/jivs-engine/src/Interfaces/Conditions';
import { InputValueHostDescriptor } from '@plblum/jivs-engine/src/Interfaces/InputValueHost';
import { ValueHostType } from '@plblum/jivs-engine/src/Interfaces/ValueHostFactory';
import { InputValueHost } from '@plblum/jivs-engine/src/ValueHosts/InputValueHost';
import { ValidationManager } from '@plblum/jivs-engine/src/ValueHosts/ValidationManager';
import { EmailAddressCondition, EmailAddressConditionType, EmailAddressDataTypeCheckGenerator, EmailAddressLookupKey } from '../src/EmailAddressDataType';
import { createMinimalValidationServices } from '../src/support';

describe('EmailAddressCondition tests', () => {
    test('Demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalValidationServices();
        let vm = new ValidationManager({
            services: services,
            valueHostDescriptors: []
        });
        let vhDescriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,  //NOTE: optional so long as you have setup the validationDescriptors property
            name: 'Field1',
            dataType: EmailAddressLookupKey,
            validatorDescriptors: []    // normally our condition is declared here so its exposed to VM.validate(), but we want to test the class directly
        };
        let vh = vm.addValueHost(vhDescriptor, null);
        let descriptor: RegExpConditionDescriptor = {
            type: EmailAddressConditionType,
            valueHostName: 'Field1',
        };
        let testItem = new EmailAddressCondition(descriptor);
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
        expect(testItem.supportsValue(EmailAddressLookupKey)).toBe(true);
        expect(testItem.supportsValue(LookupKey.String)).toBe(false);
    });
    test('createCondition() function (only supports EmailAddressLookupKey)', () => {
        let services = createMinimalValidationServices();
        let vm = new ValidationManager({
            services: services,
            valueHostDescriptors: []
        });
        let vhDescriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,  //NOTE: optional so long as you have setup the validationDescriptors property
            name: 'Field1',
            dataType: EmailAddressLookupKey,
            validatorDescriptors: []    // normally our condition is declared here so its exposed to VM.validate(), but we want to test the class directly
        };
        let vh = vm.addValueHost(vhDescriptor, null) as InputValueHost;

        let testItem = new EmailAddressDataTypeCheckGenerator();
        expect(testItem.createCondition(vh, EmailAddressLookupKey, services.conditionFactory)).toBeInstanceOf(EmailAddressCondition);
    });    
});