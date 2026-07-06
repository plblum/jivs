import { FluentSingleFieldConditionBuilder, FluentMultiFieldConditionBuilder } from '../../src/Builder/FluentFieldConditionBuilder';
import { FluentOneConditionBuilder, FluentConditionBuilder } from '../../src/Builder/Fluent';
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ConditionWithChildrenBaseConfig } from "../../src/Conditions/ConditionWithChildrenBase";
import { RequireTextConditionConfig } from '../../src/Conditions/ConcreteConditions';

describe('FluentSingleFieldConditionBuilder tests', () => {
    test('constructor sets parentConfig', () => {
        const parentConfig: ConditionWithChildrenBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        const builder = new FluentSingleFieldConditionBuilder(parentConfig);
        expect(builder['parentConfig']).toBe(parentConfig);
    });
    test('constructor with null parentConfig sets parentConfig to null', () => {
        const builder = new FluentSingleFieldConditionBuilder(null);
        expect(builder['parentConfig']).toBeNull();
    });
    test('constructor with undefined parentConfig sets parentConfig to undefined', () => {
        const builder = new FluentSingleFieldConditionBuilder(undefined);
        expect(builder['parentConfig']).toBeUndefined();
    });
    test('parentValue returns a FluentOneConditionBuilder with null valueHostName', () => {
        const builder = new FluentSingleFieldConditionBuilder(null);
        const result = builder.parentValue();
        expect(result).toBeInstanceOf(FluentOneConditionBuilder);
        expect(result.valueHostName).toBeNull();
    });
    test('fieldValue returns a FluentOneConditionBuilder with specified valueHostName', () => {
        const builder = new FluentSingleFieldConditionBuilder(null);
        const valueHostName = 'testField';
        const result = builder.fieldValue(valueHostName);
        expect(result).toBeInstanceOf(FluentOneConditionBuilder);
        expect(result.valueHostName).toBe(valueHostName);
    });
});

describe('FluentMultiFieldConditionBuilder tests', () => {
    test('constructor sets parentConfig', () => {
        const parentConfig: ConditionWithChildrenBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        const builder = new FluentMultiFieldConditionBuilder(parentConfig);
        expect(builder['parentConfig']).toBe(parentConfig);
    });
    test('constructor with null parentConfig sets parentConfig to null', () => {
        const builder = new FluentMultiFieldConditionBuilder(null);
        expect(builder['parentConfig']).toBeNull();
    });
    test('constructor with undefined parentConfig sets parentConfig to undefined', () => {
        const builder = new FluentMultiFieldConditionBuilder(undefined);
        expect(builder['parentConfig']).toBeUndefined();
    });
    test('parentValue returns a FluentConditionBuilder with null valueHostName', () => {
        const builder = new FluentMultiFieldConditionBuilder(null);
        const result = builder.parentValue();
        expect(result).toBeInstanceOf(FluentConditionBuilder);
        expect(result.valueHostName).toBeNull();
    });
    test('fieldValue returns a FluentConditionBuilder with specified valueHostName', () => {
        const builder = new FluentMultiFieldConditionBuilder(null);
        const valueHostName = 'testField';
        const result = builder.fieldValue(valueHostName);
        expect(result).toBeInstanceOf(FluentConditionBuilder);
        expect(result.valueHostName).toBe(valueHostName);
    }); 
});
describe('conditionConfig method tests', () => {
    test('Returns FluentConditionBuilder with specified conditionConfig in parentConfig', () => {
        const conditionConfig = { conditionType: ConditionType.RequireText, valueHostName: 'Field1' };
        const expectedParentConfig: ConditionWithChildrenBaseConfig = {
            conditionType: 'TBD',
            conditionConfigs: [<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field1'
            }]
        };        
        const builder = new FluentSingleFieldConditionBuilder(null);
        const result = builder.conditionConfig(conditionConfig);
        expect(result).toBeInstanceOf(FluentConditionBuilder);
        expect(result.parentConfig).toEqual(expectedParentConfig);
    });
    test('conditionConfig with valid config returns FluentConditionBuilde with parent', () => {
        const parentConfig: ConditionWithChildrenBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        const conditionConfig = { conditionType: ConditionType.RequireText, valueHostName: 'Field1' };
        const expectedParentConfig: ConditionWithChildrenBaseConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field1'
            }]
        };

        const builder = new FluentSingleFieldConditionBuilder(parentConfig);
        const result = builder.conditionConfig(conditionConfig);
        expect(result).toBeInstanceOf(FluentConditionBuilder);
        expect(result.parentConfig).toEqual(expectedParentConfig);

    });    
});