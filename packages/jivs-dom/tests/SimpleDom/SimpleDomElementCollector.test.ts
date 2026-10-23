/** @jest-environment jsdom */
import { SimpleDomElementCollector } from '../../src/SimpleDom/SimpleDomElementCollector';
import { ElementRole } from '../../src/Interfaces/Types';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import type {
    IEditorElementRegistryRecord,
    IFieldElementRegistryRecord,
    IFormElementRegistryRecord
} from '../../src/Interfaces/ElementRegistry';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { createStubFieldValueHost } from '../TestSupport/mocks';

/**
 * Verifies that SimpleDom markup is interpreted and registered according to its documented roles,
 * options, root handling, and validation errors by inspecting the real ElementRegistry records.
 */
describe('SimpleDomElementCollector', () =>
{
    function createRegistry(fields: Record<string, IFieldValueHost> = {}): ElementRegistry
    {
        const manager = {
            getFieldByElementIdentifier: (identifier: string): IFieldValueHost | null =>
                fields[identifier.toLowerCase()] ?? null
        } as IValueHostsManager;
        return new ElementRegistry(manager);
    }

    afterEach(() => { document.body.innerHTML = ''; });

    test('registers field and form roles in document order with their supported options', () =>
    {
        const registry = createRegistry();
        document.body.innerHTML = `
            <input id="editor" data-jivs-role="editor" data-field="email"
                data-jivs-adapterkey="email-input" data-jivs-presentation="outlined">
            <div id="error" data-jivs-role="error" data-field="email"
                data-jivs-presentation="inline"></div>
            <div id="aria-error" data-jivs-role="aria-error" data-field="email"></div>
            <label id="label" data-jivs-role="label" data-field="email"></label>
            <span id="required" data-jivs-role="required" data-field="email"></span>
            <div id="container" data-jivs-role="container" data-field="email"></div>
            <div id="summary" data-jivs-role="summary" data-jivs-presentation="summary"
                data-jivs-group="checkout"></div>
            <button id="submit" data-jivs-role="submit" data-jivs-group="*"></button>`;

        new SimpleDomElementCollector().collect(document.body, registry);

        const records = [...registry];
        expect(records).toHaveLength(8);
        expect(records.map(record => record.element.id)).toEqual([
            'editor', 'error', 'aria-error', 'label', 'required', 'container', 'summary', 'submit'
        ]);
        expect(records.map(record => record.role)).toEqual([
            ElementRole.editor, ElementRole.error, ElementRole.ariaError, ElementRole.label,
            ElementRole.required, ElementRole.container, ElementRole.summary, ElementRole.submit
        ]);
        expect(records.map(record => record.kind)).toEqual([
            'field', 'field', 'field', 'field', 'field', 'field', 'form', 'form'
        ]);
        expect((records[0] as IEditorElementRegistryRecord).elementIdentifier).toBe('email');
        expect((records[0] as IEditorElementRegistryRecord).editorOptions)
            .toEqual({ adapterKey: 'email-input', presentationName: 'outlined' });
        expect((records[0] as IEditorElementRegistryRecord).jivsElement).toBeNull();
        expect((records[1] as IFieldElementRegistryRecord).elementIdentifier).toBe('email');
        expect((records[1] as IFieldElementRegistryRecord).presentationOptions)
            .toEqual({ presentationName: 'inline' });
        for (const record of records.slice(2, 6) as IFieldElementRegistryRecord[])
        {
            expect(record.elementIdentifier).toBe('email');
            expect(record.presentationOptions).toEqual({});
        }
        expect((records[6] as IFormElementRegistryRecord).presentationOptions)
            .toEqual({ presentationName: 'summary', group: 'checkout' });
        expect((records[7] as IFormElementRegistryRecord).presentationOptions).toEqual({ group: '*' });
        for (const record of records)
            expect(registry.getRecordForElement(record.element)).toBe(record);
    });

    test('uses a null default presentation for editors and empty options for form roles', () =>
    {
        const registry = createRegistry();
        document.body.innerHTML = `
            <input id="editor" data-jivs-role="editor" data-field="name">
            <div id="summary" data-jivs-role="summary"></div>
            <button id="submit" data-jivs-role="submit"></button>`;
        new SimpleDomElementCollector().collect(document.body, registry);

        const records = [...registry];
        expect((records[0] as IEditorElementRegistryRecord).editorOptions).toEqual({ presentationName: null });
        expect((records[1] as IFormElementRegistryRecord).presentationOptions).toEqual({});
        expect((records[2] as IFormElementRegistryRecord).presentationOptions).toEqual({});
    });

    test('includes the root element when it has a role and only collects descendants otherwise', () =>
    {
        const registry = createRegistry();
        const root = document.createElement('section');
        root.setAttribute('data-jivs-role', 'summary');
        root.innerHTML = '<input id="editor" data-jivs-role="editor" data-field="name">';
        document.body.append(root);

        new SimpleDomElementCollector().collect(root, registry);
        expect([...registry].map(record => record.element.getAttribute('data-jivs-role'))).toEqual(['summary', 'editor']);
        registry.clear();
        const plainRoot = document.createElement('section');
        plainRoot.innerHTML = '<button id="submit" data-jivs-role="submit"></button>';
        new SimpleDomElementCollector().collect(plainRoot, registry);
        expect([...registry].map(record => record.element.id)).toEqual(['submit']);
    });

    test('accepts role values without regard to letter case', () =>
    {
        const registry = createRegistry();
        document.body.innerHTML = '<input id="editor" data-jivs-role="EDITOR" data-field="name">';

        new SimpleDomElementCollector().collect(document.body, registry);

        const records = [...registry];
        expect(records).toHaveLength(1);
        expect(records[0].role).toBe(ElementRole.editor);
        expect(records[0].kind).toBe('field');
        expect((records[0] as IEditorElementRegistryRecord).editorOptions).toEqual({ presentationName: null });
    });

    test('stores canonical roles when mixed-case markup selects field and form registration', () =>
    {
        const registry = createRegistry();
        document.body.innerHTML = `
            <span id="aria-error" data-jivs-role="ARIA-ERROR" data-field="email"></span>
            <div id="summary" data-jivs-role="SUMMARY"></div>`;

        new SimpleDomElementCollector().collect(document.body, registry);

        const records = [...registry];
        expect(records).toHaveLength(2);
        expect(records.map(record => record.role)).toEqual([ElementRole.ariaError, ElementRole.summary]);
        expect(records.map(record => record.kind)).toEqual(['field', 'form']);
        expect((records[0] as IFieldElementRegistryRecord).elementIdentifier).toBe('email');
        expect((records[1] as IFormElementRegistryRecord).elementIdentifier).toBeNull();
    });

    test('throws for unknown roles and elements missing a field identifier', () =>
    {
        const registry = createRegistry();
        document.body.innerHTML = '<div id="unknown" data-jivs-role="not-a-role"></div>';
        expect(() => new SimpleDomElementCollector().collect(document.body, registry))
            .toThrow(/Unknown role 'not-a-role'.*id="unknown"/);
        expect([...registry]).toHaveLength(0);

        document.body.innerHTML = '<div id="missing-field" data-jivs-role="error"></div>';
        expect(() => new SimpleDomElementCollector().collect(document.body, registry))
            .toThrow(/Missing data-field.*id="missing-field"/);
        expect([...registry]).toHaveLength(0);
    });

    test('treats an empty data-field value as missing', () =>
    {
        const registry = createRegistry();
        document.body.innerHTML = '<label data-jivs-role="label" data-field=""></label>';

        expect(() => new SimpleDomElementCollector().collect(document.body, registry))
            .toThrow(/Missing data-field/);
        expect([...registry]).toHaveLength(0);
    });

    function setupRealRegistry(fields: Record<string, IFieldValueHost> = {})
    {
        const manager = {
            getFieldByElementIdentifier: (identifier: string): IFieldValueHost | null => fields[identifier.toLowerCase()] ?? null
        } as IValueHostsManager;
        const registry = new ElementRegistry(manager);
        const collector = new SimpleDomElementCollector();
        return { manager, registry, collector };
    }    
   test('populates real records in document order and preserves options', () =>
    {
        const field = createStubFieldValueHost('Email', 'email');
        const { registry, collector } = setupRealRegistry({ email: field });
        document.body.innerHTML = `
            <input id='editor' data-jivs-role='editor' data-field='email' data-jivs-adapterkey='custom-input' data-jivs-presentation='editor-look'>
            <label id='label' data-jivs-role='label' data-field='email' data-jivs-presentation='label-look'>Email</label>
            <div id='summary' data-jivs-role='summary' data-jivs-presentation='summary-look' data-jivs-group='checkout'></div>
            <button id='submit' data-jivs-role='submit' data-jivs-group='*'>Submit</button>`;
        collector.collect(document.body, registry);

        const records = [...registry];
        expect(records).toHaveLength(4);
        expect(records.map(record => record.element.id)).toEqual(['editor', 'label', 'summary', 'submit']);
        expect(records.map(record => record.role)).toEqual([
            ElementRole.editor, ElementRole.label, ElementRole.summary, ElementRole.submit
        ]);
        expect(records.map(record => record.kind)).toEqual(['field', 'field', 'form', 'form']);
        expect(records[0].fieldValueHost).toBe(field);
        expect(records[1].fieldValueHost).toBe(field);
        expect(records[2].fieldValueHost).toBeNull();
        expect(records[3].fieldValueHost).toBeNull();
        expect((records[0] as IEditorElementRegistryRecord).editorOptions).toEqual({ adapterKey: 'custom-input', presentationName: 'editor-look' });
        expect((records[0] as IEditorElementRegistryRecord).jivsElement).toBeNull();
        expect((records[1] as IFieldElementRegistryRecord).presentationOptions).toEqual({ presentationName: 'label-look' });
        expect((records[2] as IFormElementRegistryRecord).presentationOptions).toEqual({ presentationName: 'summary-look', group: 'checkout' });
        expect((records[3] as IFormElementRegistryRecord).presentationOptions).toEqual({ group: '*' });
        for (const record of records)
            expect(registry.getRecordForElement(record.element)).toBe(record);
    });

    test('resolves matching field identifiers case-insensitively and retains unmatched fields', () =>
    {
        const field = createStubFieldValueHost('Email', 'email');
        const { registry, collector } = setupRealRegistry({ email: field });
        document.body.innerHTML = `
            <input id='editor' data-jivs-role='editor' data-field='EMAIL'>
            <label id='label' data-jivs-role='label' data-field='email'>Email</label>
            <div id='missing' data-jivs-role='error' data-field='unknown'></div>`;
        collector.collect(document.body, registry);

        const records = [...registry];
        expect(records).toHaveLength(3);
        expect(records[0].elementIdentifier).toBe('EMAIL');
        expect(records[1].elementIdentifier).toBe('email');
        expect(records[0].fieldValueHost).toBe(field);
        expect(records[1].fieldValueHost).toBe(field);
        expect(records[2].fieldValueHost).toBeNull();
        expect(registry.getElementsByRole(ElementRole.label, 'EMAIL')).toEqual([document.getElementById('label')]);
        expect(registry.getResolvedElementIdentifiers()).toHaveLength(1);
    });

    test('collects only the selected container, including its root role element', () =>
    {
        const { registry, collector } = setupRealRegistry();
        document.body.innerHTML = `
            <section id='first' data-jivs-role='summary'><input id='inside' data-jivs-role='editor' data-field='one'></section>
            <section id='second'><input id='outside' data-jivs-role='editor' data-field='two'></section>`;
        collector.collect(document.getElementById('first')!, registry);

        expect([...registry].map(record => record.element.id)).toEqual(['first', 'inside']);
        expect(registry.getRecordForElement(document.getElementById('first')!)).not.toBeNull();
        expect(registry.getRecordForElement(document.getElementById('outside')!)).toBeNull();
    });

    test('registers one radio group anchor, not each native radio button', () =>
    {
        const { registry, collector } = setupRealRegistry();
        document.body.innerHTML = `
            <input id='radio-a' type='radio' name='choices' value='a' data-jivs-role='editor' data-field='choice'>
            <input id='radio-b' type='radio' name='choices' value='b'>
            <input id='radio-c' type='radio' name='choices' value='c'>`;
        collector.collect(document.body, registry);
        expect([...registry]).toHaveLength(1);
        expect([...registry][0].element.id).toBe('radio-a');
        expect(registry.getRecordForElement(document.getElementById('radio-b')!)).toBeNull();
    });

    test('real registry rejects recollecting the same DOM elements without clearing', () =>
    {
        const { registry, collector } = setupRealRegistry();
        document.body.innerHTML = `<input id='editor' data-jivs-role='editor' data-field='name'>`;
        collector.collect(document.body, registry);
        expect(() => collector.collect(document.body, registry)).toThrow(/Duplicate element instance/);
        registry.clear();
        expect(() => collector.collect(document.body, registry)).not.toThrow();
        expect([...registry]).toHaveLength(1);
    });

    test('real registry rejects missing data-field before registering the invalid element', () =>
    {
        const { registry, collector } = setupRealRegistry();
        document.body.innerHTML = `<div id='bad' data-jivs-role='error'></div>`;
        expect(() => collector.collect(document.body, registry)).toThrow(/Missing data-field/);
        expect([...registry]).toHaveLength(0);
    });    
});
