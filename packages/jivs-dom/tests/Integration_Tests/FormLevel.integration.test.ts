/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { TestForm, TestFormOptions } from './TestingSupport/CreateTestForm';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { installForm } from './TestingSupport/FieldFeedbackExpectations';
import { registerTestSubmitPresentation } from './TestingSupport/TestSubmitPresentation';
import { useCleanDocument } from './TestingSupport/TestFileSupport';

/**
 * Purpose: To test form-level feedback on a live form: the validation summary and the submit element.
 * Field-level feedback is covered by UserInteraction.integration.test.ts.
 *
 * The form dispatcher calls each form-role element's presentation with the form's ValidationState,
 * which holds the issues of every field (or of one validation group).
 *
 * Two details shape these tests:
 * - Jivs-dom has no submit presentation, so TestSubmitPresentation (in TestingSupport) stands in.
 *   It disables the submit element while the state holds an Error or Severe issue.
 * - The ValueHostsManager debounces its form-level notification after a field validates. These tests
 *   set notifyValidationStateChangedDelay to 0 so a change event updates the summary immediately.
 *   validate() and clearValidation() notify at once regardless.
 */

// When true, emits HTML and element registry information to the console.
let verbose = false;
useCleanDocument();

const nameField = 'Text_Upper_Max5';
const codeField = 'Text_Upper_Max5_Optional';

