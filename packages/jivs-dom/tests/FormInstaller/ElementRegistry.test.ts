/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import type {
    ElementIdentifierRegistryEntry,
    ElementRegistryRecord,
    IEditorElementRegistryRecord,
    IElementRegistry,
    IFieldAriaElementInfo,
    IFieldElementRegistryRecord,
    IFormElementRegistryRecord
} from '../../src/Interfaces/ElementRegistry';
import type { FieldPresentationInstallOptions } from '../../src/Interfaces/FieldPresentations';
import type { FormPresentationInstallOptions } from '../../src/Interfaces/FormPresentations';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { ElementRole } from '../../src/Interfaces/Types';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import { createStubFieldValueHost } from '../TestSupport/mocks';

/**
 * Creates a manager fake that resolves identifiers case-insensitively and records lookups.
 * @param fields - Field hosts keyed by their element identifier.
 */
function createManager(fields: Record<string, IFieldValueHost> = {}): {
    valueHostsManager: IValueHostsManager,
    lookups: string[]
}
{
    let lookups: string[] = [];
    let valueHostsManager = {
        getFieldByElementIdentifier: (elementIdentifier: string): IFieldValueHost | null => {
            lookups.push(elementIdentifier);
            return fields[elementIdentifier.toLowerCase()] ?? null;
        }
    } as unknown as IValueHostsManager;
    return { valueHostsManager: valueHostsManager, lookups: lookups };
}

/**
 * Creates a fresh extended DOM element for registry records.
 */
function createJivsElement(tagName: string = 'div'): IJivsElement
{
    return document.createElement(tagName) as IJivsElement;
}

/**
 * Creates a registry, defaulting to a manager with one resolved field.
 */
function setup(): {
    registry: ElementRegistry,
    valueHostsManager: IValueHostsManager,
    field: IFieldValueHost,
    lookups: string[]
}
{
    let field = createStubFieldValueHost('Email', 'email');
    let managerResult = createManager({ email: field });
    return {
        registry: new ElementRegistry(managerResult.valueHostsManager),
        valueHostsManager: managerResult.valueHostsManager,
        field: field,
        lookups: managerResult.lookups
    };
}

/**
 * Captures records from the public iteration API.
 */
function recordsOf(registry: IElementRegistry): ElementRegistryRecord[]
{
    return Array.from(registry);
}

// The registry requires a manager and retains the manager used to resolve field elements.
describe('ElementRegistry constructor', () => {
    test('Rejects a null manager', () => {
        expect(() => new ElementRegistry(null as unknown as IValueHostsManager))
            .toThrow('valueHostsManager required');
    });
    test('Rejects an undefined manager', () => {
        expect(() => new ElementRegistry(undefined as unknown as IValueHostsManager))
            .toThrow('valueHostsManager required');
    });
    test('Does not resolve any fields until field records are added', () => {
        let { registry, lookups } = setup();

        expect(registry).toBeInstanceOf(ElementRegistry);
        expect(lookups).toHaveLength(0);
    });
});

