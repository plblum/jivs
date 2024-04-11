import { RegExpConditionDescriptor, RequiredTextCondition, RequiredTextConditionDescriptor } from '../../src/Conditions/ConcreteConditions';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionDescriptor } from '../../src/Interfaces/Conditions';
import { InputValidatorDescriptor } from '../../src/Interfaces/InputValidator';
import { InputValueHostDescriptor } from '../../src/Interfaces/InputValueHost';
import { NonInputValueHostDescriptor } from '../../src/Interfaces/NonInputValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { FluentInputValidatorDescriptor, FluentSyntaxRequiredError, FluentValidationRule, FluentValidationRuleFactory, IFluentValidationRule, configInput, configNonInput, customRule } from './../../src/ValueHosts/Fluent';
describe('FluentValidationRule', () => {
    test('constructor with descriptor sets up descriptor property', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidationRule(descriptor);
        expect(testItem.descriptor).toBe(descriptor);
    });
    test('constructor with descriptor that has validatorDescriptor=null sets up descriptor property with empty validatorDescriptor array', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: null
        }
        let testItem = new FluentValidationRule(descriptor);
        expect(testItem.descriptor).toBeDefined();
        expect(testItem.descriptor.validatorDescriptors).toEqual([]);
    });
    test('constructor with null throws', () => {
        expect(() => new FluentValidationRule(null!)).toThrow('descriptor');

    });
    test('addValidationRule with all parameters correctly defined', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidationRule(descriptor);
        let inputValidatorDescriptor: FluentInputValidatorDescriptor = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.addValidationRule(ConditionType.RequiredText, {}, 'Error', inputValidatorDescriptor)).not.toThrow();
        expect(testItem.descriptor.validatorDescriptors!.length).toBe(1);
        expect(testItem.descriptor.validatorDescriptors![0]).toEqual({
            conditionDescriptor: {
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('addValidationRule with null for conditionType, and other parameters correctly defined', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidationRule(descriptor);
        let conditionDescriptor: ConditionDescriptor = {
            type: ConditionType.RequiredText
        };
        let inputValidatorDescriptor: FluentInputValidatorDescriptor = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.addValidationRule(null, conditionDescriptor, 'Error', inputValidatorDescriptor)).not.toThrow();
        expect(testItem.descriptor.validatorDescriptors!.length).toBe(1);
        expect(testItem.descriptor.validatorDescriptors![0]).toEqual({
            conditionDescriptor: {
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('addValidationRule with null for error message and error message already assigned', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidationRule(descriptor);
        let inputValidatorDescriptor: FluentInputValidatorDescriptor = {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        };
        expect(() => testItem.addValidationRule(ConditionType.RequiredText, {}, null, inputValidatorDescriptor)).not.toThrow();
        expect(testItem.descriptor.validatorDescriptors!.length).toBe(1);
        expect(testItem.descriptor.validatorDescriptors![0]).toEqual({
            conditionDescriptor: {
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
});

describe('FluentValidationRuleFactory', () => {
    test('Constructor followed by create will return an instance of FluentValidationRule with correct descriptor', () => {
        let testItem = new FluentValidationRuleFactory();
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            validatorDescriptors: []
        };
        let result: IFluentValidationRule | null = null;
        expect(() => result = testItem.create(descriptor)).not.toThrow();
        expect(result).toBeInstanceOf(FluentValidationRule);
        expect(result!.descriptor).toEqual(descriptor);
    });
    test('Register followed by create returns an instance of the test class with correct descriptor', () => {
        class TestFluentValidationRule implements IFluentValidationRule {
            constructor(descriptor: InputValueHostDescriptor) {
                this.descriptor = { ...descriptor, dataType: 'test' };
            }
            descriptor: InputValueHostDescriptor;
            addValidationRule(conditionType: string, conditionDescriptor: ConditionDescriptor | null,
                errorMessage: string | null, inputValidatorDescriptor: InputValidatorDescriptor): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentValidationRuleFactory();
        testItem.register((descriptor) => new TestFluentValidationRule(descriptor));

        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            validatorDescriptors: []
        };
        let result: IFluentValidationRule | null = null;
        expect(() => result = testItem.create(descriptor)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentValidationRule);
        expect(result!.descriptor.dataType).toBe('test');
    })
});

describe('configNonInput', () => {
    test('Valid name, null data type and defined descriptor returned as new object with addition of type', () => {
        let testItem = configNonInput('Field1', null, { label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            label: 'Field 1'
        });
    });
    test('Valid name, valid data type and undefined descriptor returned as new object with addition of type', () => {
        let testItem = configNonInput('Field1', 'Test');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test'
        });
    });
    test('Valid name only returned as new object with addition of type', () => {
        let testItem = configNonInput('Field1');
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
        });
    });
    test('First parameter is a descriptor returned as new object with addition of type', () => {
        let testItem = configNonInput({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toEqual({
            type: ValueHostType.NonInput,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1'
        });
    });
    test('Null name throws', () => {
        expect(() => configNonInput(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => configNonInput(100 as any)).toThrow('pass');
    });
});
describe('configInput', () => {
    test('Valid name, null data type and defined descriptor returned as new object with addition of type', () => {
        let testItem = configInput('Field1', null, { label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidationRule);
        expect(testItem.descriptor).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorDescriptors: []
        });
    });
    test('Valid name, valid data type and undefined descriptor returned as new object with addition of type', () => {
        let testItem = configInput('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidationRule);
        expect(testItem.descriptor).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorDescriptors: []
        });
    });
    test('Valid name only returned as new object with addition of type', () => {
        let testItem = configInput('Field1');
        expect(testItem).toBeInstanceOf(FluentValidationRule);
        expect(testItem.descriptor).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            validatorDescriptors: []
        });
    });
    test('First parameter is a descriptor returned as new object with addition of type', () => {
        let testItem = configInput({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidationRule);
        expect(testItem.descriptor).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            label: 'Field 1',
            validatorDescriptors: []
        });
    });
    test('Null name throws', () => {
        expect(() => configInput(null!)).toThrow('arg1');

    });
    test('First parameter is not compatible with overload throws', () => {
        expect(() => configInput(100 as any)).toThrow('pass');
    });
});

// Test cases for creating fluent functions...
function testChain1RequiredText(conditionDescriptor: Omit<RequiredTextConditionDescriptor, 'type' | 'valueHostName'>,
    errorMessage: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor
): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let self = this as FluentValidationRule;
        self.addValidationRule(ConditionType.RequiredText, conditionDescriptor, errorMessage, inputValidatorParameters);
        return self;
    }
    throw new FluentSyntaxRequiredError();
}
function testChain2RegExp(conditionDescriptor: Omit<RegExpConditionDescriptor, 'type' | 'valueHostName'>,
    errorMessage: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor
): FluentValidationRule {
    if (this instanceof FluentValidationRule) {
        let self = this as FluentValidationRule;
        self.addValidationRule(ConditionType.RegExp, conditionDescriptor, errorMessage, inputValidatorParameters);
        return self;
    }
    throw new FluentSyntaxRequiredError();
}
// interface that extends the class FluentValidationRule
declare module './../../src/ValueHosts/Fluent'
{
    export interface FluentValidationRule {
        testChain1RequiredText(conditionDescriptor: Omit<RequiredTextConditionDescriptor, 'type' | 'valueHostName'>,
            errorMessage: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor
        ): FluentValidationRule;
        testChain2RegExp(conditionDescriptor: Omit<RegExpConditionDescriptor, 'type' | 'valueHostName'>,
            errorMessage: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor
        ): FluentValidationRule;
    }
}
//  Make JavaScript associate the function with the class.
FluentValidationRule.prototype.testChain1RequiredText = testChain1RequiredText;
FluentValidationRule.prototype.testChain2RegExp = testChain2RegExp;

