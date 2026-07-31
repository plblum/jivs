
import { createConfigBuilder } from '@plblum/jivs-builder/build/Builder/ValueHostsManagerConfigBuilder';
import { RegExpConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { EmailAddressCondition, EmailAddressDataTypeCheckGenerator, EmailAddressConditionType, EmailAddressLookupKey, registerEmailAddress } from '../src/EmailAddressDataType';
import { createMinimalJivsServices } from '../src/support';

describe('EmailAddressCondition tests', () => {
    test('Demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalJivsServices('en');
        registerEmailAddress(services);
        let builder = createConfigBuilder(services);
        builder.field('Field1', EmailAddressLookupKey);

        let vm = new ValueHostsManager(builder.complete());
        let vh = vm.getFieldValueHost('Field1')!;

        let config: RegExpConditionConfig = {
            conditionType: EmailAddressConditionType,
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
        expect(testItem.supportsValue(EmailAddressLookupKey)).toBe(true);
        expect(testItem.supportsValue(LookupKey.String)).toBe(false);
    });
    test('createCondition() function (only supports EmailAddressLookupKey)', () => {
        let services = createMinimalJivsServices('en');
        registerEmailAddress(services);        
        let builder = createConfigBuilder(services);
        builder.field('Field1', EmailAddressLookupKey);

        let vm = new ValueHostsManager(builder.complete());
        let vh = vm.getFieldValueHost('Field1')!;

        let testItem = new EmailAddressDataTypeCheckGenerator();
        let result = testItem.createConditions(vh, EmailAddressLookupKey, services.conditionFactory);
        expect(result.length).toBe(1);
        expect(result[0]).toBeInstanceOf(EmailAddressCondition);
    });    
    test('Using fluent syntax, demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalJivsServices('en');
        registerEmailAddress(services);
        let builder = createConfigBuilder(services);
        builder.field('Field1', EmailAddressLookupKey).emailAddress();

        let vm = new ValueHostsManager(builder.complete());
        let vh = vm.getFieldValueHost('Field1')!;

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
