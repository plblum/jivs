/** @jest-environment jsdom */
import { createTestForm, createTestPage } from './CreateTestForm';
import { createDefaultTestFieldRepository } from './TestFieldRepository';
import { testEachFieldTemplate, testEachIdentity, useCleanDocument } from './TestFileSupport';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';

// When true, emits HTML and element registry information to the console.
let verbose = false;

useCleanDocument();

/**
 * TestForm.registry and TestForm.collect. The registry belongs to the manager, and collect()
 * rebuilds it from the manager's container only.
 */
describe('createTestForm registry and collect', () =>
{
    test('With install:false, the registry is empty until collect() runs', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        t.page.assign();
        expect(Array.from(t.registry).length).toBe(0);
        t.collect();
        expect(t.registry.getElementsByRole('editor', 'Text_Required').length).toBe(1);
    });

    test('registry returns the same object each time', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], verbose: verbose });
        expect(t.registry).toBe(t.registry);
    });

    test('collect() twice does not throw a duplicate error because it clears the registry first', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        t.page.assign();
        t.collect();
        const count = Array.from(t.registry).length;
        expect(() => t.collect()).not.toThrow();
        expect(Array.from(t.registry).length).toBe(count);
    });

    test('collect() gathers only the form container when containerIdentifier is used', () =>
    {
        const a = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        const b = createTestForm({ fields: ['Checkbox'], containerIdentifier: '#two', install: false, verbose: verbose });
        createTestPage(a, b);
        a.collect();
        expect(Array.from(a.registry).length).toBe(3);
        expect(Array.from(b.registry).length).toBe(0);
    });
});

/**
 * TestForm.element finds role elements by data-jivs-role and optional data-field,
 * scoped to the container.
 */
describe('createTestForm element', () =>
{
    test('Finds by role alone and by role plus field name', () =>
    {
        const t = createTestForm({ fields: ['Text_Required', 'Checkbox'], verbose: verbose });
        expect(t.element('editor').getAttribute('data-field')).toBe('Text_Required');
        expect(t.element('editor', 'Checkbox').getAttribute('data-field')).toBe('Checkbox');
        expect(t.element('label', 'Checkbox').getAttribute('data-jivs-role')).toBe('label');
    });

    test('Throws, naming the selector, when nothing matches', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], verbose: verbose });
        expect(() => t.element('editor', 'Missing')).toThrow(/data-jivs-role='editor'\]\[data-field='Missing'/);
        expect(() => t.element('summary')).toThrow(/No element matches/);
    });

    test('Searches only within the manager container', () =>
    {
        const a = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        const b = createTestForm({ fields: ['Checkbox'], containerIdentifier: '#two', install: false, verbose: verbose });
        createTestPage(a, b);
        expect(a.element('editor', 'Text_Required').closest('#one')).not.toBeNull();
        expect(() => a.element('editor', 'Checkbox')).toThrow(/No element matches/);
        expect(b.element('editor').closest('#two')).not.toBeNull();
    });
});

/**
 * TestForm.recordFor and TestForm.editorOf read installed state from the registry.
 */
describe('createTestForm recordFor and editorOf', () =>
{
    test('recordFor returns the record for a registered element', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], verbose: verbose });
        const record = t.recordFor(t.element('label'));
        expect(record).not.toBeNull();
        expect(record!.role).toBe('label');
    });

    test('recordFor returns null for an element outside the registry', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], verbose: verbose });
        expect(t.recordFor(document.createElement('div'))).toBeNull();
    });

    test('editorOf returns the installed IJivsElement', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], verbose: verbose });
        expect(t.editorOf('Text_Required').jivsElementRole).toBe('editor');
        expect(t.editorOf('Text_Required')).toBe(t.element('editor', 'Text_Required'));
    });

    test('editorOf throws when only the collector ran, so nothing is installed', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        t.page.assign();
        t.collect();
        expect(() => t.editorOf('Text_Required')).toThrow(/'Text_Required' is not installed/);
    });

    test('editorOf throws when the page has no such editor', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], verbose: verbose });
        expect(() => t.editorOf('Missing')).toThrow(/No element matches/);
    });
});

/**
 * TestForm.replace simulates AJAX. The new markup uses the same context, and the test then
 * collects or installs again.
 */
