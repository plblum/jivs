import { RegExpConditionDescriptor, RequiredTextCondition, RequiredTextConditionDescriptor } from '../../src/Conditions/ConcreteConditions';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { EvaluateChildConditionResultsDescriptor } from '../../src/Conditions/EvaluateChildConditionResultsBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ConditionDescriptor } from '../../src/Interfaces/Conditions';
import { InputValidatorDescriptor } from '../../src/Interfaces/InputValidator';
import { InputValueHostDescriptor } from '../../src/Interfaces/InputValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { FluentInputValidatorDescriptor, FluentSyntaxRequiredError, FluentValidatorCollector, FluentFactory, configInput, configNonInput, customRule, IFluentValidatorCollector, FluentConditionCollector, IFluentConditionCollector, configChildren, FluentCollectorBase } from './../../src/ValueHosts/Fluent';
describe('FluentValidatorCollector', () => {
    test('constructor with descriptor sets up descriptor property', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidatorCollector(descriptor);
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
        let testItem = new FluentValidatorCollector(descriptor);
        expect(testItem.descriptor).toBeDefined();
        expect(testItem.descriptor.validatorDescriptors).toEqual([]);
    });
    test('constructor with null throws', () => {
        expect(() => new FluentValidatorCollector(null!)).toThrow('descriptor');

    });
    test('add() with all parameters correctly defined', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidatorCollector(descriptor);
        let inputValidatorDescriptor: FluentInputValidatorDescriptor = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequiredText, {}, 'Error', inputValidatorDescriptor)).not.toThrow();
        expect(testItem.descriptor.validatorDescriptors!.length).toBe(1);
        expect(testItem.descriptor.validatorDescriptors![0]).toEqual({
            conditionDescriptor: {
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidatorCollector(descriptor);
        let conditionDescriptor: ConditionDescriptor = {
            type: ConditionType.RequiredText
        };
        let inputValidatorDescriptor: FluentInputValidatorDescriptor = {
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(null, conditionDescriptor, 'Error', inputValidatorDescriptor)).not.toThrow();
        expect(testItem.descriptor.validatorDescriptors!.length).toBe(1);
        expect(testItem.descriptor.validatorDescriptors![0]).toEqual({
            conditionDescriptor: {
                type: ConditionType.RequiredText
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });
    });
    test('add() with null for error message and error message already assigned', () => {
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            dataType: LookupKey.Currency,
            validatorDescriptors: []
        }
        let testItem = new FluentValidatorCollector(descriptor);
        let inputValidatorDescriptor: FluentInputValidatorDescriptor = {
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        };
        expect(() => testItem.add(ConditionType.RequiredText, {}, null, inputValidatorDescriptor)).not.toThrow();
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

describe('FluentConditionCollector', () => {
    test('constructor with descriptor sets up descriptor property', () => {
        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: []
        }
        let testItem = new FluentConditionCollector(descriptor);
        expect(testItem.descriptor).toBe(descriptor);
    });
    test('constructor with null parameter creates a Descriptor with conditionDescriptors=[] and type="TBD"', () => {
        let testItem = new FluentConditionCollector(null);
        expect(testItem.descriptor).toEqual({
            type: 'TBD',
            conditionDescriptors: []
        });
    });    
    test('constructor with descriptor that has conditionDescriptors=null sets up descriptor property with empty conditionDescriptors array', () => {
        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: null as unknown as Array<ConditionDescriptor>
        }

        let testItem = new FluentConditionCollector(descriptor);
        expect(testItem.descriptor).toBeDefined();
        expect(testItem.descriptor.conditionDescriptors).toEqual([]);
    });
    test('add() with all parameters correctly defined', () => {
        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: []
        }
        let testItem = new FluentConditionCollector(descriptor);

        expect(() => testItem.add(ConditionType.RequiredText, {})).not.toThrow();
        expect(testItem.descriptor.conditionDescriptors!.length).toBe(1);
        expect(testItem.descriptor.conditionDescriptors![0]).toEqual({
            type: ConditionType.RequiredText
        });
    });
    test('add() with null for conditionType, and other parameters correctly defined', () => {
        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: []
        }
        let testItem = new FluentConditionCollector(descriptor);
        let conditionDescriptor: ConditionDescriptor = {
            type: ConditionType.RequiredText
        };

        expect(() => testItem.add(null, conditionDescriptor)).not.toThrow();
        expect(testItem.descriptor.conditionDescriptors!.length).toBe(1);
        expect(testItem.descriptor.conditionDescriptors![0]).toEqual({
            type: ConditionType.RequiredText
        });
    });
});

