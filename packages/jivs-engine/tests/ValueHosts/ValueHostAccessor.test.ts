import { ValueHostAccessor } from "../../src/ValueHosts/ValueHostAccessor";
import { ValidationManagerConfig } from "../../src/Interfaces/ValidationManager";
import { ValidationManager } from "../../src/Validation/ValidationManager";
import { createJivsServicesForTesting } from '../../src/Support/createJivsServicesForTesting';
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { FieldValueHost } from "../../src/ValueHosts/FieldValueHost";
import { StaticValueHost } from "../../src/ValueHosts/StaticValueHost";
import { CalcValueHost } from "../../src/ValueHosts/CalcValueHost";

describe('constructor', () => {
    test('Valid parameter does not throw', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem: ValueHostAccessor;
        expect(() => testItem = new ValueHostAccessor(vhm)).not.toThrow();        
    });
    test('Null parameter throws', () => {
        expect(() => new ValueHostAccessor(null!)).toThrow(/resolver/);
    });
});
describe('field', () => {
    test('Existing FieldValueHost', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.field('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(FieldValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches CalcValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.field('Field1')).toThrow(/FieldValueHost/);
    });    

    test('Matches StaticValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig); 
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.field('Field1')).toThrow(/FieldValueHost/);
    });
    test('Unknown valueHostName', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.field('Field1')).toThrow(/unknown/);
    });      
});

describe('static', () => {
    test('Existing StaticValueHost', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(StaticValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches CalcValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).toThrow(/StaticValueHost/);
    });    
    test('Matches FieldValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).toThrow(/StaticValueHost/);
    });    
  
    test('Unknown valueHostName', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).toThrow(/unknown/);
    });      
});
describe('calc', () => {
    test('Existing CalcValueHost', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(CalcValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches StaticValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).toThrow(/CalcValueHost/);
    });    
    test('Matches FieldValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).toThrow(/CalcValueHost/);
    });    
  
    test('Unknown valueHostName', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).toThrow(/unknown/);
    });      
});
describe('any', () => {
    test('Existing FieldValueHost', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(FieldValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Existing StaticValueHost', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(StaticValueHost);
        expect(result.getName()).toBe('Field1');
    });    
    test('Existing CalcValueHost', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(CalcValueHost);
        expect(result.getName()).toBe('Field1');
    });    
    test('Unknown valueHostName', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).toThrow(/unknown/);
    });      
});

describe('validators', () => {
    test('Existing FieldValueHost', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(FieldValueHost);
        expect(result.getName()).toBe('Field1');
    });

    test('Matches StaticValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).toThrow(/ValidatorsValueHostBase/);
    });    
    test('Matches CalcValueHost throws', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).toThrow(/ValidatorsValueHostBase/);
    });        
    test('Unknown valueHostName', () => {
        let vhConfig: ValidationManagerConfig = {
            services: createJivsServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValidationManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).toThrow(/unknown/);
    });      
});
