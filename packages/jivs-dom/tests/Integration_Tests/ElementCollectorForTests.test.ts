import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import { IEditorElementRegistryRecord, IFieldElementRegistryRecord, IFormElementRegistryRecord } from '../../src/Interfaces/ElementRegistry';
import { ElementRole } from '../../src/Interfaces/Types';
import { createStubFieldValueHost } from '../TestSupport/mocks';
import { ElementCollectorForTests } from './ElementCollectorForTests';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';

/** Exercises the actual registry normalization and identifier resolution path. */
describe('ElementCollectorForTests with real ElementRegistry', () =>
{
    afterEach(() => { document.body.innerHTML = ''; });

    function setupRealRegistry(fields: Record<string, IFieldValueHost> = {})
    {
        const manager = {
            getFieldByElementIdentifier: (identifier: string): IFieldValueHost | null => fields[identifier.toLowerCase()] ?? null
        } as IValueHostsManager;
        const registry = new ElementRegistry(manager);
        const collector = new ElementCollectorForTests();
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