describe('FluentFactory', () => {
    test('Constructor followed by create will return an instance of FluentValidatorCollector with correct descriptor', () => {
        let testItem = new FluentFactory();
        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            validatorDescriptors: []
        };
        let result: IFluentValidatorCollector | null = null;
        expect(() => result = testItem.createValidatorCollector(descriptor)).not.toThrow();
        expect(result).toBeInstanceOf(FluentValidatorCollector);
        expect(result!.descriptor).toEqual(descriptor);
    });
    test('Register followed by create returns an instance of the test class with correct descriptor', () => {
        class TestFluentValidatorCollector implements IFluentValidatorCollector {
            constructor(descriptor: InputValueHostDescriptor) {
                this.descriptor = { ...descriptor, dataType: 'test' };
            }
            descriptor: InputValueHostDescriptor;
            add(conditionType: string, conditionDescriptor: ConditionDescriptor | null,
                errorMessage: string | null, inputValidatorDescriptor: InputValidatorDescriptor): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerValidatorCollector((descriptor) => new TestFluentValidatorCollector(descriptor));

        let descriptor: InputValueHostDescriptor = {
            type: ValueHostType.Input,
            name: 'Field1',
            validatorDescriptors: []
        };
        let result: IFluentValidatorCollector | null = null;
        expect(() => result = testItem.createValidatorCollector(descriptor)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentValidatorCollector);
        expect(result!.descriptor.dataType).toBe('test');
    });
    test('Constructor followed by create will return an instance of FluentConditionCollector with correct descriptor', () => {
        let testItem = new FluentFactory();
        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(descriptor)).not.toThrow();
        expect(result).toBeInstanceOf(FluentConditionCollector);
        expect(result!.descriptor).toEqual(descriptor);
    });
    test('Register followed by create returns an instance of the test class with correct descriptor', () => {
        class TestFluentConditionCollector implements IFluentConditionCollector {
            constructor(descriptor: EvaluateChildConditionResultsDescriptor) {
                this.descriptor = { ...descriptor, type: 'Test' };
            }
            descriptor: EvaluateChildConditionResultsDescriptor;

            add(conditionType: string, conditionDescriptor: Partial<ConditionDescriptor> | null): void {
                throw new Error('Method not implemented.');
            }
        }
        let testItem = new FluentFactory();
        testItem.registerConditionCollector((descriptor) => new TestFluentConditionCollector(descriptor));

        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: []
        }
        let result: IFluentConditionCollector | null = null;
        expect(() => result = testItem.createConditionCollector(descriptor)).not.toThrow();
        expect(result).toBeInstanceOf(TestFluentConditionCollector);
        expect(result!.descriptor.type).toBe('Test');
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
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.descriptor).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            label: 'Field 1',
            validatorDescriptors: []
        });
    });
    test('Valid name, valid data type and undefined descriptor returned as new object with addition of type', () => {
        let testItem = configInput('Field1', 'Test');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.descriptor).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            dataType: 'Test',
            validatorDescriptors: []
        });
    });
    test('Valid name only returned as new object with addition of type', () => {
        let testItem = configInput('Field1');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        expect(testItem.descriptor).toEqual({
            type: ValueHostType.Input,
            name: 'Field1',
            validatorDescriptors: []
        });
    });
    test('First parameter is a descriptor returned as new object with addition of type', () => {
        let testItem = configInput({ name: 'Field1', dataType: 'Test', label: 'Field 1' });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
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
describe('configChildren', () => {
    test('Undefined parameter creates a FluentConditionCollector with descriptor containing type=TBD and collectionDescriptor=[]', () => {
        let testItem = configChildren();
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.descriptor).toEqual({
            type: 'TBD',
            conditionDescriptors: []
        });
    });
    test('null parameter creates a FluentConditionCollector with descriptor containing type=TBD and collectionDescriptor=[]', () => {
        let testItem = configChildren(null!);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.descriptor).toEqual({
            type: 'TBD',
            conditionDescriptors: []
        });
    });    
    test('Supplied parameter creates a FluentConditionCollector with the same descriptor', () => {
        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: []
        }
        let testItem = configChildren(descriptor);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.descriptor).toEqual({
            type: ConditionType.All,
            conditionDescriptors: []
        });
    });    
    test('Supplied parameter with conditionDescriptor=null creates a FluentValidatorCollector with the same descriptor and conditionDescriptor=[]', () => {
        let descriptor: EvaluateChildConditionResultsDescriptor = {
            type: ConditionType.All,
            conditionDescriptors: null as unknown as Array<ConditionDescriptor>
        }
        let testItem = configChildren(descriptor);
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        expect(testItem.descriptor).toEqual({
            type: ConditionType.All,
            conditionDescriptors: []
        });
    });        
});
// Test cases for creating fluent functions...
function testChain1RequiredText(conditionDescriptor: Omit<RequiredTextConditionDescriptor, 'type' | 'valueHostName'>,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor
): FluentCollectorBase {
    if (this instanceof FluentValidatorCollector) {
        let self = this as FluentValidatorCollector;
        self.add(ConditionType.RequiredText, conditionDescriptor, errorMessage, inputValidatorParameters);
        return self;
    }
    if (this instanceof FluentConditionCollector) {
        let self = this as FluentConditionCollector;
        self.add(ConditionType.RequiredText, conditionDescriptor);
        return self;
    }    
    throw new FluentSyntaxRequiredError();
}
function testChain2RegExp(conditionDescriptor: Omit<RegExpConditionDescriptor, 'type' | 'valueHostName'>,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor
): FluentCollectorBase {
    if (this instanceof FluentValidatorCollector) {
        let self = this as FluentValidatorCollector;
        self.add(ConditionType.RegExp, conditionDescriptor, errorMessage, inputValidatorParameters);
        return self;
    }
    if (this instanceof FluentConditionCollector) {
        let self = this as FluentConditionCollector;
        self.add(ConditionType.RegExp, conditionDescriptor);
        return self;
    }
    throw new FluentSyntaxRequiredError();
}
// interface that extends the class FluentValidatorCollector
declare module './../../src/ValueHosts/Fluent'
{
    export interface FluentCollectorBase {
        testChain1RequiredText(conditionDescriptor: Omit<RequiredTextConditionDescriptor, 'type' | 'valueHostName'>,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor
        ): FluentCollectorBase;
        testChain2RegExp(conditionDescriptor: Omit<RegExpConditionDescriptor, 'type' | 'valueHostName'>,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor
        ): FluentCollectorBase;
    }
}
//  Make JavaScript associate the function with the class.
FluentCollectorBase.prototype.testChain1RequiredText = testChain1RequiredText;
FluentCollectorBase.prototype.testChain2RegExp = testChain2RegExp;