// Added records preserve insertion order and include the resolved field host and supplied installation options.
describe('ElementRegistry.addEditor, addField, and addForm', () => {
    test('Adds editor records with a delayed JivsElement and nullable default options', () => {
        let { registry, field, lookups } = setup();
        let editor = createJivsElement('input');

        registry.addEditor(editor, 'Email');
        let [record] = recordsOf(registry) as IEditorElementRegistryRecord[];

        expect(record).toMatchObject({
            kind: 'field',
            role: ElementRole.editor,
            elementIdentifier: 'Email',
            fieldValueHost: field,
            jivsElement: null,
            editorOptions: null,
            element: editor
        });
        expect(lookups).toEqual(['Email']);
    });
    test('Adds field records with nullable default options and preserves the supplied role', () => {
        let { registry, field } = setup();
        let label = createJivsElement('label');

        registry.addField(label, 'email', ElementRole.label);
        let [record] = recordsOf(registry);

        expect(record).toMatchObject({
            kind: 'field',
            role: ElementRole.label,
            elementIdentifier: 'email',
            fieldValueHost: field,
            presentationOptions: null,
            element: label
        });
    });
    test('Adds form records without a field host or field identifier', () => {
        let { registry } = setup();
        let formElement = createJivsElement('form');

        registry.addForm(formElement, ElementRole.summary);
        let [record] = recordsOf(registry);

        expect(record).toMatchObject({
            kind: 'form',
            role: ElementRole.summary,
            fieldValueHost: null,
            elementIdentifier: null,
            presentationOptions: null,
            element: formElement
        });
    });
    test('Preserves supplied editor, field, and form options by reference', () => {
        let { registry } = setup();
        let editorOptions: EditorInstallOptions = { adapterKey: 'text' };
        let fieldOptions: FieldPresentationInstallOptions = { presentationName: 'inline' };
        let formOptions: FormPresentationInstallOptions = { presentationName: 'summary', group: 'main' };

        registry.addEditor(createJivsElement('input'), 'email', editorOptions);
        registry.addField(createJivsElement(), 'email', ElementRole.error, fieldOptions);
        registry.addForm(createJivsElement('form'), ElementRole.summary, formOptions);
        let records = recordsOf(registry);

        expect((records[0] as IEditorElementRegistryRecord).editorOptions).toBe(editorOptions);
        expect((records[1] as IFieldElementRegistryRecord).presentationOptions).toBe(fieldOptions);
        expect((records[2] as IFormElementRegistryRecord).presentationOptions).toBe(formOptions);
    });
    test('Retains unmatched field records with a null FieldValueHost', () => {
        let managerResult = createManager();
        let registry = new ElementRegistry(managerResult.valueHostsManager);
        let element = createJivsElement('input');

        registry.addEditor(element, 'not-configured');

        expect(recordsOf(registry)[0].fieldValueHost).toBeNull();
        expect(managerResult.lookups).toEqual(['not-configured']);
        expect(registry.getResolvedElementIdentifiers()).toHaveLength(0);
    });
    test('Reuses one case-insensitive identifier entry while retaining record insertion order', () => {
        let { registry, field, lookups } = setup();
        let editor = createJivsElement('input');
        let error = createJivsElement('span');

        registry.addEditor(editor, 'Email');
        registry.addField(error, 'email', ElementRole.error);
        let records = recordsOf(registry);
        let entries = registry.getResolvedElementIdentifiers();

        expect(records.map(record => record.element)).toEqual([editor, error]);
        expect(records.map(record => record.fieldValueHost)).toEqual([field, field]);
        expect(lookups).toEqual(['Email']);
        expect(entries).toHaveLength(1);
        expect(entries[0].fieldValueHost).toBe(field);
        expect(entries[0].records).toEqual(records);
    });
});

// The installer can assign an editor's anchor after editor installation completes.
describe('ElementRegistry.setEditorJivsElement', () => {
    test('Stores the supplied JivsElement on the exact editor record', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        let jivsElement = createJivsElement('div');
        registry.addEditor(editor, 'email');
        let [record] = recordsOf(registry) as IEditorElementRegistryRecord[];

        registry.setEditorJivsElement(record, jivsElement);

        expect(record.jivsElement).toBe(jivsElement);
        expect(recordsOf(registry)[0]).toBe(record);
    });
});

