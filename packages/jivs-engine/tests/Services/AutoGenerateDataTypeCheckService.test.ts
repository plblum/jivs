import { DataTypeCheckCondition, RegExpCondition, RegExpConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { ICondition, IConditionFactory } from "../../src/Interfaces/Conditions";
import { IDataTypeCheckGenerator } from "../../src/Interfaces/DataTypeCheckGenerator";
import { IInputValueHost } from "../../src/Interfaces/InputValueHost";
import { AutoGenerateDataTypeCheckService } from "../../src/Services/AutoGenerateDataTypeCheckService";
import { MockValidationServices, MockValidationManager } from "../TestSupport/mocks";

class TestCheckGenerator implements IDataTypeCheckGenerator {
    constructor(dataTypeLookupKey: string, returns: ICondition | null) {
        this.DataTypeLookupKey = dataTypeLookupKey;
        this.Returns = returns;
    }
    DataTypeLookupKey: string;
    Returns: ICondition | null;
    supportsValue(dataTypeLookupKey: string): boolean {
        return this.DataTypeLookupKey === dataTypeLookupKey;
    }
    createCondition(valueHost: IInputValueHost, dataTypeLookupKey: string,
        conditionfactory: IConditionFactory): ICondition | null {
        return this.Returns;
    }

}
describe('AutoGenerateDataTypeCheckService.RegisterDataTypeCheckGenerator', () => {
    test('Invalid parameters', () => {
        let testItem = new AutoGenerateDataTypeCheckService();
        expect(() => testItem.register(null!)).toThrow(/item/);
    });
    test('Register successful', () => {
        const knownLookupKey = 'ABC';
        let testItem = new AutoGenerateDataTypeCheckService();
        expect(() => testItem.register(new TestCheckGenerator(knownLookupKey, null))).not.toThrow();
        expect(testItem.find(knownLookupKey)).not.toBeNull();
        expect(testItem.find('unknown')).toBeNull();
    });
});
describe('AutoGenerateDataTypeCheckService.AutoGenerateDataTypeCondition', ()=> {
    test('Not registered lookupKey returns DataTypeCheckCondition', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost('Field1', LookupKey.String, 'label');
        let testItem = services.autoGenerateDataTypeCheckService;
        let condition: ICondition | null = null;

        expect(() => condition = testItem.autoGenerateDataTypeCondition(vh, 'ANYTHING')).not.toThrow();
        expect(condition).toBeInstanceOf(DataTypeCheckCondition);
        // really should test for the Config.valueHostName to be 'Field1'
        // and Type to be DataTypeCheck, but Config is protected.
    });
    test('Registered with a class that returns a condition. Returns an instance of that condition for the same ValueHostName', () => {
        let services = new MockValidationServices(true, true);
        (services.conditionFactory as ConditionFactory).register<RegExpConditionConfig>(
            ConditionType.RegExp, (config) => new RegExpCondition(config));        
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost('Field1', LookupKey.String, 'label');
        let testItem = services.autoGenerateDataTypeCheckService as AutoGenerateDataTypeCheckService;
        let condition: ICondition | null = new RegExpCondition({
            conditionType: ConditionType.RegExp,
            expressionAsString: 'test',
            valueHostName: vh.getName()
        });
        testItem.register(new TestCheckGenerator('ABC', condition));

        expect(() => condition = testItem.autoGenerateDataTypeCondition(vh, 'ABC')).not.toThrow();
        expect(condition).toBeInstanceOf(RegExpCondition);
    });    
    test('Registered with a class that returns null. Returns null', () => {
        let services = new MockValidationServices(true, true);
        let vm = new MockValidationManager(services);
        let vh = vm.addMockInputValueHost('Field1', LookupKey.String, 'label');
        let testItem = services.autoGenerateDataTypeCheckService as AutoGenerateDataTypeCheckService;
        let condition: ICondition | null = null;
        testItem.register(new TestCheckGenerator('ABC', condition));

        expect(() => condition = testItem.autoGenerateDataTypeCondition(vh, 'ABC')).not.toThrow();
        expect(condition).toBeNull();
    });       
});
