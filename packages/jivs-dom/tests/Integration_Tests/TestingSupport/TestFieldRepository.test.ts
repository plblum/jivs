/** @jest-environment jsdom */
import { createTestForm } from './CreateTestForm';
import { createDefaultTestFieldRepository, TestFieldEntry } from './TestFieldRepository';
import { TestPropertiesRules } from './TestPropertiesRules';
import { createJivsServicesForTesting } from '../../TestSupport/CreateJivsServicesForTesting';

afterEach(() => { document.body.innerHTML = ''; });

// Verifies the entry registry: lookup, duplicates, and the starter set.
describe('TestFieldRepository', () =>
{
    test('default repository has the starter entries', () =>
    {
        expect(createDefaultTestFieldRepository().names()).toEqual([
            'Text_Required', 'Number_Range', 'Date_Required_LessThan',
            'Checkbox', 'Select_Required', 'Radio_Required']);
    });
    test('get throws for unknown name and register throws for duplicates', () =>
    {
        const repo = createDefaultTestFieldRepository();
        expect(() => repo.get('Nope')).toThrow(/not registered/);
        expect(() => repo.register(new TestFieldEntry('Checkbox', '', false, () => {}, () => {})))
            .toThrow(/already registered/);
    });
});

// TestPropertiesRules builds a config from the requested entries, and caches per property set.
describe('TestPropertiesRules', () =>
{
    test('configures only the requested properties and does not share cache between sets', () =>
    {
        const services = createJivsServicesForTesting({ registerConditions: 'all' });
        const repo = createDefaultTestFieldRepository();
        const a = new TestPropertiesRules(services, ['Text_Required'], repo).configure();
        const b = new TestPropertiesRules(services, ['Text_Required', 'Checkbox'], repo).configure();
        expect(a.valueHostConfigs.map(c => c.name)).toEqual(['Text_Required']);
        expect(b.valueHostConfigs.map(c => c.name)).toEqual(['Text_Required', 'Checkbox']);
    });
});

// createTestForm assembles manager, form HTML and installs it; the runner then validates every element.
describe('createTestForm', () =>
{
    test('installs all starter fields and passes the installation assertions', () =>
    {
        const t = createTestForm(createDefaultTestFieldRepository().names());
        expect(document.querySelectorAll('[data-field]').length).toBeGreaterThan(6);
        t.runner.assertFormInstallation(document, t.vhm);
    });
    test('options control companion elements and containers', () =>
    {
        const t = createTestForm(['Text_Required', 'Checkbox'], {
            blocks: { Text_Required: { container: true, ariaError: true }, Checkbox: { label: false, errorDisplay: false } }
        });
        expect(document.querySelectorAll("[data-jivs-role='aria-error']").length).toBe(1);
        expect(document.querySelectorAll("[data-jivs-role='container']").length).toBe(1);
        expect(document.querySelectorAll("[data-jivs-role='required']").length).toBe(1);
        t.runner.assertFormInstallation(document, t.vhm);
    });
    test('install:false leaves the document untouched', () =>
    {
        createTestForm(['Text_Required'], { install: false });
        expect(document.body.innerHTML).toBe('');
    });
});