// Adapter queries select installed adapter elements; field-presentation queries select all eligible field records except aria-error.
describe('ElementRegistry adapter and field-presentation queries', () => {
    test('Returns text adapter elements for a case-insensitive identifier in insertion order', () => {
        let { registry } = setup();
        let firstEditor = createJivsElement('input');
        let editorWithoutAdapter = createJivsElement('textarea');
        let editorNotUsingAdapter = createJivsElement('input');
        let secondEditor = createJivsElement('select');
        firstEditor.jivsTextValueAdapter = {} as NonNullable<IJivsElement['jivsTextValueAdapter']>;
        editorNotUsingAdapter.jivsTextValueAdapter = null;
        secondEditor.jivsTextValueAdapter = {} as NonNullable<IJivsElement['jivsTextValueAdapter']>;
        registry.addEditor(firstEditor, 'Email');
        registry.addEditor(editorWithoutAdapter, 'email');
        registry.addEditor(editorNotUsingAdapter, 'email');
        registry.addEditor(secondEditor, 'EMAIL');

        expect(registry.getTextValueAdapterElements('eMaIl')).toEqual([firstEditor, secondEditor]);
    });
    test('Returns native value adapter elements for a case-insensitive identifier in insertion order', () => {
        let { registry } = setup();
        let firstEditor = createJivsElement('input');
        let editorWithoutAdapter = createJivsElement('select');
        let editorNotUsingAdapter = createJivsElement('input');
        let secondEditor = createJivsElement('input');
        firstEditor.jivsValueAdapter = {} as NonNullable<IJivsElement['jivsValueAdapter']>;
        editorNotUsingAdapter.jivsValueAdapter = null;
        secondEditor.jivsValueAdapter = {} as NonNullable<IJivsElement['jivsValueAdapter']>;
        registry.addEditor(firstEditor, 'email');
        registry.addEditor(editorWithoutAdapter, 'EMAIL');
        registry.addEditor(editorNotUsingAdapter, 'email');
        registry.addEditor(secondEditor, 'Email');

        expect(registry.getValueAdapterElements('EMAIL')).toEqual([firstEditor, secondEditor]);
    });
    test('Returns empty results when the identifier is missing or no matching adapter is installed', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        registry.addEditor(editor, 'email');

        expect(registry.getTextValueAdapterElements('unknown')).toEqual([]);
        expect(registry.getValueAdapterElements('unknown')).toEqual([]);
        expect(registry.getTextValueAdapterElements('email')).toEqual([]);
        expect(registry.getValueAdapterElements('email')).toEqual([]);
    });
    test('Includes every field record, including aria-error, regardless of installed presentation', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        let label = createJivsElement('label');
        let visibleError = createJivsElement('span');
        let hiddenError = createJivsElement('span');
        registry.addEditor(editor, 'email');
        registry.addField(label, 'email', ElementRole.label);
        registry.addField(visibleError, 'email', ElementRole.error);
        registry.addField(hiddenError, 'email', ElementRole.ariaError);

        expect(registry.getFieldPresentationElements('EMAIL')).        toEqual([editor, label, visibleError, hiddenError]);
        expect(registry.getFieldPresentationElements('unknown')).toEqual([]);
    });
});

// Form queries include only form records; role queries support both global and case-insensitive field-scoped lookup.
describe('ElementRegistry form and role queries', () => {
    test('Returns form presentation elements in registry order and excludes field elements', () => {
        let { registry } = setup();
        let firstFormElement = createJivsElement('form');
        let fieldElement = createJivsElement('input');
        let secondFormElement = createJivsElement('div');
        registry.addForm(firstFormElement, ElementRole.summary);
        registry.addField(fieldElement, 'email', ElementRole.label);
        registry.addForm(secondFormElement, ElementRole.submit);

        expect(registry.getFormPresentationElements()).toEqual([firstFormElement, secondFormElement]);
    });
    test('Filters role queries by role and a case-insensitive element identifier', () => {
        let { registry } = setup();
        let emailLabel = createJivsElement('label');
        let emailError = createJivsElement('span');
        let otherLabel = createJivsElement('label');
        registry.addField(emailLabel, 'email', ElementRole.label);
        registry.addField(emailError, 'email', ElementRole.error);
        registry.addField(otherLabel, 'username', ElementRole.label);

        expect(registry.getElementsByRole(ElementRole.label, 'EMAIL')).toEqual([emailLabel]);
        expect(registry.getElementsByRole(ElementRole.error, 'email')).toEqual([emailError]);
        expect(registry.getElementsByRole(ElementRole.error, 'unknown')).toEqual([]);
    });
    test('Returns all matching roles globally when the identifier filter is null', () => {
        let { registry } = setup();
        let emailLabel = createJivsElement('label');
        let usernameLabel = createJivsElement('label');
        let emailError = createJivsElement('span');
        let formLabel = createJivsElement('form');
        registry.addField(emailLabel, 'email', ElementRole.label);
        registry.addField(emailError, 'email', ElementRole.error);
        registry.addField(usernameLabel, 'username', ElementRole.label);
        registry.addForm(formLabel, ElementRole.label);

        expect(registry.getElementsByRole(ElementRole.label, null)).toEqual([
            emailLabel, usernameLabel, formLabel
        ]);
    });
});

