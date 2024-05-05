import { ValueHostAccessor } from "../../src/ValueHosts/ValueHostAccessor";
import { ValueHostsManagerConfig } from "../../src/Interfaces/ValueHostsManager";
import { ValueHostsManager } from "../../src/ValueHosts/ValueHostsManager";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { ValueHostType } from "../../src/Interfaces/ValueHostFactory";
import { InputValueHost } from "../../src/ValueHosts/InputValueHost";
import { StaticValueHost } from "../../src/ValueHosts/StaticValueHost";
import { CalcValueHost } from "../../src/ValueHosts/CalcValueHost";
import { PropertyValueHost } from "../../src/ValueHosts/PropertyValueHost";

describe('constructor', () => {
    test('Valid parameter does not throw', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem: ValueHostAccessor;
        expect(() => testItem = new ValueHostAccessor(vhm)).not.toThrow();        
    });
    test('Null parameter throws', () => {
        expect(() => new ValueHostAccessor(null!)).toThrow(/resolver/);
    });
});
describe('input', () => {
    test('Existing InputValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.input('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(InputValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches CalcValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.input('Field1')).toThrow(/InputValueHost/);
    });    
    test('Matches PropertyValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Property,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.input('Field1')).toThrow(/InputValueHost/);
    });    
    test('Matches StaticValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.input('Field1')).toThrow(/InputValueHost/);
    });
    test('Unknown valueHostName', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.input('Field1')).toThrow(/unknown/);
    });      
});

describe('property', () => {
    test('Existing PropertyValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Property,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.property('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(PropertyValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches CalcValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.property('Field1')).toThrow(/PropertyValueHost/);
    });    
    test('Matches StaticValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.property('Field1')).toThrow(/PropertyValueHost/);
    });    
    test('Matches InputValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.property('Field1')).toThrow(/PropertyValueHost/);
    });        
    test('Unknown valueHostName', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.property('Field1')).toThrow(/unknown/);
    });      
});

describe('static', () => {
    test('Existing StaticValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(StaticValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches CalcValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).toThrow(/StaticValueHost/);
    });    
    test('Matches InputValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).toThrow(/StaticValueHost/);
    });    
    test('Matches PropertyValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Property,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).toThrow(/StaticValueHost/);
    });        
    test('Unknown valueHostName', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.static('Field1')).toThrow(/unknown/);
    });      
});
describe('calc', () => {
    test('Existing CalcValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(CalcValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches StaticValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).toThrow(/CalcValueHost/);
    });    
    test('Matches InputValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).toThrow(/CalcValueHost/);
    });    
    test('Matches PropertyValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Property,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).toThrow(/CalcValueHost/);
    });        
    test('Unknown valueHostName', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.calc('Field1')).toThrow(/unknown/);
    });      
});
describe('any', () => {
    test('Existing InputValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(InputValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Existing PropertyValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Property,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(PropertyValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Existing StaticValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(StaticValueHost);
        expect(result.getName()).toBe('Field1');
    });    
    test('Existing CalcValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(CalcValueHost);
        expect(result.getName()).toBe('Field1');
    });    
    test('Unknown valueHostName', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.any('Field1')).toThrow(/unknown/);
    });      
});

describe('validators', () => {
    test('Existing InputValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Input,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(InputValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Existing PropertyValueHost', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Property,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).not.toThrow();
        expect(result).toBeInstanceOf(PropertyValueHost);
        expect(result.getName()).toBe('Field1');
    });
    test('Matches StaticValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).toThrow(/ValidatorsValueHostBase/);
    });    
    test('Matches CalcValueHost throws', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: [{
                valueHostType: ValueHostType.Calc,
                name: 'Field1'
            }]
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).toThrow(/ValidatorsValueHostBase/);
    });        
    test('Unknown valueHostName', () => {
        let vhConfig: ValueHostsManagerConfig = {
            services: createValidationServicesForTesting(),
            valueHostConfigs: []
        };
        let vhm = new ValueHostsManager(vhConfig);
        let testItem = new ValueHostAccessor(vhm);    
        let result: any;
        expect(() => result = testItem.validators('Field1')).toThrow(/unknown/);
    });      
});