describe('Fluent chaining on configInput', () => {
    test('configInput: Add RequiredTest condition to InputValueHostDescriptor via chaining', () => {
        let testItem = configInput('Field1').testChain1RequiredText({}, 'Error', {});
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let descriptor = (testItem as FluentValidatorCollector).descriptor;
        expect(descriptor.validatorDescriptors!.length).toBe(1);
        expect(descriptor.validatorDescriptors![0].conditionDescriptor).not.toBeNull();
        expect(descriptor.validatorDescriptors![0].conditionDescriptor!.type).toBe(ConditionType.RequiredText);
    });
    test('configInput: Add RequiredTest and RegExp conditions to InputValueHostDescriptor via chaining', () => {
        let testItem = configInput('Field1')
            .testChain1RequiredText({}, 'Error', {})
            .testChain2RegExp({ expressionAsString: '\\d' }, 'Error2');
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let descriptor = (testItem as FluentValidatorCollector).descriptor;
        expect(descriptor.validatorDescriptors!.length).toBe(2);
        expect(descriptor.validatorDescriptors![0].conditionDescriptor).not.toBeNull();
        expect(descriptor.validatorDescriptors![0].conditionDescriptor!.type).toBe(ConditionType.RequiredText);
        expect(descriptor.validatorDescriptors![1].conditionDescriptor).not.toBeNull();
        expect(descriptor.validatorDescriptors![1].conditionDescriptor!.type).toBe(ConditionType.RegExp);
        expect((descriptor.validatorDescriptors![1].conditionDescriptor! as RegExpConditionDescriptor).expressionAsString).toBe('\\d');
    });
});
describe('customRule', () => {
    test('Provide a valid function and get back a FluentValidatorCollector with inputValidatorDescriptor.conditionCreator setup, and  conditionDescriptor null', () => {
        let testItem = configInput('Field1').customRule((requester) =>
            {
                return new RequiredTextCondition({ type: ConditionType.RequiredText, valueHostName: null });
            },
            'Error',
            {
                summaryMessage: 'Summary'
            });
        expect(testItem).toBeInstanceOf(FluentValidatorCollector);
        let descriptor = (testItem as FluentValidatorCollector).descriptor;
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
describe('Fluent chaining on configChildren', () => {
    test('configChildren: Add RequiredTest condition to InputValueHostDescriptor via chaining', () => {
        let testItem = configChildren().testChain1RequiredText({});
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let descriptor = (testItem as FluentConditionCollector).descriptor;
        expect(descriptor.conditionDescriptors!.length).toBe(1);
        expect(descriptor.conditionDescriptors![0]).not.toBeNull();
        expect(descriptor.conditionDescriptors![0].type).toBe(ConditionType.RequiredText);
    });
    test('configChildren: Add RequiredTest and RegExp conditions to InputValueHostDescriptor via chaining', () => {
        let testItem = configChildren()
            .testChain1RequiredText({})
            .testChain2RegExp({ expressionAsString: '\\d' });
        expect(testItem).toBeInstanceOf(FluentConditionCollector);
        let descriptor = (testItem as FluentConditionCollector).descriptor;
        expect(descriptor.conditionDescriptors!.length).toBe(2);
        expect(descriptor.conditionDescriptors![0]).not.toBeNull();
        expect(descriptor.conditionDescriptors![0].type).toBe(ConditionType.RequiredText);
        expect(descriptor.conditionDescriptors![1]).not.toBeNull();
        expect(descriptor.conditionDescriptors![1].type).toBe(ConditionType.RegExp);
        expect((descriptor.conditionDescriptors![1] as RegExpConditionDescriptor).expressionAsString).toBe('\\d');
    });
});