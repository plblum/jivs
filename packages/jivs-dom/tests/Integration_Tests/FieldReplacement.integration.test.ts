/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationSeverity, ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { TestForm } from './TestingSupport/CreateTestForm';
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

/**
 * Creates two text fields and a form-level summary to verify preliminary validation reaches form feedback.
 */
function createFieldReplacementForm(ariaService: boolean = false)
{
    const repository = createDefaultTestFieldRepository();
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

    const t = installForm({
        repository,
        formTemplate: 'fieldReplacementSummary',
        servicesConfigOptions: { ariaService: ariaService },
        verbose
    });
    t.vhm.notifyValidationStateChangedDelay = 0;
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
});