// ARIA anchor lookup returns null defaults when absent, prioritizes aria-error, and applies last-match semantics for duplicates.
describe('ElementRegistry.getFieldAriaElementInfo', () => {
    test('Returns null anchors and the requested identifier when no records are registered', () => {
        let { registry } = setup();

        let result = registry.getFieldAriaElementInfo('Missing');

        expect(result).toEqual({
            editorJivsElement: null,
            errorMessageElement: null,
            errorMessageRole: null,
            elementIdentifier: 'Missing'
        });
    });
    test('Returns the editor JivsElement and uses the visible error when no aria-error exists', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        let editorAnchor = createJivsElement('div');
        let error = createJivsElement('span');
        registry.addEditor(editor, 'email');
        let [editorRecord] = recordsOf(registry) as IEditorElementRegistryRecord[];
        registry.setEditorJivsElement(editorRecord, editorAnchor);
        registry.addField(error, 'email', ElementRole.error);

        let result = registry.getFieldAriaElementInfo('EMAIL');

        expect(result).toEqual({
            editorJivsElement: editorAnchor,
            errorMessageElement: error,
            errorMessageRole: ElementRole.error,
            elementIdentifier: 'EMAIL'
        });
    });
    test('Uses the first visible error record when multiple exist without an aria-error', () => {
        let { registry } = setup();
        let firstError = createJivsElement('span');
        let secondError = createJivsElement('span');
        registry.addField(firstError, 'email', ElementRole.error);
        registry.addField(secondError, 'email', ElementRole.error);

        let result = registry.getFieldAriaElementInfo('email');

        expect(result.errorMessageElement).toBe(firstError);
        expect(result.errorMessageRole).toBe(ElementRole.error);
    });
    test('Prefers aria-error over visible errors and uses the last matching editor and aria-error records', () => {
        let { registry } = setup();
        let firstEditor = createJivsElement('input');
        let lastEditor = createJivsElement('input');
        let firstEditorAnchor = createJivsElement('div');
        let lastEditorAnchor = createJivsElement('div');
        let firstError = createJivsElement('span');
        let secondError = createJivsElement('span');
        let firstAriaError = createJivsElement('span');
        let lastAriaError = createJivsElement('span');
        registry.addEditor(firstEditor, 'email');
        registry.addEditor(lastEditor, 'email');
        let editorRecords = recordsOf(registry) as IEditorElementRegistryRecord[];
        registry.setEditorJivsElement(editorRecords[0], firstEditorAnchor);
        registry.setEditorJivsElement(editorRecords[1], lastEditorAnchor);
        registry.addField(firstError, 'email', ElementRole.error);
        registry.addField(secondError, 'email', ElementRole.error);
        registry.addField(firstAriaError, 'email', ElementRole.ariaError);
        registry.addField(lastAriaError, 'email', ElementRole.ariaError);

        let result = registry.getFieldAriaElementInfo('email');

        expect(result).toEqual({
            editorJivsElement: lastEditorAnchor,
            errorMessageElement: lastAriaError,
            errorMessageRole: ElementRole.ariaError,
            elementIdentifier: 'email'
        });
    });
});

