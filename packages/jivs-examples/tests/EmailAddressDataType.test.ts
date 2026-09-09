
import { createConfigBuilder } from '@plblum/jivs-builder/build/Builder/ValueHostsManagerConfigBuilder';
import { RegExpConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { EmailAddressCondition, EmailAddressConditionType, EmailAddressLookupKey, registerEmailAddress } from '../src/EmailAddressDataType';
import { createMinimalJivsServices } from '../src/support';

describe('EmailAddressCondition tests', () => {
    test('Demonstrate cases that correctly resolve to Match, Unmatch or Undefined', () => {
        let services = createMinimalJivsServices('en');
        registerEmailAddress(services);
        let builder = createConfigBuilder(services);
        builder.field('Field1', EmailAddressLookupKey);

        let vhm = new ValueHostsManager(builder.complete());
        let vh = vhm.getFieldValueHost('Field1')!;

        let config: RegExpConditionConfig = {
            conditionType: EmailAddressConditionType,
            valueHostName: 'Field1',
        };
        let testItem = new EmailAddressCondition(config);
        vh.setValue('ABC@DEF.com');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);    
        vh.setValue('A1@B2.gov');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Match);        
        vh.setValue('ABC');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);
        vh.setValue('ABC@');
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.NoMatch);        
        vh.setValue(null);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);            
        vh.setValue(100);
        expect(testItem.evaluate(vh, vhm)).toBe(ConditionEvaluateResult.Undetermined);
    });
});
