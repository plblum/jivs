/** @jest-environment jsdom */
import { createTestForm, createTestPage, type TestForm } from './TestingSupport/CreateTestForm';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { useCleanDocument } from './TestingSupport/TestFileSupport';
import { ElementRole } from '../../src/Interfaces/Types';
import type { IEditorElementRegistryRecord, IFieldElementRegistryRecord, IFormElementRegistryRecord } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';

// When true, emits HTML and element registry information to the console.
let verbose = false;

useCleanDocument();

// install:false leaves the document empty, so each test writes the page and runs only the collector.
function collect(t: TestForm): void
{
    t.page.assign();
    t.collect();
}
/**
 * These tests stop after SimpleDomElementCollector. The page comes from TestHtmlBuilder, the
 * collector fills the real ElementRegistry, and runner.assertCollection checks each record against
 * the descriptor that generated its element. FormInstaller never runs, so IJivsElement properties
 * are not examined here; those belong to the installation tests.
 */
describe('SimpleDomElementCollector with generated forms', () =>
{
    test('records carry the right roles for a container template', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], fieldTemplate: 'inContainer', install: false, verbose: verbose });
        collect(t);
        const registry = t.services.domServices.getElementRegistry(t.vhm);
        const roles = ['container', 'label', 'editor', 'required', 'error'];
        for (const role of roles)
            expect(registry.getElementsByRole(role, 'Text_Required').length).toBe(1);
        expect(registry.getElementsByRole(ElementRole.ariaError, 'Text_Required').length).toBe(0);
    });

    test('editor options pass presentation name and explicit adapter key to the editor record', () =>
    {
        const t = createTestForm({
            build: page => page.field('Text_Required', 'editorOnly',
                { presentationName: 'inputEditor', adapterKey: 'input:text' }),
            install: false,
            verbose: verbose
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        const editor = document.querySelector<IJivsElement>("[data-jivs-role='editor']")!;
        const record = t.services.domServices.getElementRegistry(t.vhm).getRecordForElement(editor) as IEditorElementRegistryRecord;
        expect(record.editorOptions?.adapterKey).toBe('input:text');
        expect(record.editorOptions?.presentationName).toBe('inputEditor');
    });

    test('summary and submit register as form records, with and without a group', () =>
    {
        const repo = createDefaultTestFieldRepository();
        repo.registerFormTemplate('grouped', page =>
        {
            const form = page.form('grouped-form');
            form.field('Text_Required');
            form.validationSummary(null, 'g1');
            form.submit(null, 'g1');
        });
        repo.registerFormTemplate('ungrouped', page =>
        {
            const form = page.form('ungrouped-form');
            form.field('Text_Required');
            form.validationSummary();
            form.submit();
        });
        for (const name of ['grouped', 'ungrouped'])
        {
            document.body.innerHTML = '';
            const t = createTestForm({ repository: repo, formTemplate: name, install: false, verbose: verbose });
            collect(t);
            t.runner.assertCollection(document, t.vhm);
            const registry = t.services.domServices.getElementRegistry(t.vhm);
            const summary = document.querySelector<IJivsElement>("[data-jivs-role='summary']")!;
            const record = registry.getRecordForElement(summary)!;
            expect(record.kind).toBe('form');
            expect(record.elementIdentifier).toBeNull();
            expect('group' in ((record as IFormElementRegistryRecord).presentationOptions ?? {})).toBe(name === 'grouped');
        }
    });

    test('a radio group registers its first radio only', () =>
    {
        const t = createTestForm({ fields: ['Radio_Required'], install: false, verbose: verbose });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        expect(document.querySelectorAll("input[type='radio']").length).toBeGreaterThan(1);
        expect(t.services.domServices.getElementRegistry(t.vhm).getElementsByRole(ElementRole.editor, 'Radio_Required').length).toBe(1);
    });

    test('a field name unknown to the manager is collected with no FieldValueHost', () =>
    {
        const t = createTestForm({
            verbose: verbose,
            build: page =>
            {
                page.field('Text_Required');
                // Built by hand, so context.fieldNames does not include it and the manager has no host for it.
                page.label('NotInManager', 'Orphan');
            },
            install: false
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        const orphan = document.querySelector<IJivsElement>("[data-field='NotInManager']")!;
        expect(t.services.domServices.getElementRegistry(t.vhm).getRecordForElement(orphan)!.fieldValueHost).toBeNull();
    });

    test('after AJAX-style replacement, clearing the registry and collecting again matches the new markup', () =>
    {
        const t = createTestForm({ fields: ['Text_Required', 'Checkbox'], install: false, verbose: verbose });
        collect(t);
        const oldBox = t.element('editor', 'Checkbox').parentElement!;
        t.replace(oldBox, page => page.field('Checkbox', 'labelAfter'));
        t.collect();
        t.runner.assertCollection(document, t.vhm);
    });

    test('assertCollection reports a record count mismatch when markup has an unexpected role element', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        collect(t);
        const extra = document.createElement('span');
        extra.setAttribute('data-jivs-role', 'label');
        extra.setAttribute('data-field', 'Text_Required');
        document.body.appendChild(extra);
        t.services.domServices.getElementRegistry(t.vhm).clear();
        t.collector.collect(document.body, t.services.domServices.getElementRegistry(t.vhm));
        // The runner's own check uses expect(), so confirm the failure through the shared failures list.
        expect(() => t.runner.assertCollection(document, t.vhm)).toThrow();
        expect(t.context.failures.map(f => f.propertyName)).toEqual(['RoleElementCount']);
    });
});
describe('describeRegistry and verbosity tests', () =>
{

    test('describeRegistry lists one line per record with role, field, host, presentation, adapter key and group', () =>
    {
        const t = createTestForm({
            build: page =>
            {
                const form = page.form('f');
                form.field('Text_Required', 'editorOnly', { presentationName: 'inputEditor', adapterKey: 'input:text' });
                form.submit(null, 'g1');
            },
            install: false
        });
        collect(t);
        const lines = t.runner.describeRegistry(t.vhm).split('\n');
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain('editor | field=Text_Required | host=yes | presentation=inputEditor | adapterKey=input:text');
        expect(lines[1]).toContain('submit | field=- | host=no | group=g1');
    });

    test('verbose prints the HTML from assign() and the registry from assertCollection through console.info', () =>
    {
        const original = console.info;
        const printed: string[] = [];
        console.info = (...args: unknown[]) => { printed.push(args.join(' ')); };
        try
        {
            const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: true });
            collect(t);
            t.runner.assertCollection(document, t.vhm);
        }
        finally { console.info = original; }
        expect(printed.length).toBe(2);
        expect(printed[0]).toContain('HTML assigned:');
        expect(printed[1]).toContain('ElementRegistry:');
        expect(printed[1]).toContain('editor | field=Text_Required');
    });

    test('nothing is printed unless verbose is set', () =>
    {
        const original = console.info;
        let count = 0;
        console.info = () => { count++; };
        try
        {
            const t = createTestForm({ fields: ['Text_Required'], install: false });
            collect(t);
            t.runner.assertCollection(document, t.vhm);
        }
        finally { console.info = original; }
        expect(count).toBe(0);
    });

    test('every starter Field Identity with the default template', () =>
    {
        const t = createTestForm({
            fields: createDefaultTestFieldRepository().identityNames(), install: false,
            verbose: verbose
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
    });

    test.each(['default', 'withRequired', 'labelAfter', 'withAriaError', 'inContainer', 'editorOnly'])(
        'field template %s', (template) =>
    {
        const t = createTestForm({
            fields: createDefaultTestFieldRepository().identityNames(),
            fieldTemplate: template,
            install: false,
            verbose: verbose
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
    });

});

/**
 * Registry contents in more depth: record counts per template, option defaults, partial collection,
 * repeated collection, case handling, and several managers on one page.
 */
describe('SimpleDomElementCollector registry details', () =>
{
    // The selector pattern is spelled out here because it documents how markup maps to records.
    function recordOf(t: TestForm, selector: string)
    {
        return t.recordFor(document.querySelector<IJivsElement>(selector)!)!;
    }
    const registryOf = (t: TestForm) => t.registry;

    // Each field template yields exactly these roles per field; nothing extra and nothing missing.
    const roleCountsByTemplate: Record<string, Record<string, number>> = {
        default: { label: 1, editor: 1, error: 1 },
        withRequired: { label: 1, editor: 1, required: 1, error: 1 },
        labelAfter: { label: 1, editor: 1, error: 1 },
        withAriaError: { label: 1, editor: 1, error: 1, 'aria-error': 1 },
        inContainer: { container: 1, label: 1, editor: 1, required: 1, error: 1 },
        editorOnly: { editor: 1 }
    };
    test.each(Object.keys(roleCountsByTemplate))('template %s registers the expected roles for each field', (template) =>
    {
        const names = ['Text_Required', 'Number_Range'];
        const t = createTestForm({ fields: names, fieldTemplate: template, install: false, verbose: verbose });
        collect(t);
        const expected = roleCountsByTemplate[template];
        const registry = registryOf(t);
        for (const name of names)
            for (const role of ['container', 'label', 'editor', 'required', 'error', 'aria-error'])
                expect(registry.getElementsByRole(role, name).length).toBe(expected[role] ?? 0);
        const total = Object.values(expected).reduce((a, b) => a + b, 0) * names.length;
        expect(Array.from(registry).length).toBe(total);
    });

    test('editor options default to a null presentation and no adapter key, and extra attributes reach the element', () =>
    {
        const t = createTestForm({
            build: page => page.field('Text_Required', 'editorOnly', { additionalAttributes: "class='wide' placeholder='Name'" }),
            install: false, verbose: verbose
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        const editor = document.querySelector<HTMLElement>("[data-jivs-role='editor']")!;
        expect(editor.getAttribute('class')).toBe('wide');
        expect(editor.getAttribute('placeholder')).toBe('Name');
        const options = (recordOf(t, "[data-jivs-role='editor']") as IEditorElementRegistryRecord).editorOptions!;
        expect(options.presentationName).toBeNull();
        expect('adapterKey' in options).toBe(false);
    });

    // Every editor type is found by its tag or type alone, so no adapter key is recorded.
    test.each(createDefaultTestFieldRepository().identityNames())('editor of %s registers without an adapter key', (name) =>
    {
        const t = createTestForm({ fields: [name], fieldTemplate: 'editorOnly', install: false, verbose: verbose });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        const record = recordOf(t, "[data-jivs-role='editor']") as IEditorElementRegistryRecord;
        expect(record.role).toBe(ElementRole.editor);
        expect(record.elementIdentifier).toBe(name);
        expect(record.fieldValueHost).not.toBeNull();
        expect(record.editorOptions?.adapterKey).toBeUndefined();
    });

    test('presentation names on label, error and container reach their records; absent names leave the options empty', () =>
    {
        const t = createTestForm({
            build: page =>
            {
                page.field('Text_Required', 'editorOnly');
                page.label('Text_Required', 'Name', 'Label');
                page.errorDisplay('Text_Required', 'InlineErrorBeside');
                page.requiredIndicator('Text_Required', '*');
                page.fieldContainer('Text_Required', 'FieldContainer');
            },
            install: false, verbose: verbose
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        const presentationOf = (role: string) =>
            (recordOf(t, `[data-jivs-role='${ role }']`) as IFieldElementRegistryRecord).presentationOptions;
        expect(presentationOf('label')).toEqual({ presentationName: 'Label' });
        expect(presentationOf('error')).toEqual({ presentationName: 'InlineErrorBeside' });
        expect(presentationOf('container')).toEqual({ presentationName: 'FieldContainer' });
        expect(presentationOf('required')).toEqual({});
    });

    test('roles of one field never register under another field identifier', () =>
    {
        const t = createTestForm({ fields: ['Text_Required', 'Number_Range'], install: false, verbose: verbose });
        collect(t);
        const registry = registryOf(t);
        for (const name of ['Text_Required', 'Number_Range'])
            for (const role of ['label', 'editor', 'error'])
            {
                const elements = registry.getElementsByRole(role, name);
                expect(elements.length).toBe(1);
                expect(elements[0].getAttribute('data-field')).toBe(name);
            }
    });

    test('collecting one container adds only its records, including the container root', () =>
    {
        const t = createTestForm({
            fields: ['Text_Required', 'Checkbox'], fieldTemplate: 'inContainer', install: false, verbose: verbose
        });
        t.page.assign();
        const registry = registryOf(t);
        const checkboxBox = document.querySelector<HTMLElement>("[data-jivs-role='container'][data-field='Checkbox']")!;
        t.collector.collect(checkboxBox, registry);
        const records = Array.from(registry);
        expect(records.map(r => r.role)).toEqual(['container', 'label', 'editor', 'required', 'error']);
        expect(new Set(records.map(r => r.elementIdentifier))).toEqual(new Set(['Checkbox']));

        const textBox = document.querySelector<HTMLElement>("[data-jivs-role='container'][data-field='Text_Required']")!;
        t.collector.collect(textBox, registry);
        expect(Array.from(registry).length).toBe(10);
        t.runner.assertCollection(document, t.vhm);
    });

    test('collecting the same markup twice throws until the registry is cleared', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        collect(t);
        const registry = registryOf(t);
        expect(() => t.collector.collect(document.body, registry)).toThrow(/Duplicate element instance/);
        registry.clear();
        t.collector.collect(document.body, registry);
        t.runner.assertCollection(document, t.vhm);
    });

    test('role values are matched without regard to case and recorded in canonical form', () =>
    {
        const t = createTestForm({
            build: page =>
            {
                page.field('Text_Required', 'editorOnly');
                page.raw("<label id='raw-label' DATA-JIVS-ROLE='LABEL' data-field='Text_Required'>x</label>");
                page.raw("<div id='raw-aria' data-jivs-role='Aria-Error' data-field='Text_Required'></div>");
                page.raw("<button id='raw-submit' data-jivs-role='SUBMIT'>Go</button>");
            },
            install: false, verbose: verbose
        });
        collect(t);
        const registry = registryOf(t);
        const byId = (id: string) => registry.getRecordForElement(document.getElementById(id) as IJivsElement)!;
        expect(byId('raw-label').role).toBe(ElementRole.label);
        expect(byId('raw-aria').role).toBe(ElementRole.ariaError);
        expect(byId('raw-submit').role).toBe(ElementRole.submit);
        expect(byId('raw-submit').kind).toBe('form');
    });

    test('markup with an unknown role or a missing data-field fails with the element described', () =>
    {
        const t = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        t.page.raw("<div id='bad-role' data-jivs-role='bogus'></div>");
        t.page.assign();
        expect(() => t.collector.collect(document.body, registryOf(t))).toThrow(/Unknown role 'bogus'.*bad-role/);

        const t2 = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        t2.page.raw("<div id='no-field' data-jivs-role='error'></div>");
        t2.page.assign();
        expect(() => t2.collector.collect(document.body, registryOf(t2))).toThrow(/Missing data-field.*no-field/);
    });

    test('an editor for a field the manager does not have is registered without a FieldValueHost or jivsElement', () =>
    {
        const t = createTestForm({
            build: page => { page.field('Text_Required'); page.inputEditor('NoSuchField'); },
            install: false, verbose: verbose
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        const record = recordOf(t, "[data-field='NoSuchField']") as IEditorElementRegistryRecord;
        expect(record.role).toBe(ElementRole.editor);
        expect(record.fieldValueHost).toBeNull();
        expect(record.jivsElement).toBeNull();
    });

    test('a field identifier matches the manager without regard to case and keeps its authored spelling', () =>
    {
        const t = createTestForm({
            build: page => { page.field('Text_Required', 'editorOnly'); page.label('text_required', 'Lower'); },
            install: false, verbose: verbose
        });
        collect(t);
        t.runner.assertCollection(document, t.vhm);
        const label = recordOf(t, "[data-jivs-role='label']");
        expect(label.elementIdentifier).toBe('text_required');
        expect(label.fieldValueHost).not.toBeNull();
        expect(label.fieldValueHost).toBe(recordOf(t, "[data-jivs-role='editor']").fieldValueHost);
        expect(registryOf(t).getElementsByRole('label', 'TEXT_REQUIRED').length).toBe(1);
    });

});

/**
 * Several forms on one page, each with its own ValueHostsManager scoped by containerIdentifier.
 * Each createTestForm call makes one form (its own services, context, runner); the test joins their HTML.
 */
describe('SimpleDomElementCollector with several forms on one page', () =>
{
    test('identical forms in two containers keep their records separate and pass their own assertions', () =>
    {
        const names = ['Text_Required', 'Checkbox'];
        const one = createTestForm({ fields: names, containerIdentifier: '#one', install: false, verbose: verbose });
        const two = createTestForm({ fields: names, containerIdentifier: '#two', install: false, verbose: verbose });
        const page = createTestPage(one, two);
        expect(document.querySelectorAll('#one [data-field="Text_Required"]').length).toBe(3);
        expect(document.querySelectorAll('#two [data-field="Text_Required"]').length).toBe(3);

        page.collect();
        const registryOne = one.registry;
        const registryTwo = two.registry;
        const containerOne = document.getElementById('one')!;
        const containerTwo = document.getElementById('two')!;
        expect(Array.from(registryOne).length).toBe(6);
        expect(Array.from(registryTwo).length).toBe(6);
        expect(Array.from(registryOne).every(r => containerOne.contains(r.element))).toBe(true);
        expect(Array.from(registryTwo).every(r => containerTwo.contains(r.element))).toBe(true);
        expect(registryOne.getElementsByRole('editor', 'Text_Required')[0]).not.toBe(
            registryTwo.getElementsByRole('editor', 'Text_Required')[0]);

        one.runner.assertCollection(document, one.vhm);
        two.runner.assertCollection(document, two.vhm);
    });

    test('generated ids are unique across the page even though the forms are identical', () =>
    {
        const one = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        const two = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#two', install: false, verbose: verbose });
        createTestPage(one, two);
        const ids = Array.from(document.querySelectorAll('[id]'), e => e.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain('one-label-text_required-1');
        expect(ids).toContain('two-label-text_required-1');
    });

    test('different forms have different managers, so a field is unresolved in the manager that lacks it', () =>
    {
        const one = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        const two = createTestForm({
            fields: ['Number_Range', 'Checkbox'], fieldTemplate: 'inContainer',
            containerIdentifier: '#two', install: false, verbose: verbose
        });
        createTestPage(one, two).collect();
        const registryOne = one.registry;
        const registryTwo = two.registry;
        expect(Array.from(registryOne).map(r => r.role)).toEqual(['label', 'editor', 'error']);
        expect(Array.from(registryTwo).length).toBe(10);
        expect(one.vhm.getFieldByElementIdentifier('Number_Range')).toBeNull();
        expect(two.vhm.getFieldByElementIdentifier('Text_Required')).toBeNull();
        one.runner.assertCollection(document, one.vhm);
        two.runner.assertCollection(document, two.vhm);
    });

    test('a form added later, as AJAX would, is collected without disturbing the first', () =>
    {
        const one = createTestForm({ fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose });
        createTestPage(one).collect();
        const registryOne = one.registry;
        const before = Array.from(registryOne);

        const two = createTestForm({ fields: ['Checkbox'], containerIdentifier: '#two', install: false, verbose: verbose });
        const holder = document.createElement('div');
        two.page.assign(holder);
        document.body.appendChild(holder);
        two.collect();

        expect(Array.from(registryOne)).toEqual(before);
        one.runner.assertCollection(document, one.vhm);
        two.runner.assertCollection(document, two.vhm);
    });

    test('containerIdentifier reaches the manager and configure can change other settings', () =>
    {
        const one = createTestForm({
            fields: ['Text_Required'], containerIdentifier: '#one', install: false, 
            verbose: verbose,
            configure: config => { config.behaviors = { ...config.behaviors, disableParsingOnValueChange: true }; }
        });
        expect(one.vhm.getContainerIdentifier()).toBe('#one');
        expect(one.config.containerIdentifier).toBe('#one');
        expect(one.config.behaviors?.disableParsingOnValueChange).toBe(true);
    });

    test('configure runs on a copy, so it does not leak into the next form built from the same rules', () =>
    {
        const first = createTestForm({
            fields: ['Text_Required'], install: false, verbose: verbose,
            configure: config => { config.behaviors = { disableParsingOnValueChange: true }; config.containerIdentifier = '#elsewhere'; }
        });
        const second = createTestForm({ fields: ['Text_Required'], install: false, verbose: verbose });
        expect(first.vhm.getContainerIdentifier()).toBe('#elsewhere');
        expect(second.vhm.getContainerIdentifier()).toBeUndefined();
        expect(second.config.behaviors?.disableParsingOnValueChange).not.toBe(true);
    });

    test('assertCollection reports when the manager container differs from the one the page was built for', () =>
    {
        const t = createTestForm({
            fields: ['Text_Required'], containerIdentifier: '#one', install: false, verbose: verbose,
            configure: config => { config.containerIdentifier = '#other'; }
        });
        createTestPage(t);
        expect(() => t.runner.assertCollection(document, t.vhm)).toThrow();
        expect(t.context.failures[0].message).toBe('No descriptors matched this manager');
    });

    test('a selector that is not an #id needs a formId with the fields source', () =>
    {
        expect(() => createTestForm({ fields: ['Text_Required'], containerIdentifier: 'form.one', install: false, verbose: verbose }))
            .toThrow(/formId is required/);
        const t = createTestForm({
            fields: ['Text_Required'], containerIdentifier: 'form.one', formId: 'f1',
            formAttributes: "class='one'", install: false, verbose: verbose
        });
        createTestPage(t).collect();
        expect(t.registry.getElementsByRole('editor', 'Text_Required').length).toBe(1);
        t.runner.assertCollection(document, t.vhm);
    });
});