describe('createTestForm replace', () =>
{
    test('Replaces the children, and install() then matches the new markup', () =>
    {
        const t = createTestForm({ fields: ['Text_Required', 'Checkbox'], verbose: verbose });
        const oldBox = t.element('editor', 'Checkbox').parentElement!;
        const oldEditor = t.element('editor', 'Checkbox');
        t.replace(oldBox, page => page.field('Checkbox', 'labelAfter'));
        expect(document.contains(oldEditor)).toBe(false);
        t.install();
        t.runner.assertFormInstallation(document, t.vhm);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('collect() also works after replace', () =>
    {
        const t = createTestForm({ fields: ['Text_Required', 'Checkbox'], install: false, verbose: verbose });
        t.page.assign();
        t.collect();
        t.replace(t.element('editor', 'Checkbox').parentElement!, page => page.field('Checkbox', 'editorOnly'));
        t.collect();
        t.runner.assertCollection(document, t.vhm);
        expect(t.registry.getElementsByRole('label', 'Checkbox').length).toBe(0);
    });
});

/**
 * createTestPage joins several forms into document.body and runs install or collect on each.
 */
describe('createTestPage', () =>
{
    test('Throws when given no forms', () =>
    {
        expect(() => createTestPage()).toThrow(/at least one form/);
    });

    test('A single form is written to the document', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        const page = createTestPage(t);
        expect(page.forms).toEqual([t]);
        expect(document.querySelectorAll('[data-jivs-role]').length).toBeGreaterThan(0);
    });

    test('install() installs every form independently', () =>
    {
        const a = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        const b = createTestForm({ fields: ['Checkbox'], containerIdentifier: '#two', install: false, verbose: verbose });
        createTestPage(a, b).install();
        expect(a.editorOf('Text_Required')).toBeDefined();
        expect(b.editorOf('Checkbox')).toBeDefined();
        a.runner.assertFormInstallation(document, a.vhm);
        b.runner.assertFormInstallation(document, b.vhm);
        expect(a.services.loggingService.entryCount).toBe(0);
        expect(b.services.loggingService.entryCount).toBe(0);
    });

    test('collect() fills each form registry only', () =>
    {
        const a = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        const b = createTestForm({ fields: ['Checkbox'], containerIdentifier: '#two', install: false, verbose: verbose });
        createTestPage(a, b).collect();
        expect(a.registry.getElementsByRole('editor', 'Text_Required').length).toBe(1);
        expect(a.registry.getElementsByRole('editor', 'Checkbox').length).toBe(0);
        expect(b.registry.getElementsByRole('editor', 'Checkbox').length).toBe(1);
    });
});

/**
 * createTestForm sets the logger level to Warn by default, so warnings reach the TestingLoggingService.
 * A test can still override it.
 */
describe('createTestForm default logger level', () =>
{
    test('Warnings are captured by default', () =>
    {
        const t = createTestForm({
            build: page => { page.inputEditor('NotInManager'); }, verbose: verbose
        });
        expect(t.services.loggingService.entryCount).toBe(1);
    });

    test('servicesConfigOptions.loggerLevel overrides the default', () =>
    {
        const t = createTestForm({
            build: page => { page.inputEditor('NotInManager'); },
            servicesConfigOptions: { loggerLevel: LoggingLevel.Error }, verbose: verbose
        });
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * TestFileSupport helpers. useCleanDocument runs after each test in the describe.
 * The sweeps register one test per identity or template; the final test in the describe compares
 * what they ran against the repository.
 */
describe('useCleanDocument', () =>
{
    useCleanDocument();

    test('First test leaves content in the body', () =>
    {
        document.body.innerHTML = '<div id="leftover"></div>';
        expect(document.getElementById('leftover')).not.toBeNull();
    });

    test('Second test starts with an empty body', () =>
    {
        expect(document.body.innerHTML).toBe('');
    });
});

describe('testEachIdentity', () =>
{
    const ran: string[] = [];
    testEachIdentity('runs for %s', name => { ran.push(name); });

    test('Ran once for every identity in the default repository', () =>
    {
        expect(ran).toEqual(createDefaultTestFieldRepository().identityNames());
    });
});

describe('testEachFieldTemplate', () =>
{
    const ran: string[] = [];
    testEachFieldTemplate('runs for %s', name => { ran.push(name); });

    test('Ran once for every field template in the default repository', () =>
    {
        expect(ran).toEqual(createDefaultTestFieldRepository().fieldTemplateNames());
    });
});

describe('testEachIdentity with a custom repository', () =>
{
    const repo = createDefaultTestFieldRepository();
    const ran: string[] = [];
    testEachIdentity('runs for %s', name => { ran.push(name); }, repo);

    test('Uses the repository passed in', () =>
    {
        expect(ran).toEqual(repo.identityNames());
    });
});
