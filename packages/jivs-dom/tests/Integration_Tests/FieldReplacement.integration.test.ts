/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationSeverity, ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { EditorReader } from '../../src/Editors/EditorReader';
import { EditorWriter } from '../../src/Editors/EditorWriter';
import { onlyReplacedEditors } from '../../src/Editors/ReaderAssistance';
import { TestForm, createTestForm } from './TestingSupport/CreateTestForm';
import { expectElementsMatchValidationState, expectIssueCodes, installForm } from './TestingSupport/FieldFeedbackExpectations';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { useCleanDocument } from './TestingSupport/TestFileSupport';

/**
 * Purpose: FieldReplacement is the family of scenarios where a site replaces what the fields hold after the user
 * has already worked with the form: injecting values into a live form (this describe), a full page round trip,
 * and replacing elements. Each scenario must leave the field presentations and the validation summary
 * matching the ValueHostsManager's state.
 */
let verbose = false;
useCleanDocument();

const injectedField = 'InjectedText';
const existingField = 'ExistingText';
const addedField = 'AddedText';

/**
 * Creates the repository with the three fixtures and the form templates.
 */
function createFieldReplacementRepository()
{
    const repository = createDefaultTestFieldRepository();
    repository.registerIdentity({
        name: addedField,
        description: 'Required uppercase text that the page adds later',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .requireText('ADDED-REQUIRED')
                .regExp(/^[A-Z]*$/, { errorMessage: 'ADDED-UPPER', severity: ValidationSeverity.Error });
        },
        addEditor: (page, name, options) =>
        {
            page.inputEditor(name, 'text', options.presentationName, options.adapterKey, options.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: injectedField,
        description: 'Required uppercase text',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .requireText('INJECTED-REQUIRED')
                .regExp(/^[A-Z]*$/, { errorMessage: 'INJECTED-UPPER', severity: ValidationSeverity.Error })
                .stringLength(5, 'INJECTED-LEN');
        },
        addEditor: (page, name, options) =>
        {
            page.inputEditor(name, 'text', options.presentationName, options.adapterKey, options.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: existingField,
        description: 'Optional uppercase text',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .regExp(/^[A-Z]*$/, { errorMessage: 'EXISTING-UPPER', severity: ValidationSeverity.Error });
        },
        addEditor: (page, name, options) =>
        {
            page.inputEditor(name, 'text', options.presentationName, options.adapterKey, options.additionalAttributes);
        }
    });
    repository.registerFormTemplate('fieldReplacementSummary', (page) =>
    {
        const form = page.form('field-replacement-form');
        // The container gives scenario 3 an element whose children the test can replace.
        form.field(injectedField, 'inContainer');
        form.field(existingField, 'withRequired');
        form.validationSummary();
    });
    // The same form with a third field in a container. Tests empty that container before the first install,
    // so the field has a FieldValueHost but no elements, as when a page plans a field it adds later.
    repository.registerFormTemplate('fieldReplacementSummaryWithPlannedField', (page) =>
    {
        const form = page.form('field-replacement-form');
        form.field(injectedField, 'inContainer');
        form.field(existingField, 'withRequired');
        form.field(addedField, 'inContainer');
        form.validationSummary();
    });
    return repository;
}

/**
 * Creates two text fields and a form-level summary to verify preliminary validation reaches form feedback.
 */
function createFieldReplacementForm(ariaService: boolean = false)
{
    const t = installForm({
        repository: createFieldReplacementRepository(),
        formTemplate: 'fieldReplacementSummary',
        servicesConfigOptions: { ariaService: ariaService },
        verbose
    });
    t.vhm.notifyValidationStateChangedDelay = 0;
    return t;
}

/**
 * Like createFieldReplacementForm, with a third field whose FieldValueHost exists but whose elements are
 * removed before the first install. The user then edits the first two fields.
 */
function createFormWithPlannedField()
{
    const t = createTestForm({
        repository: createFieldReplacementRepository(),
        formTemplate: 'fieldReplacementSummaryWithPlannedField',
        fieldTemplate: 'withRequired',
        servicesConfigOptions: { ariaService: false },
        install: false,
        verbose
    });
    t.page.assign();
    t.replace(t.element('container', addedField), () => { /* nothing */ });
    FormInstaller.install(t.vhm, t.collector);
    t.vhm.notifyValidationStateChangedDelay = 0;
    userEdits(t, injectedField, 'lower');
    userEdits(t, existingField, 'lower');
    return t;
}

/** The user types a value into the field's editor and leaves it, so the field validates. */
function userEdits(t: TestForm, field: string, value: string): void
{
    const editor = t.element('editor', field) as unknown as HTMLInputElement;
    editor.value = value;
    editor.dispatchEvent(new Event('change', { bubbles: true }));
}

/** The user has typed an invalid value into both fields, so both error displays and the summary show issues. */
function installWithUserEditedInvalidFields(ariaService: boolean = false)
{
    const t = createFieldReplacementForm(ariaService);
    userEdits(t, injectedField, 'lower');
    userEdits(t, existingField, 'lower');
    expectElementsMatchValidationState(t, injectedField, ValidationStatus.Invalid);
    expectElementsMatchValidationState(t, existingField, ValidationStatus.Invalid);
    const summary = t.element('summary');
    expect(summary.classList.contains('jivs-has-issues')).toBe(true);
    expect(summary.textContent).toContain('INJECTED-UPPER');
    expect(summary.textContent).toContain('EXISTING-UPPER');
    return t;
}

// Scenario 1, injecting values into a live form. The user has edited the form and its presentations show issues.
// The site then acts like a reset button:
// it replaces a value in one field with setValue(..., { reset: true }), which returns that field to NotAttempted,
// and calls validate({ preliminary: true }). The field presentations and the summary must follow the new state.
describe('FieldReplacement: injecting values into a user-edited form, then validate({ preliminary: true })', () =>
{
    test('The reset field and the untouched field are both validated again, and the summary reflects the result', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');

        // The reset button restores a valid value in one field. The other field keeps the user's invalid text.
        t.vhm.getFieldValueHost(injectedField)!.setValue('ABC', { reset: true });
        t.vhm.validate({ preliminary: true });

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expectIssueCodes(t, injectedField, []);
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Invalid);
        expectIssueCodes(t, existingField, [ConditionType.RegExp]);
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A required field reset to empty is not validated, so its issues clear, while the untouched field stays invalid', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');

        // An empty editor is text '' (not an unset field), which is what RequireText inspects.
        t.vhm.getFieldValueHost(injectedField)!.setTextValue('', { reset: true });
        t.vhm.validate({ preliminary: true });

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expectIssueCodes(t, injectedField, []);
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Invalid);
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).not.toContain('INJECTED-REQUIRED');
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Resetting both fields to valid values clears every issue from the fields and the summary', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');

        t.vhm.getFieldValueHost(injectedField)!.setValue('ABC', { reset: true });
        t.vhm.getFieldValueHost(existingField)!.setValue('XYZ', { reset: true });
        t.vhm.validate({ preliminary: true });

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Valid);
        expect(summary.classList.contains('jivs-has-issues')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A reset field that is invalid for a different reason swaps its message in the field and the summary', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');

        // The old text failed the uppercase rule. The replacement is uppercase but too long.
        t.vhm.getFieldValueHost(injectedField)!.setValue('TOOLONGVALUE', { reset: true });
        t.vhm.validate({ preliminary: true });

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Invalid);
        expectIssueCodes(t, injectedField, [ConditionType.StringLength]);
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('INJECTED-LEN');
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A valid user-edited form gains an issue when a reset injects a bad value, and the valid field stays valid', () =>
    {
        const t = createFieldReplacementForm();
        const summary = t.element('summary');
        userEdits(t, injectedField, 'ABC');
        userEdits(t, existingField, 'XYZ');
        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Valid);
        expect(summary.classList.contains('jivs-has-issues')).toBe(false);

        t.vhm.getFieldValueHost(existingField)!.setValue('lower', { reset: true });
        t.vhm.validate({ preliminary: true });

        expectElementsMatchValidationState(t, existingField, ValidationStatus.Invalid);
        expectIssueCodes(t, existingField, [ConditionType.RegExp]);
        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(summary.textContent).not.toContain('INJECTED-');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('After a reset and preliminary pass, a user edit validates normally, including the required check', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');
        t.vhm.getFieldValueHost(injectedField)!.setTextValue('', { reset: true });
        t.vhm.validate({ preliminary: true });
        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expect(summary.textContent).not.toContain('INJECTED-REQUIRED');

        // The user touches the empty field. The change event runs a normal validation, which includes RequireText.
        // The text is already '', so retyping '' is no change (and browsers would not fire change). The user types, then clears.
        userEdits(t, injectedField, 'ABC');
        userEdits(t, injectedField, '');

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Invalid);
        expectIssueCodes(t, injectedField, [ConditionType.RequireText]);
        expect(summary.textContent).toContain('INJECTED-REQUIRED');
        expect(summary.textContent).toContain('EXISTING-UPPER');

        userEdits(t, injectedField, 'ABC');

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expect(summary.textContent).not.toContain('INJECTED-');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // With the AriaService on, aria-invalid and aria-errormessage on each editor must follow the reset too.
    test('aria-invalid and aria-errormessage follow each field through a reset and preliminary validation', () =>
    {
        const t = installWithUserEditedInvalidFields(true);
        const injectedEditor = t.element('editor', injectedField);
        const existingEditor = t.element('editor', existingField);
        expect(injectedEditor.getAttribute('aria-invalid')).toBe('true');
        expect(existingEditor.getAttribute('aria-invalid')).toBe('true');

        t.vhm.getFieldValueHost(injectedField)!.setValue('ABC', { reset: true });
        t.vhm.validate({ preliminary: true });

        expect(injectedEditor.hasAttribute('aria-invalid')).toBe(false);
        expect(injectedEditor.hasAttribute('aria-errormessage')).toBe(false);
        expect(existingEditor.getAttribute('aria-invalid')).toBe('true');
        expect(existingEditor.getAttribute('aria-errormessage')).toBe(t.element('error', existingField).id);

        t.vhm.getFieldValueHost(injectedField)!.setValue('lower', { reset: true });
        t.vhm.validate({ preliminary: true });

        expect(injectedEditor.getAttribute('aria-invalid')).toBe('true');
        expect(injectedEditor.getAttribute('aria-errormessage')).toBe(t.element('error', injectedField).id);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * Scenario 3 replaces the elements of one field's container, as a script does when it rebuilds part of the page.
 * The site runs FormInstaller.install again (the static one, which leaves the attached dispatchers alone).
 * It recollects the registry and installs the new elements. Installed elements are skipped.
 */
function replaceInjectedFieldElements(t: TestForm): void
{
    t.replace(t.element('container', injectedField), page => page.field(injectedField, 'withRequired'));
    FormInstaller.install(t.vhm, t.collector);
}

// Elements outside the replacement keep their values, state, attributes, handlers and IJivsElement extensions.
describe('FieldReplacement: replacing the elements of one field, then installing again', () =>
{
    test('The untouched field keeps its elements, installed behavior and state, and still responds to the user', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');
        const editor = t.element('editor', existingField);
        const errorElement = t.element('error', existingField);
        const adapterDefinition = editor.jivsEditorAdapterDefinition;
        const textValueAdapter = editor.jivsTextValueAdapter;
        const fieldPresentation = errorElement.jivsFieldPresentation;
        expect(adapterDefinition).toBeDefined();
        expect(fieldPresentation).toBeDefined();

        replaceInjectedFieldElements(t);

        expect(t.element('editor', existingField)).toBe(editor);
        expect(t.element('error', existingField)).toBe(errorElement);
        expect(editor.jivsEditorAdapterDefinition).toBe(adapterDefinition);
        expect(editor.jivsTextValueAdapter).toBe(textValueAdapter);
        expect(errorElement.jivsFieldPresentation).toBe(fieldPresentation);
        expect((editor as unknown as HTMLInputElement).value).toBe('lower');
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Invalid);
        expect(summary.textContent).toContain('EXISTING-UPPER');

        // The handler attached before the replacement still sends the edit to the ValueHost.
        userEdits(t, existingField, 'XYZ');

        expectElementsMatchValidationState(t, existingField, ValidationStatus.Valid);
        expect(summary.textContent).not.toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('The replaced field installs fresh, shows its state after the values step, and responds to the user', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');
        const oldEditor = t.element('editor', injectedField);

        replaceInjectedFieldElements(t);

        const newEditor = t.element('editor', injectedField);
        const newError = t.element('error', injectedField);
        expect(newEditor).not.toBe(oldEditor);
        expect(newEditor.jivsEditorAdapterDefinition).toBeDefined();
        expect(newEditor.jivsTextValueAdapter).toBeDefined();
        expect(newError.jivsFieldPresentation).toBeDefined();

        // The values step: the site supplies the value for the new editor, then validates preliminary.
        t.vhm.getFieldValueHost(injectedField)!.setValue('lowerX', { reset: true });
        t.vhm.validate({ preliminary: true });

        expect((newEditor as unknown as HTMLInputElement).value).toBe('lowerX');
        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Invalid);
        expect(newError.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');

        // The handler on the new editor sends the user's edit.
        userEdits(t, injectedField, 'ABC');

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('EditorReader with onlyReplacedEditors reads only the replaced editor, then validates preliminary', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');
        const existingEditor = t.element('editor', existingField) as unknown as HTMLInputElement;

        replaceInjectedFieldElements(t);

        // Values step: the new editor arrives holding the correct value.
        // The untouched editor is changed in the DOM only (no event), so reading it would visibly change its ValueHost.
        (t.element('editor', injectedField) as unknown as HTMLInputElement).value = 'ABC';
        existingEditor.value = 'XYZ';
        new EditorReader(t.vhm, { filter: onlyReplacedEditors }).read();

        expect(t.vhm.getFieldValueHost(injectedField)!.getTextValue()).toBe('ABC');
        expect(t.vhm.getFieldValueHost(existingField)!.getTextValue()).toBe('lower');
        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Invalid);
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // The ValueHosts hold the user's values and the replaced editor arrives blank. EditorWriter moves ValueHost -> editor,
    // using the editor's adapter directly, so it works even though the ValueHost value does not change.
    test('EditorWriter with onlyReplacedEditors fills only the replaced editor from its ValueHost, then validate preliminary restores the feedback', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');
        const existingEditor = t.element('editor', existingField) as unknown as HTMLInputElement;

        replaceInjectedFieldElements(t);

        const newEditor = t.element('editor', injectedField) as unknown as HTMLInputElement;
        expect(newEditor.value).toBe('');
        // Changed in the DOM only (no event), so a write to this editor would be visible.
        existingEditor.value = 'typed but not yet sent';

        new EditorWriter(t.vhm, { filter: onlyReplacedEditors }).write();
        t.vhm.validate({ preliminary: true });

        expect(newEditor.value).toBe('lower');
        expect(existingEditor.value).toBe('typed but not yet sent');
        expect(t.vhm.getFieldValueHost(injectedField)!.getTextValue()).toBe('lower');
        expect(t.vhm.getFieldValueHost(existingField)!.getTextValue()).toBe('lower');
        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Invalid);
        expect(t.element('error', injectedField).classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');

        // The handler on the new editor sends the user's edit.
        userEdits(t, injectedField, 'ABC');

        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Valid);
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Without the filter, EditorWriter also rewrites the untouched editor from its ValueHost', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const existingEditor = t.element('editor', existingField) as unknown as HTMLInputElement;

        replaceInjectedFieldElements(t);
        existingEditor.value = 'typed but not yet sent';
        new EditorWriter(t.vhm).write();

        expect((t.element('editor', injectedField) as unknown as HTMLInputElement).value).toBe('lower');
        expect(existingEditor.value).toBe('lower');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('EditorWriter reaches a planned field added later, and the field is enabled and shows its value', () =>
    {
        const t = createFormWithPlannedField();
        const addedHost = t.vhm.getFieldValueHost(addedField)!;

        t.replace(t.element('container', addedField), page => page.field(addedField, 'withRequired'));
        FormInstaller.install(t.vhm, t.collector);
        // skipValueChangedCallback keeps the TextValueDispatcher from writing the editor, so only EditorWriter can.
        addedHost.setValue('lower', { reset: true, skipValueChangedCallback: true });
        expect((t.element('editor', addedField) as unknown as HTMLInputElement).value).toBe('');
        new EditorWriter(t.vhm, { filter: onlyReplacedEditors }).write();
        t.vhm.validate({ preliminary: true });

        expect((t.element('editor', addedField) as unknown as HTMLInputElement).value).toBe('lower');
        expect(addedHost.isEnabled()).toBe(true);
        expect(t.element('summary').textContent).toContain('ADDED-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Without the filter, EditorReader also reads the untouched editor', () =>
    {
        const t = installWithUserEditedInvalidFields();

        replaceInjectedFieldElements(t);
        (t.element('editor', injectedField) as unknown as HTMLInputElement).value = 'ABC';
        (t.element('editor', existingField) as unknown as HTMLInputElement).value = 'XYZ';
        new EditorReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost(existingField)!.getTextValue()).toBe('XYZ');
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Valid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A field whose editor was removed is disabled, drops out of validation and the summary, and returns when its editor does', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');
        const injectedHost = t.vhm.getFieldValueHost(injectedField)!;
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(injectedHost.isEnabled()).toBe(true);

        // The page rebuilds the container without any elements for the field.
        const container = t.element('container', injectedField);
        t.replace(container, () => { /* nothing */ });
        FormInstaller.install(t.vhm, t.collector);
        t.vhm.validate({ preliminary: true });

        expect(injectedHost.isEnabled()).toBe(false);
        expect(t.vhm.getFieldValueHost(existingField)!.isEnabled()).toBe(true);
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');

        // The editor comes back: install enables the field, and the Reader's values step can set it.
        t.replace(container, page => page.field(injectedField, 'withRequired'));
        FormInstaller.install(t.vhm, t.collector);
        (t.element('editor', injectedField) as unknown as HTMLInputElement).value = 'lower';
        new EditorReader(t.vhm, { filter: onlyReplacedEditors }).read();

        expect(injectedHost.isEnabled()).toBe(true);
        expect(injectedHost.getTextValue()).toBe('lower');
        expectElementsMatchValidationState(t, injectedField, ValidationStatus.Invalid);
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Reinstalling with nothing changed keeps every element, counter and state, and the Reader skips every field', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const domServices = t.services.domServices;
        const summary = t.element('summary');
        const names = [injectedField, existingField];
        const editors = names.map(name => t.element('editor', name));
        const errors = names.map(name => t.element('error', name));
        const summaryPresentation = summary.jivsFormPresentation;
        const firstCounter = domServices.getInstallCounter(t.vhm);
        expect(summaryPresentation).toBeDefined();

        FormInstaller.install(t.vhm, t.collector);
        // The values step would normally follow. The DOM values below differ from the ValueHosts,
        // so a Reader that did not skip these fields would visibly change them.
        names.forEach(name => (t.element('editor', name) as unknown as HTMLInputElement).value = 'ABC');
        new EditorReader(t.vhm, { filter: onlyReplacedEditors }).read();

        expect(domServices.getInstallCounter(t.vhm)).toBe(firstCounter + 1);
        names.forEach((name, index) =>
        {
            expect(t.element('editor', name)).toBe(editors[index]);
            expect(t.element('error', name)).toBe(errors[index]);
            expect(editors[index].jivsInstallCounter).toBe(firstCounter);
            expect(t.vhm.getFieldValueHost(name)!.isEnabled()).toBe(true);
            expect(t.vhm.getFieldValueHost(name)!.getTextValue()).toBe('lower');
            expectElementsMatchValidationState(t, name, ValidationStatus.Invalid);
        });
        expect(t.element('summary')).toBe(summary);
        expect(summary.jivsFormPresentation).toBe(summaryPresentation);
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Reinstalling with nothing changed does not double the dispatchers, so one ValueHost change writes the editor once', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const editor = t.element('editor', existingField);
        const originalAdapter = editor.jivsTextValueAdapter!;
        const writes: Array<string | undefined> = [];
        // Counting wrapper: the TextValueDispatcher writes through this adapter each time it runs.
        editor.jivsTextValueAdapter = {
            readTextValue: () => originalAdapter.readTextValue(),
            writeTextValue: (value?: string) => { writes.push(value); originalAdapter.writeTextValue(value); }
        };

        FormInstaller.install(t.vhm, t.collector);
        t.vhm.getFieldValueHost(existingField)!.setValue('ABC');

        expect(writes).toEqual(['ABC']);
        expect((editor as unknown as HTMLInputElement).value).toBe('ABC');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A field a Reader disabled earlier stays disabled when the form is reinstalled with its editor untouched', () =>
    {
        const t = installWithUserEditedInvalidFields();
        t.vhm.getFieldValueHost(existingField)!.setEnabled(false);

        FormInstaller.install(t.vhm, t.collector);

        expect(t.vhm.getFieldValueHost(existingField)!.isEnabled()).toBe(false);
        expect(t.vhm.getFieldValueHost(injectedField)!.isEnabled()).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A field left with only its label is treated as having no editor, so it is disabled and out of the summary', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const summary = t.element('summary');
        const injectedHost = t.vhm.getFieldValueHost(injectedField)!;

        t.replace(t.element('container', injectedField), page => page.label(injectedField, injectedField));
        FormInstaller.install(t.vhm, t.collector);
        t.vhm.validate({ preliminary: true });

        expect(injectedHost.isEnabled()).toBe(false);
        expect(summary.textContent).not.toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expectElementsMatchValidationState(t, existingField, ValidationStatus.Invalid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('With ARIA on, removing one field keeps the untouched field\'s aria-invalid and aria-errormessage, and it still updates', () =>
    {
        const t = installWithUserEditedInvalidFields(true);
        const editor = t.element('editor', existingField);
        const errorId = editor.getAttribute('aria-errormessage');
        expect(editor.getAttribute('aria-invalid')).toBe('true');
        expect(errorId).toBeTruthy();

        t.replace(t.element('container', injectedField), () => { /* nothing */ });
        FormInstaller.install(t.vhm, t.collector);
        t.vhm.validate({ preliminary: true });

        expect(editor.getAttribute('aria-invalid')).toBe('true');
        expect(editor.getAttribute('aria-errormessage')).toBe(errorId);

        userEdits(t, existingField, 'XYZ');

        expect(editor.hasAttribute('aria-invalid')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A planned field with no elements is disabled by the first install and stays out of validation and the summary', () =>
    {
        const t = createFormWithPlannedField();
        const summary = t.element('summary');
        const addedHost = t.vhm.getFieldValueHost(addedField)!;

        expect(addedHost).not.toBeNull();
        expect(addedHost.isEnabled()).toBe(false);
        expect(t.vhm.getFieldValueHost(injectedField)!.isEnabled()).toBe(true);
        expect(t.vhm.getFieldValueHost(existingField)!.isEnabled()).toBe(true);
        t.vhm.validate({ preliminary: true });
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');
        expect(summary.textContent).not.toContain('ADDED');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Adding the planned field\'s elements and installing again enables it, installs it fresh and leaves the other fields alone', () =>
    {
        const t = createFormWithPlannedField();
        const summary = t.element('summary');
        const domServices = t.services.domServices;
        const addedHost = t.vhm.getFieldValueHost(addedField)!;
        const otherEditors = [injectedField, existingField].map(name => t.element('editor', name));
        const firstCounter = domServices.getInstallCounter(t.vhm);

        t.replace(t.element('container', addedField), page => page.field(addedField, 'withRequired'));
        FormInstaller.install(t.vhm, t.collector);

        const addedEditor = t.element('editor', addedField);
        expect(addedHost.isEnabled()).toBe(true);
        expect(addedEditor.jivsEditorAdapterDefinition).toBeDefined();
        expect(addedEditor.jivsInstallCounter).toBe(firstCounter + 1);
        [injectedField, existingField].forEach((name, index) =>
        {
            expect(t.element('editor', name)).toBe(otherEditors[index]);
            expect(otherEditors[index].jivsInstallCounter).toBe(firstCounter);
            expectElementsMatchValidationState(t, name, ValidationStatus.Invalid);
        });

        // Values step: the new editor arrives with a value, the Reader sends only that editor, then validate preliminary.
        (addedEditor as unknown as HTMLInputElement).value = 'lower';
        new EditorReader(t.vhm, { filter: onlyReplacedEditors }).read();

        expect(addedHost.getTextValue()).toBe('lower');
        expectElementsMatchValidationState(t, addedField, ValidationStatus.Invalid);
        expect(t.element('error', addedField).classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('ADDED-UPPER');
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(summary.textContent).toContain('EXISTING-UPPER');

        // The handler on the new editor sends the user's edit.
        userEdits(t, addedField, 'ABC');

        expectElementsMatchValidationState(t, addedField, ValidationStatus.Valid);
        expect(summary.textContent).not.toContain('ADDED-UPPER');
        expect(summary.textContent).toContain('INJECTED-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('A required planned field added with an empty editor gets no required issue from the preliminary pass', () =>
    {
        const t = createFormWithPlannedField();
        const summary = t.element('summary');

        t.replace(t.element('container', addedField), page => page.field(addedField, 'withRequired'));
        FormInstaller.install(t.vhm, t.collector);
        new EditorReader(t.vhm, { filter: onlyReplacedEditors }).read();

        expect(t.vhm.getFieldValueHost(addedField)!.isEnabled()).toBe(true);
        expect(summary.textContent).not.toContain('ADDED-REQUIRED');
        expect(t.element('error', addedField).classList.contains('jivs-has-issues')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Only the replaced editor gets the newest install counter, which lets a Reader tell them apart', () =>
    {
        const t = installWithUserEditedInvalidFields();
        const domServices = t.services.domServices;
        const oldInjectedEditor = t.element('editor', injectedField);
        const existingEditor = t.element('editor', existingField);
        const firstCounter = domServices.getInstallCounter(t.vhm);
        expect(oldInjectedEditor.jivsInstallCounter).toBe(firstCounter);
        expect(existingEditor.jivsInstallCounter).toBe(firstCounter);

        replaceInjectedFieldElements(t);

        const secondCounter = domServices.getInstallCounter(t.vhm);
        expect(secondCounter).toBe(firstCounter + 1);
        expect(t.element('editor', injectedField).jivsInstallCounter).toBe(secondCounter);
        expect(t.element('editor', existingField).jivsInstallCounter).toBe(firstCounter);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});