/** The Field Identities for this file only. They add to the default repository. */
function createRepository()
{
    const repository = createDefaultTestFieldRepository();
    repository.registerIdentity({
        name: nameField,
        description: 'Text input that is required, all uppercase letters, and at most 5 characters',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .requireText('REQ-MSG')
                .regExp(/^[A-Z]*$/, { errorMessage: 'UPPER-MSG', severity: ValidationSeverity.Error })
                .stringLength(5, 'LEN-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: codeField,
        description: 'Text_Upper_Max5 without requireText, so the field is not required',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .regExp(/^[A-Z]*$/, { errorMessage: 'CODE-UPPER-MSG', severity: ValidationSeverity.Error })
                .stringLength(5, 'CODE-LEN-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    // One form with two fields, a summary and a submit. No validation groups.
    repository.registerFormTemplate('summaryAndSubmit', (page) =>
    {
        const form = page.form('order-form');
        form.field(nameField, 'withRequired');
        form.field(codeField, 'withRequired');
        form.validationSummary();
        form.submit();
    });
    // Two summaries and two submits, each dedicated to a validation group.
    repository.registerFormTemplate('twoGroups', (page) =>
    {
        const form = page.form('order-form');
        form.field(nameField, 'withRequired');
        form.field(codeField, 'withRequired');
        form.validationSummary(null, 'GroupA');
        form.submit(null, 'GroupA');
        form.validationSummary(null, 'GroupB');
        form.submit(null, 'GroupB');
    });
    // An ungrouped summary together with a summary and submit dedicated to GroupA.
    repository.registerFormTemplate('allAndGroupA', (page) =>
    {
        const form = page.form('order-form');
        form.field(nameField, 'withRequired');
        form.field(codeField, 'withRequired');
        form.validationSummary();
        form.validationSummary(null, 'GroupA');
        form.submit(null, 'GroupA');
    });
    return repository;
}

/**
 * Installs the form template with the AriaService off, the submit presentation, and no debounce.
 * @param respondToWildcardGroup Applied to both the summary (through the global options) and the submit presentation.
 */
function installFormLevel(formTemplate: string, configure?: TestFormOptions['configure'],
    respondToWildcardGroup: boolean = false): TestForm
{
    let t = installForm({
        repository: createRepository(), formTemplate: formTemplate, verbose: verbose,
        configure: configure,
        configureServices: (services) =>
        {
            services.domServices.options.validationSummary.respondToWildcardGroup = respondToWildcardGroup;
            registerTestSubmitPresentation(services, { respondToWildcardGroup: respondToWildcardGroup });
        }
    });
    t.vhm.notifyValidationStateChangedDelay = 0;
    return t;
}

/** The summary that has no validation group. */
function ungroupedSummary(): HTMLElement
{
    return document.querySelector("[data-jivs-role='summary']:not([data-jivs-group])") as HTMLElement;
}

/** The form-role element with the role that is dedicated to the validation group. */
function groupElement(role: 'summary' | 'submit', group: string): HTMLElement
{
    return document.querySelector(`[data-jivs-role='${ role }'][data-jivs-group='${ group }']`) as HTMLElement;
}

/** The user types a value into the field's editor and leaves it. */
function userEdits(t: TestForm, field: string, value: string): void
{
    let editor = t.element('editor', field) as unknown as HTMLInputElement;
    editor.value = value;
    editor.dispatchEvent(new Event('change', { bubbles: true }));
}

// The summary lists the issues of every field, and the submit element follows whether any blocking issue exists.
describe('A form with two fields, a summary and a submit', () =>
{
    test('validate() lists the messages of both fields, and each valid edit removes that field\'s messages', () =>
    {
        let t = installFormLevel('summaryAndSubmit');
        let summary = t.element('summary');
        let submit = t.element('submit');
        expect(summary.classList.contains('jivs-has-issues')).toBe(false);
        expect(submit.hasAttribute('disabled')).toBe(false);

        // Load the model's values without validating, as a site does before validating the whole form.
        t.vhm.getFieldValueHost(nameField)!.setTextValue('', { reset: true });
        t.vhm.getFieldValueHost(codeField)!.setTextValue('abc', { reset: true });
        t.vhm.validate();

        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(summary.textContent).toContain('REQ-MSG');
        expect(summary.textContent).toContain('CODE-UPPER-MSG');
        expect(submit.hasAttribute('disabled')).toBe(true);

        userEdits(t, nameField, 'ABC');

        expect(summary.textContent).not.toContain('REQ-MSG');
        expect(summary.textContent).toContain('CODE-UPPER-MSG');
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(submit.hasAttribute('disabled')).toBe(true);

        userEdits(t, codeField, 'XYZ');

        expect(summary.classList.contains('jivs-has-issues')).toBe(false);
        expect(summary.textContent).toBe('');
        expect(submit.hasAttribute('disabled')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('clearValidation() empties the summary and re-enables the submit', () =>
    {
        let t = installFormLevel('summaryAndSubmit');
        let summary = t.element('summary');
        let submit = t.element('submit');
        t.vhm.getFieldValueHost(nameField)!.setTextValue('', { reset: true });
        t.vhm.getFieldValueHost(codeField)!.setTextValue('abc', { reset: true });
        t.vhm.validate();
        expect(summary.classList.contains('jivs-has-issues')).toBe(true);
        expect(submit.hasAttribute('disabled')).toBe(true);

        t.vhm.clearValidation();

        expect(summary.classList.contains('jivs-has-issues')).toBe(false);
        expect(summary.textContent).toBe('');
        expect(submit.hasAttribute('disabled')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// Each summary and submit is dedicated to a validation group through data-jivs-group.
// A group-bound element responds only to a validation of its own group.
describe('Two summaries and submits, one per validation group', () =>
{
    /** The name field is in GroupA and the code field is in GroupB. Both start with invalid values, not yet validated. */
    function installTwoGroups(): TestForm
    {
        let t = installFormLevel('twoGroups', (config) =>
        {
            for (let vhc of config.valueHostConfigs)
                (vhc as any).group = vhc.name === nameField ? 'GroupA' : 'GroupB';
        });
        t.vhm.getFieldValueHost(nameField)!.setTextValue('', { reset: true });
        t.vhm.getFieldValueHost(codeField)!.setTextValue('abc', { reset: true });
        return t;
    }

    test('validate({group}) updates only the summary and submit of that group', () =>
    {
        let t = installTwoGroups();

        t.vhm.validate({ group: 'GroupA' });

        expect(groupElement('summary', 'GroupA').textContent).toContain('REQ-MSG');
        expect(groupElement('summary', 'GroupA').textContent).not.toContain('CODE-UPPER-MSG');
        expect(groupElement('summary', 'GroupA').classList.contains('jivs-has-issues')).toBe(true);
        expect(groupElement('submit', 'GroupA').hasAttribute('disabled')).toBe(true);
        expect(groupElement('summary', 'GroupB').textContent).toBe('');
        expect(groupElement('summary', 'GroupB').classList.contains('jivs-has-issues')).toBe(false);
        expect(groupElement('submit', 'GroupB').hasAttribute('disabled')).toBe(false);

        t.vhm.validate({ group: 'GroupB' });

        expect(groupElement('summary', 'GroupB').textContent).toContain('CODE-UPPER-MSG');
        expect(groupElement('summary', 'GroupB').textContent).not.toContain('REQ-MSG');
        expect(groupElement('summary', 'GroupB').classList.contains('jivs-has-issues')).toBe(true);
        expect(groupElement('submit', 'GroupB').hasAttribute('disabled')).toBe(true);
        expect(groupElement('summary', 'GroupA').textContent).toContain('REQ-MSG');
        expect(groupElement('summary', 'GroupA').classList.contains('jivs-has-issues')).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// validate() with no group is a wildcard. An ungrouped summary always shows everything. A group-bound element
// ignores the wildcard unless respondToWildcardGroup is true, and then shows only the issues of its own group.
describe('Wildcard validation with group-bound and ungrouped elements', () =>
{
    function installAllAndGroupA(respondToWildcardGroup: boolean): TestForm
    {
        let t = installFormLevel('allAndGroupA', (config) =>
        {
            for (let vhc of config.valueHostConfigs)
                (vhc as any).group = vhc.name === nameField ? 'GroupA' : 'GroupB';
        }, respondToWildcardGroup);
        t.vhm.getFieldValueHost(nameField)!.setTextValue('', { reset: true });
        t.vhm.getFieldValueHost(codeField)!.setTextValue('abc', { reset: true });
        return t;
    }

    test('By default validate() updates the ungrouped summary and leaves the GroupA elements alone', () =>
    {
        let t = installAllAndGroupA(false);

        t.vhm.validate();

        expect(ungroupedSummary().classList.contains('jivs-has-issues')).toBe(true);
        expect(ungroupedSummary().textContent).toContain('REQ-MSG');
        expect(ungroupedSummary().textContent).toContain('CODE-UPPER-MSG');
        expect(groupElement('summary', 'GroupA').classList.contains('jivs-has-issues')).toBe(false);
        expect(groupElement('summary', 'GroupA').textContent).toBe('');
        expect(groupElement('submit', 'GroupA').hasAttribute('disabled')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('With respondToWildcardGroup, validate() also updates the GroupA elements with only the GroupA issues', () =>
    {
        let t = installAllAndGroupA(true);

        t.vhm.validate();

        expect(ungroupedSummary().textContent).toContain('REQ-MSG');
        expect(ungroupedSummary().textContent).toContain('CODE-UPPER-MSG');
        expect(groupElement('summary', 'GroupA').classList.contains('jivs-has-issues')).toBe(true);
        expect(groupElement('summary', 'GroupA').textContent).toContain('REQ-MSG');
        expect(groupElement('summary', 'GroupA').textContent).not.toContain('CODE-UPPER-MSG');
        expect(groupElement('submit', 'GroupA').hasAttribute('disabled')).toBe(true);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});
