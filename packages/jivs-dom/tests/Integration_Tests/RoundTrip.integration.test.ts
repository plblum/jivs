/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationSeverity, ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { ServerPageValuesReader } from '../../src/Editors/ServerPageValuesReader';
import { TestForm, createTestForm } from './TestingSupport/CreateTestForm';
import { expectElementsMatchValidationState, expectIssueCodes, installForm } from './TestingSupport/FieldFeedbackExpectations';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { useCleanDocument } from './TestingSupport/TestFileSupport';

/**
 * Purpose: a Server Page round trip. The user edits a form, the app saves vhm.captureState() in a hidden input
 * and submits. The server regenerates the whole page, putting its own values into the editors and returning
 * the captured state string unchanged. The browser builds a NEW ValueHostsManager from that string,
 * installs the form, and runs ServerPageValuesReader. The new page must show the same feedback the user had
 * (or the feedback that matches whatever the server changed).
 * Restoring captured state fires no callbacks. The presentation installers draw the restored state at install,
 * so the DOM feedback is already in place before a reader runs. Application callbacks are different: only a
 * broadcast or a validation reaches them.
 */
let verbose = false;
useCleanDocument();

const field1 = 'RoundTrip1';
const field2 = 'RoundTrip2';
const numberField = 'RoundTripNumber';

