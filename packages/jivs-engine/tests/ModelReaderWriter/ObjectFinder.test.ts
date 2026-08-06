import { ObjectFinder } from '../../src/ModelReaderWriter/ObjectFinder';

describe('ObjectFinder', () =>
{
    test('Object with property "Name" found when syntax="Name"', () =>
    {
        let model = { Name: 'TestName', Age: 30 };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'Name');
        expect(result.object).toBe(model);
        expect(result.propertyName).toBe('Name');
    });
    test('Object with property "Name" found when syntax="NonExistentProperty" because we let the caller establish if the property exists.', () =>
    {
        let model = { Name: 'TestName', Age: 30 };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'NonExistentProperty');
        expect(result.object).toBe(model);
        expect(result.propertyName).toBe('NonExistentProperty');
    });
    test('Array of objects with property "Name" found when syntax="[0].Name"', () =>
    {
        let model = [{ Name: 'TestName1', Age: 30 }, { Name: 'TestName2', Age: 25 }];
        let finder = new ObjectFinder();
        let result = finder.find(model, '[0].Name');
        expect(result.object).toBe(model[0]);
        expect(result.propertyName).toBe('Name');
    });
    test('Array of objects with property "Name" found when syntax="[1].Name"', () =>
    {
        let model = [{ Name: 'TestName1', Age: 30 }, { Name: 'TestName2', Age: 25 }];
        let finder = new ObjectFinder();
        let result = finder.find(model, '[1].Name');
        expect(result.object).toBe(model[1]);
        expect(result.propertyName).toBe('Name');
    });
    test('Nested object with property "Name" found when syntax="Address.Street.Name"', () =>
    {
        let model = { Address: { Street: { Name: 'Main St', Number: 123 } } };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'Address.Street.Name');
        expect(result.object).toBe(model.Address.Street);
        expect(result.propertyName).toBe('Name');
    });
    test('Nested object with property "Name" found when syntax="Address.Street.NonExistentProperty" because we let the caller establish if the property exists.', () =>
    {
        let model = { Address: { Street: { Name: 'Main St', Number: 123 } } };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'Address.Street.NonExistentProperty');
        expect(result.object).toBe(model.Address.Street);
        expect(result.propertyName).toBe('NonExistentProperty');
    });

    test('Nested array of objects with property "Name" found when syntax="Addresses[1].Street.Name"', () =>
    {
        let model = { Addresses: [{ Street: { Name: 'First St', Number: 1 } }, { Street: { Name: 'Second St', Number: 2 } }] };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'Addresses[1].Street.Name');
        expect(result.object).toBe(model.Addresses[1].Street);
        expect(result.propertyName).toBe('Name');
    });
    // object with 'child' property that is an array of objects with property 'Name'
    test('Object with property "child[0].Name" found when syntax="child[0].Name"', () =>
    {
        let model = { child: [{ Name: 'Child1' }, { Name: 'Child2' }] };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'child[0].Name');
        expect(result.object).toBe(model.child[0]);
        expect(result.propertyName).toBe('Name');
    });
    test('Object with property "child[1].Name" found when syntax="child[1].Name"', () =>
    {
        let model = { child: [{ Name: 'Child1' }, { Name: 'Child2' }] };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'child[1].Name');
        expect(result.object).toBe(model.child[1]);
        expect(result.propertyName).toBe('Name');
    });
    test('Object with property "child[1].Name" found when syntax="child[1].NonExistentProperty" because we let the caller establish if the property exists.', () =>
    {
        let model = { child: [{ Name: 'Child1' }, { Name: 'Child2' }] };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'child[1].NonExistentProperty');
        expect(result.object).toBe(model.child[1]);
        expect(result.propertyName).toBe('NonExistentProperty');
    });

    // test for invalid characters and expect undefined results
    test('Invalid path with special characters returns undefined', () =>
    {
        let model = { Name: 'TestName', Age: 30 };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'Name$');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        // more tests here:
        result = finder.find(model, 'Name@');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Name#');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Name!');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        // characters in the middle
        result = finder.find(model, 'Na$me');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Na@me');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Na#me');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Na!me');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        // test spaces are rejected
        result = finder.find(model, 'Na me');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Name ');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
    });
    // invalid first or last character
    test('Invalid path with first or last character returns undefined', () =>
    {
        let model = { Name: 'TestName', Age: 30 };
        let finder = new ObjectFinder();
        let result = finder.find(model, '.Name');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Name.');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, '0Name');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Name[');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, ']Name');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Name[0]'); // because the last character is a closing bracket, it is invalid unless followed by a period and property name
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();        
    });
    // square brackets don't have only digits and at least one
    test('Invalid path with square brackets returns undefined', () =>
    {
        let model = { Name: 'TestName', Age: 30 };
        let finder = new ObjectFinder();
        let result = finder.find(model, 'Name[abc].name');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        result = finder.find(model, 'Name[].name');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
        // spaces
        result = finder.find(model, 'Name[ 0 ].name');
        expect(result.object).toBeUndefined();
        expect(result.propertyName).toBeUndefined();
    });

    
});