// Resolved identifier entries are unique, ordered by first registration, and exclude records with no matching host.
describe('ElementRegistry.getResolvedElementIdentifiers', () => {
    test('Returns one registry entry per resolved identifier in first-registration order', () => {
        let firstField = createStubFieldValueHost('First', 'first');
        let secondField = createStubFieldValueHost('Second', 'second');
        let managerResult = createManager({ first: firstField, second: secondField });
        let registry = new ElementRegistry(managerResult.valueHostsManager);
        registry.addField(createJivsElement(), 'First', ElementRole.label);
        registry.addField(createJivsElement(), 'Second', ElementRole.label);
        registry.addField(createJivsElement(), 'first', ElementRole.error);
        registry.addField(createJivsElement(), 'unmatched', ElementRole.label);

        let entries: ElementIdentifierRegistryEntry[] = registry.getResolvedElementIdentifiers();

        expect(entries).toHaveLength(2);
        expect(entries.map(entry => entry.fieldValueHost)).toEqual([firstField, secondField]);
        expect(entries[0].records).toHaveLength(2);
        expect(entries[1].records).toHaveLength(1);
        expect(managerResult.lookups).toEqual(['First', 'Second', 'unmatched']);
    });
});

// Clearing releases DOM and field-host references, empties all query indexes, and leaves the registry reusable.
describe('ElementRegistry.clear', () => {
    test('Nulls record-held DOM and field references and clears iteration and query results', () => {
        let { registry, field } = setup();
        let editor = createJivsElement('input');
        let editorAnchor = createJivsElement('div');
        let label = createJivsElement('label');
        let form = createJivsElement('form');
        registry.addEditor(editor, 'email');
        let [editorRecord] = recordsOf(registry) as IEditorElementRegistryRecord[];
        registry.setEditorJivsElement(editorRecord, editorAnchor);
        registry.addField(label, 'email', ElementRole.label);
        registry.addForm(form, ElementRole.summary);
        let retainedRecords = recordsOf(registry);
        expect(retainedRecords.map(record => record.fieldValueHost)).toEqual([field, field, null]);

        registry.clear();

        expect(retainedRecords.map(record => record.element)).toEqual([null, null, null]);
        expect(retainedRecords.map(record => record.fieldValueHost)).toEqual([null, null, null]);
        expect(editorRecord.jivsElement).toBeNull();
        expect(recordsOf(registry)).toEqual([]);
        expect(registry.getResolvedElementIdentifiers()).toEqual([]);
        expect(registry.getFormPresentationElements()).toEqual([]);
        expect(registry.getElementsByRole(ElementRole.label, null)).toEqual([]);
        expect(registry.getFieldAriaElementInfo('email')).toMatchObject({
            editorJivsElement: null,
            errorMessageElement: null,
            errorMessageRole: null
        } satisfies Partial<IFieldAriaElementInfo>);
    });
    test('Can accept and resolve new records after clear', () => {
        let { registry } = setup();
        registry.addField(createJivsElement('label'), 'email', ElementRole.label);
        registry.clear();
        let newElement = createJivsElement('label');

        registry.addField(newElement, 'email', ElementRole.label);

        expect(registry.getElementsByRole(ElementRole.label, 'email')).toEqual([newElement]);
        expect(recordsOf(registry)).toHaveLength(1);
    });
});