/** Two optional uppercase-only text fields and a summary. Separate messages show which field an issue came from. */
function createRoundTripRepository()
{
    const repository = createDefaultTestFieldRepository();
    for (const [name, message] of [[field1, 'ONE-UPPER'], [field2, 'TWO-UPPER']])
        repository.registerIdentity({
            name: name,
            description: 'Optional uppercase text',
            addConfig: (builder, fieldName) =>
            {
                builder.field(fieldName, LookupKey.String)
                    .regExp(/^[A-Z]*$/, { errorMessage: message, severity: ValidationSeverity.Error });
            },
            addEditor: (page, fieldName, options) =>
            {
                page.inputEditor(fieldName, 'text', options.presentationName, options.adapterKey, options.additionalAttributes);
            }
        });
    repository.registerFormTemplate('roundTripSummary', (page) =>
    {
        const form = page.form('round-trip-form');
        form.field(field1, 'withRequired');
        form.field(field2, 'inContainer');
        form.validationSummary();
    });
    // A text input, because an input of type number discards text that is not a number (in browsers and jsdom),
    // so it could never hold unparseable text.
    repository.registerIdentity({
        name: numberField,
        description: 'Number typed into a text input',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.Number, { parserLookupKey: LookupKey.Number }).dataTypeCheck('NOT-A-NUMBER');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerFormTemplate('roundTripNumber', (page) =>
    {
        const form = page.form('round-trip-form');
        form.field(numberField, 'withRequired');
        form.validationSummary();
    });
    return repository;
}

/** The user types a value into the field's editor and leaves it, so the field validates. */
function userEdits(t: TestForm, field: string, value: string): void
{
    const editor = t.element('editor', field) as unknown as HTMLInputElement;
    editor.value = value;
    editor.dispatchEvent(new Event('change', { bubbles: true }));
}

/** The page the user worked with before submitting. Field1 holds invalid text and Field2 holds valid text.
 * Expected setup: Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
 */
function createFirstPage(ariaService: boolean = false): TestForm
{
    const t = installForm({
        repository: createRoundTripRepository(),
        formTemplate: 'roundTripSummary',
        servicesConfigOptions: { ariaService: ariaService },
        verbose
    });
    t.vhm.notifyValidationStateChangedDelay = 0;   // otherwise the summary lags by 100 ms
    userEdits(t, field1, 'lower');
    userEdits(t, field2, 'GOOD');
    expectElementsMatchValidationState(t, field1, ValidationStatus.Invalid);
    expectElementsMatchValidationState(t, field2, ValidationStatus.Valid);
    return t;
}

/**
 * Emulates the server answering the submit with a regenerated page, up to the point where the browser
 * has installed the form but has not yet run a Reader.
 * @param capturedState The string the first page saved from vhm.captureState().
 * @param serverTexts The value the server put into each editor's HTML.
 * @param removedFields Fields whose elements the server no longer generates. Their FieldValueHosts still
 * exist because the page plans them (they sit in a container that the server left empty).
 */
function receiveRegeneratedPage(capturedState: string | undefined, serverTexts: Record<string, string>,
    removedFields: string[] = [], ariaService: boolean = false, formTemplate: string = 'roundTripSummary',
    beforeInstall?: (t: TestForm) => void): TestForm
{
    document.body.innerHTML = '';   // the browser discards the old page
    const t = createTestForm({
        repository: createRoundTripRepository(),
        formTemplate: formTemplate,
        fieldTemplate: 'withRequired',
        servicesConfigOptions: { ariaService: ariaService },
        install: false,
        configure: (config) => { if (capturedState) config.capturedState = capturedState; },
        verbose
    });
    t.vhm.notifyValidationStateChangedDelay = 0;   // otherwise the summary lags by 100 ms
    t.page.assign();
    for (const field of removedFields)
        t.replace(t.element('container', field), () => { /* the server left the container empty */ });
    // The server wrote these values into the HTML, so they are on the editors before any script runs.
    for (const [field, text] of Object.entries(serverTexts))
        (t.element('editor', field) as unknown as HTMLInputElement).value = text;
    // The application's callbacks are set before install, so the dispatchers chain after them.
    beforeInstall?.(t);
    // The static install also attaches the dispatchers that carry validation state to the presentations.
    FormInstaller.install(t.vhm, t.collector);
    return t;
}

// The server kept both values. Field1 was Invalid and Field2 was Valid before the submit.
describe('RoundTrip: the server returns the same values', () =>
{
    test('The captured Invalid field shows its issues in its error display and the summary once the reader runs', () =>
    {
        const first = createFirstPage(); // Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'GOOD' });
        new ServerPageValuesReader(t.vhm).read();

        expectElementsMatchValidationState(t, field1, ValidationStatus.Invalid);
        expectIssueCodes(t, field1, [ConditionType.RegExp]);
        expectElementsMatchValidationState(t, field2, ValidationStatus.Valid);
        expectIssueCodes(t, field2, []);
        const summary = t.element('summary');
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('ONE-UPPER');
        expect(summary.textContent).not.toContain('TWO-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('With ARIA on, the captured Invalid field gets aria-invalid and aria-errormessage and the Valid field gets neither', () =>
    {
        const first = createFirstPage(true); // Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'GOOD' }, [], true);
        new ServerPageValuesReader(t.vhm).read();

        const editor1 = t.element('editor', field1);
        expect(editor1.getAttribute('aria-invalid')).toBe('true');
        expect(editor1.getAttribute('aria-errormessage')).toBe(t.element('error', field1).id);
        const editor2 = t.element('editor', field2);
        expect(editor2.hasAttribute('aria-invalid')).toBe(false);
        expect(editor2.hasAttribute('aria-errormessage')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// The server stops generating an editor. FormInstaller disables its field, and the field's captured issues
// must not appear on the page.
describe('RoundTrip: the server removes an editor', () =>
{
    test('The removed field is disabled and its captured issues stay out of the summary, while the other field keeps its issues', () =>
    {
        const first = createFirstPage(); // Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
        userEdits(first, field2, 'lower');   // both fields are Invalid when captured
        expectElementsMatchValidationState(first, field2, ValidationStatus.Invalid);
        expect(first.element('summary').textContent).toContain('TWO-UPPER');
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower' }, [field2]);
        new ServerPageValuesReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost(field2)!.isEnabled()).toBe(false);
        expectElementsMatchValidationState(t, field1, ValidationStatus.Invalid);
        const summary = t.element('summary');
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('ONE-UPPER');
        expect(summary.textContent).not.toContain('TWO-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
    test('With ARIA on, the removed field is disabled and the remaining Invalid field keeps its aria-invalid', () =>
    {
        const first = createFirstPage(true); // Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
        userEdits(first, field2, 'lower');
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower' }, [field2], true);
        new ServerPageValuesReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost(field2)!.isEnabled()).toBe(false);
        expect(t.element('editor', field1).getAttribute('aria-invalid')).toBe('true');
        expect(t.element('editor', field1).hasAttribute('aria-errormessage')).toBe(true);
        expect(t.element('summary').textContent).not.toContain('TWO-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// The server revised values. A changed field is reset, so its captured state is replaced by the
// result of the preliminary validation of the new value. An unchanged field keeps its captured state.
describe('RoundTrip: the server revises values', () =>
{
    test('A revised Invalid field becomes valid, a revised Valid field becomes invalid, and the summary follows', () =>
    {
        const first = createFirstPage(); // Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'FIXED', [field2]: 'bad' });
        new ServerPageValuesReader(t.vhm).read();

        expectElementsMatchValidationState(t, field1, ValidationStatus.Valid);
        expectIssueCodes(t, field1, []);
        expectElementsMatchValidationState(t, field2, ValidationStatus.Invalid);
        expectIssueCodes(t, field2, [ConditionType.RegExp]);
        const summary = t.element('summary');
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).not.toContain('ONE-UPPER');
        expect(summary.textContent).toContain('TWO-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Revising only one field leaves the other with its captured issues', () =>
    {
        const first = createFirstPage(); // Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'ALSOGOOD' });
        new ServerPageValuesReader(t.vhm).read();

        expectElementsMatchValidationState(t, field1, ValidationStatus.Invalid);
        expectElementsMatchValidationState(t, field2, ValidationStatus.Valid);
        expect(t.element('summary').textContent).toContain('ONE-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// The page planned Field2 (its FieldValueHost exists) but the first response had no elements for it.
// The server now generates its editor.
describe('RoundTrip: the server adds an editor', () =>
{
    test('The added field is enabled, validated from the server value, and joins the summary', () =>
    {
        const first = receiveRegeneratedPage(undefined, { [field1]: 'lower' }, [field2]);
        userEdits(first, field1, 'lower');
        expect(first.vhm.getFieldValueHost(field2)!.isEnabled()).toBe(false);
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'bad' });
        new ServerPageValuesReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost(field2)!.isEnabled()).toBe(true);
        expectElementsMatchValidationState(t, field1, ValidationStatus.Invalid);
        expectElementsMatchValidationState(t, field2, ValidationStatus.Invalid);
        const summary = t.element('summary');
        expect(summary.textContent).toContain('ONE-UPPER');
        expect(summary.textContent).toContain('TWO-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// The editors are the source of the values. Text that cannot be parsed must come back exactly as the user typed it.
describe('RoundTrip: invalid text survives', () =>
{
    test('Text that does not parse stays in the editor, and the field keeps its DataTypeCheck issue', () =>
    {
        const first = receiveRegeneratedPage(undefined, {}, [], false, 'roundTripNumber');
        userEdits(first, numberField, 'abc');
        expectElementsMatchValidationState(first, numberField, ValidationStatus.Invalid);
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [numberField]: 'abc' }, [], false, 'roundTripNumber');
        new ServerPageValuesReader(t.vhm).read();

        expect((t.element('editor', numberField) as unknown as HTMLInputElement).value).toBe('abc');
        expectElementsMatchValidationState(t, numberField, ValidationStatus.Invalid);
        expectIssueCodes(t, numberField, [ConditionType.DataTypeCheck]);
        expect(t.element('summary').classList.contains('jivs-has-issues')).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// The server replaced one malformed text with another. The changed text is parsed again, and the parser's
// InjectedError must survive the reset that the reader applies to every field it updates.
describe('RoundTrip: the server revises invalid text', () =>
{
    test('Different malformed text is parsed again and the field keeps the parser InjectedError and its issue', () =>
    {
        const first = receiveRegeneratedPage(undefined, {}, [], false, 'roundTripNumber');
        userEdits(first, numberField, 'abc');
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [numberField]: 'xyz' }, [], false, 'roundTripNumber');
        new ServerPageValuesReader(t.vhm).read();

        const field = t.vhm.getFieldValueHost(numberField)!;
        expect(field.getTextValue()).toBe('xyz');
        expect(field.getValue()).toBeUndefined();
        expect(field.getInjectedError()).toEqual(expect.objectContaining({ errorMessage: expect.any(String) }));
        expect((t.element('editor', numberField) as unknown as HTMLInputElement).value).toBe('xyz');
        expectElementsMatchValidationState(t, numberField, ValidationStatus.Invalid);
        expect(t.element('error', numberField).textContent).not.toBe('');
        expect(t.element('summary').classList.contains('jivs-has-issues')).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

/**
 * Stands in for the application's own callbacks on the ValueHostsManager (for example, one that enables a submit button).
 * Attach it before the form is installed, because the dispatchers that feed the DOM chain after existing callbacks.
 */
class CallbackRecorder
{
    fieldStatuses: Record<string, ValidationStatus> = {};
    formIsValid: boolean | undefined;
    textValueChanges: string[] = [];

    attach(vhm: TestForm['vhm']): void
    {
        vhm.onValueHostValidationStateChanged = (vh, state) => { this.fieldStatuses[vh.getName()] = state.status; };
        vhm.onValidationStateChanged = (_vhm, state) => { this.formIsValid = state.isValid; };
        vhm.onTextValueChanged = (vh) => { this.textValueChanges.push(vh.getName()); };
    }
}

// The DOM is drawn at install, but the application's own callbacks are not told about the restored state
// until the reader broadcasts it.
describe('RoundTrip: application callbacks', () =>
{
    test('The application callbacks hear the restored state of every enabled field and the form', () =>
    {
        const first = createFirstPage();    // Field1 contains 'lower' (invalid) and Field2 contains 'GOOD' (valid).
        const capturedState = first.vhm.captureState();
        const fieldStates: Record<string, ValidationStatus> = {};
        let formIsValid: boolean | undefined;
        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'GOOD' }, [], false, 'roundTripSummary',
            (page) =>
            {
                page.vhm.onValueHostValidationStateChanged = (vh, state) => { fieldStates[vh.getName()] = state.status; };
                page.vhm.onValidationStateChanged = (_vhm, state) => { formIsValid = state.isValid; };
            });
        expect(fieldStates).toEqual({});   // restoring and installing told the callbacks nothing

        new ServerPageValuesReader(t.vhm).read();

        expect(fieldStates[field1]).toBe(ValidationStatus.Invalid);
        expect(fieldStates[field2]).toBe(ValidationStatus.Valid);
        expect(formIsValid).toBe(false);
        expectElementsMatchValidationState(t, field1, ValidationStatus.Invalid);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('On a mixed page, the revised field and the unchanged field are both heard, and the form reports the combined result', () =>
    {
        const first = createFirstPage();    // Field1 'lower' is invalid, Field2 'GOOD' is valid
        const capturedState = first.vhm.captureState();
        const heard = new CallbackRecorder();

        // The server revised Field1 only. The reader validates Field1, which notifies the callbacks.
        // Field2 is skipped by the reader (nothing changed), so only the broadcast can tell the callbacks about it.
        const t = receiveRegeneratedPage(capturedState, { [field1]: 'FIXED', [field2]: 'GOOD' }, [], false, 'roundTripSummary',
            (page) => heard.attach(page.vhm));
        new ServerPageValuesReader(t.vhm).read();

        expect(heard.fieldStatuses[field1]).toBe(ValidationStatus.Valid);
        expect(heard.fieldStatuses[field2]).toBe(ValidationStatus.Valid);
        expect(heard.formIsValid).toBe(true);
        expectElementsMatchValidationState(t, field1, ValidationStatus.Valid);
        expect(t.element('summary').classList.contains('jivs-has-issues')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('When the server removes an editor, the callbacks hear it as Disabled at install, and the form result ignores its issues', () =>
    {
        const first = createFirstPage();
        userEdits(first, field1, 'FIXED');   // Field1 is Valid
        userEdits(first, field2, 'lower');   // Field2 is Invalid, but the server will drop its editor
        const capturedState = first.vhm.captureState();
        const heard = new CallbackRecorder();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'FIXED' }, [field2], false, 'roundTripSummary',
            (page) => heard.attach(page.vhm));
        // FormInstaller disables a field that has no editor, and that change is reported.
        expect(heard.fieldStatuses).toEqual({ [field2]: ValidationStatus.Disabled });
        new ServerPageValuesReader(t.vhm).read();

        expect(heard.fieldStatuses[field1]).toBe(ValidationStatus.Valid);
        expect(heard.fieldStatuses[field2]).toBe(ValidationStatus.Disabled);   // the broadcast skips it, so no Invalid report
        expect(heard.formIsValid).toBe(true);
        expect(t.element('summary').classList.contains('jivs-has-issues')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('The broadcast redraws what install already drew, so the summary lists each issue once', () =>
    {
        const first = createFirstPage();
        userEdits(first, field2, 'lower');   // both fields are Invalid
        const capturedState = first.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'lower' });
        const summary = t.element('summary');
        const countIn = (text: string, part: string) => text.split(part).length - 1;
        expect(countIn(summary.textContent!, 'ONE-UPPER')).toBe(1);   // drawn by install
        new ServerPageValuesReader(t.vhm).read();   // the broadcast draws it again

        expect(countIn(summary.textContent!, 'ONE-UPPER')).toBe(1);
        expect(countIn(summary.textContent!, 'TWO-UPPER')).toBe(1);
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('Neither install nor the broadcast reports text values, because the editors are the source of the values', () =>
    {
        const first = createFirstPage();
        const capturedState = first.vhm.captureState();
        const heard = new CallbackRecorder();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'GOOD' }, [], false, 'roundTripSummary',
            (page) => heard.attach(page.vhm));
        new ServerPageValuesReader(t.vhm).read();

        expect(heard.textValueChanges).toEqual([]);
        expect((t.element('editor', field1) as unknown as HTMLInputElement).value).toBe('lower');
        expect(Object.keys(heard.fieldStatuses).sort()).toEqual([field1, field2]);   // proves the broadcast ran
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// The server brings back an editor whose text equals the text the field already holds, but the field was
// disabled. The reader treats the enabled change as a change, so the field is reset and validated again.
describe('RoundTrip: the server restores an editor with unchanged text', () =>
{
    test('A disabled field that gets its editor back with the same text becomes enabled, is validated, and joins the summary', () =>
    {
        const first = createFirstPage();
        userEdits(first, field2, 'lower');
        const second = receiveRegeneratedPage(first.vhm.captureState(), { [field1]: 'lower' }, [field2]);
        new ServerPageValuesReader(second.vhm).read();
        expect(second.vhm.getFieldValueHost(field2)!.isEnabled()).toBe(false);
        expect(second.vhm.getFieldValueHost(field2)!.getTextValue()).toBe('lower');   // the disabled field kept its text
        const capturedState = second.vhm.captureState();

        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'lower' });
        new ServerPageValuesReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost(field2)!.isEnabled()).toBe(true);
        expectElementsMatchValidationState(t, field2, ValidationStatus.Invalid);
        expectIssueCodes(t, field2, [ConditionType.RegExp]);
        expect(t.element('summary').textContent).toContain('TWO-UPPER');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// The server regenerates a page whose fields differ from the captured state: one field is new to the string,
// and two fields in the string no longer exist on the page.
describe('RoundTrip: the captured state does not match the regenerated page', () =>
{
    test('A field absent from the captured state is validated from the server value, and state for fields no longer on the page is ignored', () =>
    {
        const first = createFirstPage();    // captured state knows Field1 (Invalid) and Field2 (Valid), not the number field
        const capturedState = first.vhm.captureState();
        const heard = new CallbackRecorder();

        const t = receiveRegeneratedPage(capturedState, { [numberField]: 'abc' }, [], false, 'roundTripNumber',
            (page) => heard.attach(page.vhm));
        new ServerPageValuesReader(t.vhm).read();

        expect(t.vhm.getFieldValueHost(field1)).toBeNull();
        expect(t.vhm.getFieldValueHost(numberField)!.getTextValue()).toBe('abc');
        expectElementsMatchValidationState(t, numberField, ValidationStatus.Invalid);
        expectIssueCodes(t, numberField, [ConditionType.DataTypeCheck]);
        expect(Object.keys(heard.fieldStatuses)).toEqual([numberField]);
        expect(t.element('summary').classList.contains('jivs-has-issues')).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// After the restore, the page behaves like any live page.
describe('RoundTrip: the user keeps editing', () =>
{
    test('A user edit after the restore replaces the restored issues with the new result', () =>
    {
        const first = createFirstPage();
        const capturedState = first.vhm.captureState();
        const t = receiveRegeneratedPage(capturedState, { [field1]: 'lower', [field2]: 'GOOD' });
        new ServerPageValuesReader(t.vhm).read();
        expectElementsMatchValidationState(t, field1, ValidationStatus.Invalid);

        userEdits(t, field1, 'FIXED');

        expectElementsMatchValidationState(t, field1, ValidationStatus.Valid);
        expect(t.element('summary').classList.contains('jivs-has-issues')).toBe(false);
        expect((t.element('editor', field1) as unknown as HTMLInputElement).value).toBe('FIXED');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});
