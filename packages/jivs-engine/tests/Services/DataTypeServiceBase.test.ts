import { BooleanFormatter, NumberFormatter } from "../../src/DataTypes/DataTypeFormatters";
import { LookupKey } from "../../src/DataTypes/LookupKeys";

import { MockValidationServices } from "../TestSupport/mocks";
import { DataTypeServiceBase } from "../../src/Services/DataTypeServiceBase";
import { IServiceWithAccessor, IServices } from "../../src/Interfaces/Services";

class TestWithKey
{
    constructor(key: string)
    {
        this._key = key;
    }
    public get key(): string
    {
        return this._key;
    }
    private _key: string;
}
class TestItemWithService extends TestWithKey implements IServiceWithAccessor
{
    constructor(key: string)
    {
        super(key);
        this.services = undefined!;
    }    
    serviceName: string = 'testservice';
    dispose(): void {
        (this.services as any) = undefined;
    }
    services: IServices;
    
}
class PublicifyDataTypeServiceBase extends DataTypeServiceBase<TestWithKey>
{
    registerCanOverwrite: boolean = false;
    protected indexOfExisting(toFind: TestWithKey): number {
        if (this.registerCanOverwrite)
            return -1;
        return this.getAll().findIndex((item) => item.key === toFind.key) ?? -1;
    }

    public find(key: string): TestWithKey | null
    {
        return this.getAll().find((item) => item.key === key) ?? null;
    }
    
    publicify_getAll(): Array<TestWithKey>
    {
        return super.getAll();
    }
}
describe('PublicifyDataTypeServiceBase constructor and properties', () => {

    test('Constructor with no parameters', () => {
        let testItem = new PublicifyDataTypeServiceBase();
        expect(() => testItem.services).toThrow(/Assign/);

    });

    test('Attach Services returns the same instance', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new PublicifyDataTypeServiceBase();
        expect(() => testItem.services = services).not.toThrow();
        let x: any;
        expect(() => x = testItem.services).not.toThrow();
        expect(x).toBe(services);
    });
});

describe('PublicifyDataTypeServiceBase register, unregister', () => {
    describe('With registerCanOverwrite=false', () => {
        test('register and find registered returns the same class', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            let toRegister = new TestWithKey('TEST');
            expect(() => testItem.register(toRegister)).not.toThrow();
            let result = testItem.find('TEST');
            expect(result).toBe(toRegister);
        });
        test('register 2 different ones and find both returns the same class', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            let toRegister1 = new TestWithKey('TEST1');
            let toRegister2 = new TestWithKey('TEST2');        
            expect(() => testItem.register(toRegister1)).not.toThrow();
            expect(() => testItem.register(toRegister2)).not.toThrow();
    
            expect(testItem.find('TEST1')).toBe(toRegister1);
            expect(testItem.find('TEST2')).toBe(toRegister2);        
            expect(testItem.publicify_getAll().length).toBe(2);
        });
        test('register 2 instances of the same retains 1', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            let toRegister1 = new TestWithKey('TEST1');
            let toRegister2 = new TestWithKey('TEST1');        
            expect(() => testItem.register(toRegister1)).not.toThrow();
            expect(() => testItem.register(toRegister2)).not.toThrow();
    
            expect(testItem.find('TEST1')).toBe(toRegister2);
            expect(testItem.publicify_getAll().length).toBe(1);
        });        
        test('register with an item that implements IServicesAccessor assigns services to that item', () => {
            let services = new MockValidationServices(false, false);
            let testItem = new PublicifyDataTypeServiceBase();
            testItem.services = services;
            let toRegister = new TestItemWithService('TEST');
            expect(() => testItem.register(toRegister)).not.toThrow();
            let result = testItem.find('TEST');
            expect(result).toBe(toRegister);
            let resultTypecast = result as TestItemWithService;
            expect(resultTypecast.services).toBe(services);
        });       
        test('register with an item that implements IServicesAccessor but has no services to offer does not assign services to that item', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            let toRegister = new TestItemWithService('TEST');
            expect(() => testItem.register(toRegister)).not.toThrow();
            let result = testItem.find('TEST');
            expect(result).toBe(toRegister);
            let resultTypecast = result as TestItemWithService;
            expect(resultTypecast.services).toBeUndefined();
        });             
    });
    describe('With registerCanOverwrite=true', () => {
        test('register and find registered returns the same class', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            testItem.registerCanOverwrite = true;
            let toRegister = new TestWithKey('TEST');
            expect(() => testItem.register(toRegister)).not.toThrow();
            let result = testItem.find('TEST');
            expect(result).toBe(toRegister);
        });
        test('register 2 different ones and find both returns the same class', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            testItem.registerCanOverwrite = true;
            let toRegister1 = new TestWithKey('TEST1');
            let toRegister2 = new TestWithKey('TEST2');        
            expect(() => testItem.register(toRegister1)).not.toThrow();
            expect(() => testItem.register(toRegister2)).not.toThrow();
    
            expect(testItem.find('TEST1')).toBe(toRegister1);
            expect(testItem.find('TEST2')).toBe(toRegister2);        
            expect(testItem.publicify_getAll().length).toBe(2);
        });
        test('register 2 instances of the same retains both', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            testItem.registerCanOverwrite = true;
            let toRegister1 = new TestWithKey('TEST1');
            let toRegister2 = new TestWithKey('TEST1');        
            expect(() => testItem.register(toRegister1)).not.toThrow();
            expect(() => testItem.register(toRegister2)).not.toThrow();
    
            expect(testItem.publicify_getAll().length).toBe(2);
        });        
        test('register with an item that implements IServicesAccessor assigns services to that item', () => {
            let services = new MockValidationServices(false, false);
            let testItem = new PublicifyDataTypeServiceBase();
            testItem.registerCanOverwrite = true;
            testItem.services = services;
            let toRegister = new TestItemWithService('TEST');
            expect(() => testItem.register(toRegister)).not.toThrow();
            let result = testItem.find('TEST');
            expect(result).toBe(toRegister);
            let resultTypecast = result as TestItemWithService;
            expect(resultTypecast.services).toBe(services);
        });       
        test('register with an item that implements IServicesAccessor but has no services to offer does not assign services to that item', () => {
            let testItem = new PublicifyDataTypeServiceBase();
            testItem.registerCanOverwrite = true;
            let toRegister = new TestItemWithService('TEST');
            expect(() => testItem.register(toRegister)).not.toThrow();
            let result = testItem.find('TEST');
            expect(result).toBe(toRegister);
            let resultTypecast = result as TestItemWithService;
            expect(resultTypecast.services).toBeUndefined();
        });             
    });
    test('Invalid parameters', () => {
        let testItem = new PublicifyDataTypeServiceBase();
        expect(() => testItem.register(null!)).toThrow(/item/);
    });    
    test('Attach Services after register assigns service to existing registered items', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new PublicifyDataTypeServiceBase();
        let toRegister = new TestItemWithService('TEST');
        testItem.register(toRegister);
        expect(toRegister.services).toBeUndefined();
        testItem.services = services;
        expect(toRegister.services).toBe(services);
    });    
});
describe('dispose()', () => {

    test('dispose before services assigned throws when requesting services', () => {
        let testItem = new PublicifyDataTypeServiceBase();
        testItem.dispose();
        expect(() => testItem.services).toThrow(/Assign/);
    });

    test('dispose after services assigned throws when requesting services', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new PublicifyDataTypeServiceBase();
        testItem.services = services;
        testItem.dispose();
        expect(() => testItem.register(new TestWithKey('TEST'))).toThrow(TypeError);

        expect(() => testItem.services).toThrow(/Assign/);

    });
});