// Each DOM element instance may be registered once; a second attempt would install it twice, so it must fail fast.
describe('ElementRegistry duplicate element detection', () => {
    test('Rejects the same element added again by the same method and names its id', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        editor.id = 'email-editor';
        let label = createJivsElement('label');
        label.id = 'email-label';
        let form = createJivsElement('form');
        form.id = 'summary';
        registry.addEditor(editor, 'email');
        registry.addField(label, 'email', ElementRole.label);
        registry.addForm(form, ElementRole.summary);

        expect(() => registry.addEditor(editor, 'email'))
            .toThrow("Duplicate element instance detected. ID: 'email-editor'");
        expect(() => registry.addField(label, 'email', ElementRole.label))
            .toThrow("Duplicate element instance detected. ID: 'email-label'");
        expect(() => registry.addForm(form, ElementRole.summary))
            .toThrow("Duplicate element instance detected. ID: 'summary'");
    });
    test('Rejects an element already registered under a different kind, role, or identifier', () => {
        let { registry } = setup();
        let element = createJivsElement('div');
        registry.addField(element, 'email', ElementRole.label);

        expect(() => registry.addEditor(element, 'email')).toThrow('Duplicate element instance detected');
        expect(() => registry.addField(element, 'other', ElementRole.error)).toThrow('Duplicate element instance detected');
        expect(() => registry.addForm(element, ElementRole.summary)).toThrow('Duplicate element instance detected');
    });
    test('Reports a placeholder when the duplicate element has no id', () => {
        let { registry } = setup();
        let element = createJivsElement('div');
        registry.addForm(element, ElementRole.summary);

        expect(() => registry.addForm(element, ElementRole.summary))
            .toThrow("Duplicate element instance detected. ID: '<no id>'");
    });
    test('Leaves the registry unchanged when a duplicate is rejected', () => {
        let { registry, lookups } = setup();
        let element = createJivsElement('div');
        registry.addField(element, 'email', ElementRole.label);
        let lookupCount = lookups.length;

        expect(() => registry.addField(element, 'email', ElementRole.label)).toThrow();
        expect(() => registry.addEditor(element, 'email')).toThrow();
        expect(() => registry.addForm(element, ElementRole.summary)).toThrow();

        expect(recordsOf(registry)).toHaveLength(1);
        expect(registry.getResolvedElementIdentifiers()[0].records).toHaveLength(1);
        expect(lookups).toHaveLength(lookupCount);
    });
    test('Allows different element instances that share an id', () => {
        let { registry } = setup();
        let first = createJivsElement('div');
        first.id = 'same';
        let second = createJivsElement('div');
        second.id = 'same';

        registry.addField(first, 'email', ElementRole.label);
        registry.addField(second, 'email', ElementRole.error);

        expect(recordsOf(registry)).toHaveLength(2);
    });
});

// getRecordForElement finds the exact record for any registered element without enumerating the registry.
describe('ElementRegistry.getRecordForElement', () => {
    test('Returns the exact editor, field, and form record for each registered element', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        let label = createJivsElement('label');
        let form = createJivsElement('form');
        registry.addEditor(editor, 'email');
        registry.addField(label, 'email', ElementRole.label);
        registry.addForm(form, ElementRole.summary);
        let [editorRecord, labelRecord, formRecord] = recordsOf(registry);

        expect(registry.getRecordForElement(editor)).toBe(editorRecord);
        expect(registry.getRecordForElement(label)).toBe(labelRecord);
        expect(registry.getRecordForElement(form)).toBe(formRecord);
    });
    test('Returns null for an element that was never registered', () => {
        let { registry } = setup();
        registry.addField(createJivsElement('label'), 'email', ElementRole.label);

        expect(registry.getRecordForElement(createJivsElement('label'))).toBeNull();
    });
    test('Reflects delayed editor JivsElement assignment on the same record', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        let anchor = createJivsElement('div');
        registry.addEditor(editor, 'email');
        let record = registry.getRecordForElement(editor) as IEditorElementRegistryRecord;

        registry.setEditorJivsElement(record, anchor);

        expect((registry.getRecordForElement(editor) as IEditorElementRegistryRecord).jivsElement).toBe(anchor);
    });
    test('Returns null and accepts the same element again after clear', () => {
        let { registry } = setup();
        let element = createJivsElement('label');
        registry.addField(element, 'email', ElementRole.label);

        registry.clear();

        expect(registry.getRecordForElement(element)).toBeNull();
        expect(() => registry.addField(element, 'email', ElementRole.label)).not.toThrow();
        expect(registry.getRecordForElement(element)).toBe(recordsOf(registry)[0]);
    });
});

// Disposing releases registered DOM and host references and makes further registry use invalid.
describe('ElementRegistry.dispose', () => {
    test('Clears retained record references and rejects later queries', () => {
        let { registry } = setup();
        let editor = createJivsElement('input');
        let editorAnchor = createJivsElement('div');
        registry.addEditor(editor, 'email');
        let [editorRecord] = recordsOf(registry) as IEditorElementRegistryRecord[];
        registry.setEditorJivsElement(editorRecord, editorAnchor);
        let retainedRecords = recordsOf(registry);

        registry.dispose();

        expect(retainedRecords[0].element).toBeNull();
        expect(retainedRecords[0].fieldValueHost).toBeNull();
        expect(editorRecord.jivsElement).toBeNull();
        expect(() => registry.getFormPresentationElements()).toThrow();
    });
});