describe('Fluent chaining', () => {
    test('Add RequiredTest condition to InputValueHostDescriptor via chaining', () => {
        let testItem = configInput('Field1').testChain1RequiredText({}, 'Error', {});
        expect(testItem).toBeInstanceOf(FluentValidationRule);
        let descriptor = (testItem as FluentValidationRule).descriptor;
        expect(descriptor.validatorDescriptors!.length).toBe(1);
        expect(descriptor.validatorDescriptors![0].conditionDescriptor).not.toBeNull();
        expect(descriptor.validatorDescriptors![0].conditionDescriptor!.type).toBe(ConditionType.RequiredText);
    });
    test('Add RequiredTest and RegExp conditions to InputValueHostDescriptor via chaining', () => {
        let testItem = configInput('Field1')
            .testChain1RequiredText({}, 'Error', {})
            .testChain2RegExp({ expressionAsString: '\\d' }, 'Error2');
        expect(testItem).toBeInstanceOf(FluentValidationRule);
        let descriptor = (testItem as FluentValidationRule).descriptor;
        expect(descriptor.validatorDescriptors!.length).toBe(2);
        expect(descriptor.validatorDescriptors![0].conditionDescriptor).not.toBeNull();
        expect(descriptor.validatorDescriptors![0].conditionDescriptor!.type).toBe(ConditionType.RequiredText);
        expect(descriptor.validatorDescriptors![1].conditionDescriptor).not.toBeNull();
        expect(descriptor.validatorDescriptors![1].conditionDescriptor!.type).toBe(ConditionType.RegExp);
        expect((descriptor.validatorDescriptors![1].conditionDescriptor! as RegExpConditionDescriptor).expressionAsString).toBe('\\d');
    });
});
describe('customRule', () => {
    test('Provide a valid function and get back a FluentValidationRule with inputValidatorDescriptor.conditionCreator setup, and  conditionDescriptor null', () => {
        let testItem = configInput('Field1').customRule((requester) =>
            {
                return new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostName: null });
            },
            'Error',
            {
                summaryMessage: 'Summary'
            });
        expect(testItem).toBeInstanceOf(FluentValidationRule);
        let descriptor = (testItem as FluentValidationRule).descriptor;
        expect(descriptor.validatorDescriptors!.length).toBe(1);
        expect(descriptor.validatorDescriptors![0].conditionDescriptor).toBeNull();
        expect(descriptor.validatorDescriptors![0].conditionCreator).not.toBeNull();

    });

    test('Stand-alone call throws', () => {
        expect(() => customRule((requester) => {
            return new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostName: null });
        },
            'Error',
            {
                summaryMessage: 'Summary'
            })).toThrow();
    });
});