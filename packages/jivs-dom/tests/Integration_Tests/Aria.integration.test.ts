/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { createTestForm, TestForm } from './TestingSupport/CreateTestForm';
import { FormInstaller } from '../../src/FormInstaller/FormInstaller';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { installForm, installPopupForm } from './TestingSupport/FieldFeedbackExpectations';
import { useCleanDocument } from './TestingSupport/TestFileSupport';

/**
 * Purpose: To test the ARIA attributes written to a live form by the AriaService.
 * ARIA in form roles (summary, submit) is not covered here.
 *
 * The AriaService works in two phases:
 * - Static: attributes that do not depend on validation state, written once when the form is installed.
 * - Validation state: attributes that follow the field's validation state, written at install and
 *   again each time the state changes.
 *
 * installForm turns the AriaService off by default. These tests turn it on with servicesConfigOptions.
 */

// When true, emits HTML and element registry information to the console.
let verbose = false;
useCleanDocument();

/** The Field Identities for this file only. They add to the default repository. */
function createRepository()
{
    const repository = createDefaultTestFieldRepository();
    repository.registerIdentity({
        name: 'Text_Upper_Max5',
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
        name: 'Text_Upper_Max5_Optional',
        description: 'Text_Upper_Max5 without requireText, so the field is not required',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .regExp(/^[A-Z]*$/, { errorMessage: 'UPPER-MSG', severity: ValidationSeverity.Error })
                .stringLength(5, 'LEN-MSG');
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    repository.registerIdentity({
        name: 'Text_Max5_Warning',
        description: 'Text input where more than 5 characters is only a Warning',
        addConfig: (builder, name) =>
        {
            builder.field(name, LookupKey.String)
                .stringLength(5, { errorMessage: 'LEN-WARN', severity: ValidationSeverity.Warning });
        },
        addEditor: (page, name, o) =>
        {
            page.inputEditor(name, 'text', o.presentationName, o.adapterKey, o.additionalAttributes);
        }
    });
    return repository;
}

/** Installs the form with the AriaService on. */
function installWithAria(fields: string[], fieldTemplate?: string): TestForm
{
    return installForm({
        repository: createRepository(), fields: fields, verbose: verbose,
        ...(fieldTemplate ? { fieldTemplate: fieldTemplate } : {}),
        servicesConfigOptions: { ariaService: true }
    });
}

// The static phase runs at install, so these attributes exist before the user does anything.
describe('Static ARIA attributes at install', () =>
{
    test('A required editor gets aria-required, before any edit', () =>
    {
        let required = 'Text_Upper_Max5';
        let optional = 'Text_Upper_Max5_Optional';
        let t = installWithAria([required, optional]);

        expect(t.element('editor', required).getAttribute('aria-required')).toBe('true');
        expect(t.element('editor', optional).hasAttribute('aria-required')).toBe(false);
        // Validation state attributes are absent because nothing has been validated.
        expect(t.element('editor', required).hasAttribute('aria-invalid')).toBe(false);
        expect(t.element('editor', required).hasAttribute('aria-errormessage')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    // Isolates the required indicator. The first expectation shows the FormInstaller registered the element with
    // its role, so AriaService.install() has a record to work with. The second shows whether aria-hidden was written.
    test('The required indicator is registered with the role "required" and gets aria-hidden', () =>
    {
        let field = 'Text_Upper_Max5';
        let t = installWithAria([field]);
        let indicator = t.element('required', field);

        let record = t.recordFor(indicator);
        expect(record!.role).toBe('required');
        expect(record!.element).toBe(indicator);
        expect(indicator.getAttribute('aria-hidden')).toBe('true');
    });
});

/** The user edits the editor and leaves it, which sends a change event. */
function userEdits(t: TestForm, field: string, value: string): void
{
    let editor = t.element('editor', field) as unknown as HTMLInputElement;
    editor.value = value;
    editor.dispatchEvent(new Event('change', { bubbles: true }));
}

// The validation state phase follows the field's state. The editor points at its error element with aria-errormessage,
// and the error element's id is assigned at install when the markup has none.
describe('Validation state ARIA attributes on the editor', () =>
{
    const field = 'Text_Upper_Max5';

    test('aria-invalid and aria-errormessage appear when invalid and are removed when valid', () =>
    {
        let t = installWithAria([field]);
        let editor = t.element('editor', field);
        let errorElement = t.element('error', field);
        expect(errorElement.id).not.toBe('');

        userEdits(t, field, 'abcdefg');

        expect(editor.getAttribute('aria-invalid')).toBe('true');
        expect(editor.getAttribute('aria-errormessage')).toBe(errorElement.id);

        userEdits(t, field, 'ABC');

        expect(editor.hasAttribute('aria-invalid')).toBe(false);
        expect(editor.hasAttribute('aria-errormessage')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('An error element without an id is given a generated one, and aria-errormessage uses it', () =>
    {
        // The builder always writes ids, so build without installing, assign to the document, remove the id, then install.
        let t = createTestForm({
            repository: createRepository(), fields: [field], verbose: verbose, fieldTemplate: 'withRequired',
            servicesConfigOptions: { ariaService: true }, install: false
        });
        t.page.assign();
        document.querySelector("[data-jivs-role='error']")!.removeAttribute('id');
        FormInstaller.install(t.vhm, t.collector);
        let errorElement = t.element('error', field);
        let editor = t.element('editor', field);

        expect(errorElement.id).toMatch(/^error-.+/);
        expect(errorElement.id).toContain(field);

        userEdits(t, field, 'abcdefg');

        expect(editor.getAttribute('aria-errormessage')).toBe(errorElement.id);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// A Warning does not make the field invalid, so aria-invalid is not set. The message still reaches the screen reader
// through the aria-error element, which shows whatever issues the state holds.
describe('Warnings', () =>
{
    const field = 'Text_Max5_Warning';

    test('A warning leaves aria-invalid off but still fills the aria-error element', () =>
    {
        let t = installWithAria([field], 'withAriaError');
        let editor = t.element('editor', field);
        let ariaError = t.element('aria-error', field);

        userEdits(t, field, 'abcdefg');

        expect(t.vhm.getFieldValueHost(field)!.currentValidationState.isValid).toBe(true);
        expect(t.vhm.getFieldValueHost(field)!.currentValidationState.issuesFound).toHaveLength(1);
        expect(editor.hasAttribute('aria-invalid')).toBe(false);
        expect(ariaError.textContent).toBe('LEN-WARN');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// With several fields, each editor's aria-errormessage must point to its own field's error element.
describe('ARIA on two fields', () =>
{
    test('Each editor\'s aria-errormessage points to its own aria-error element', () =>
    {
        let a = 'Text_Upper_Max5';
        let b = 'Text_Upper_Max5_Optional';
        let t = installWithAria([a, b], 'withAriaError');
        let ariaErrorA = t.element('aria-error', a);
        let ariaErrorB = t.element('aria-error', b);
        expect(ariaErrorA.id).not.toBe(ariaErrorB.id);

        userEdits(t, b, 'xy');

        expect(t.element('editor', b).getAttribute('aria-errormessage')).toBe(ariaErrorB.id);
        expect(ariaErrorB.textContent).toBe('UPPER-MSG');
        expect(t.element('editor', a).hasAttribute('aria-invalid')).toBe(false);
        expect(t.element('editor', a).hasAttribute('aria-errormessage')).toBe(false);
        expect(ariaErrorA.textContent).toBe('');

        userEdits(t, a, 'abcdefg');

        expect(t.element('editor', a).getAttribute('aria-errormessage')).toBe(ariaErrorA.id);
        expect(ariaErrorA.textContent).toBe('UPPER-MSG; LEN-MSG');
        expect(t.element('editor', b).getAttribute('aria-errormessage')).toBe(ariaErrorB.id);
        expect(ariaErrorB.textContent).toBe('UPPER-MSG');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// A sequence of edits and a clear should leave nothing stale. Each new state replaces the previous one.
describe('ARIA through a sequence of edits and a clear', () =>
{
    const field = 'Text_Upper_Max5';

    test('Invalid, valid, then invalid again, each state fully replaces the previous', () =>
    {
        let t = installWithAria([field], 'withAriaError');
        let editor = t.element('editor', field);
        let ariaError = t.element('aria-error', field);

        userEdits(t, field, 'abcdefg');
        expect(editor.getAttribute('aria-invalid')).toBe('true');
        expect(editor.getAttribute('aria-errormessage')).toBe(ariaError.id);
        expect(ariaError.textContent).toBe('UPPER-MSG; LEN-MSG');

        userEdits(t, field, 'ABC');
        expect(editor.hasAttribute('aria-invalid')).toBe(false);
        expect(editor.hasAttribute('aria-errormessage')).toBe(false);
        expect(ariaError.textContent).toBe('');

        userEdits(t, field, 'ABCDEFG');
        expect(editor.getAttribute('aria-invalid')).toBe('true');
        expect(editor.getAttribute('aria-errormessage')).toBe(ariaError.id);
        expect(ariaError.textContent).toBe('LEN-MSG');
        expect(t.services.loggingService.entryCount).toBe(0);
    });

    test('ValueHostsManager.clearValidation() removes aria-invalid and aria-errormessage and empties the aria-error element', () =>
    {
        let t = installWithAria([field], 'withAriaError');
        let editor = t.element('editor', field);
        let ariaError = t.element('aria-error', field);
        userEdits(t, field, 'abcdefg');
        expect(editor.getAttribute('aria-invalid')).toBe('true');

        t.vhm.clearValidation();

        expect(editor.hasAttribute('aria-invalid')).toBe(false);
        expect(editor.hasAttribute('aria-errormessage')).toBe(false);
        expect(ariaError.textContent).toBe('');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// When the markup has both an error display and an aria-error element, aria-error supplies the id for aria-errormessage.
// It holds the messages as plain text for screen readers, and the editor's aria-errormessage points to it.
describe('The aria-error element', () =>
{
    const field = 'Text_Upper_Max5';

    test('Holds the plain-text messages while invalid, clears when valid, and is the editor\'s aria-errormessage target', () =>
    {
        let t = installWithAria([field], 'withAriaError');
        let editor = t.element('editor', field);
        let ariaError = t.element('aria-error', field);

        userEdits(t, field, 'abcdefg');

        expect(editor.getAttribute('aria-errormessage')).toBe(ariaError.id);
        expect(ariaError.textContent).toBe('UPPER-MSG; LEN-MSG');
        expect(ariaError.children.length).toBe(0);

        userEdits(t, field, 'ABC');

        expect(ariaError.textContent).toBe('');
        expect(editor.hasAttribute('aria-errormessage')).toBe(false);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});

// A popup error display and an aria-error element together. The aria-error element always supplies the id for
// aria-errormessage and the plain-text messages, while the popup indicator keeps the ARIA its own presentation supplies.
describe('Popup error display together with an aria-error element', () =>
{
    const field = 'Text_Upper_Max5';

    test('The popup indicator keeps its button role and aria-label, and the aria-error element supplies aria-errormessage', () =>
    {
        let repository = createRepository();
        repository.registerFieldTemplate('popupWithAriaError', (page, f) =>
        {
            page.label(f.name, f.name);
            f.addEditor(page);
            page.errorDisplay(f.name, 'PopupError');
            page.ariaError(f.name);
        });
        let { t } = installPopupForm({
            repository: repository, fields: [field], verbose: verbose, fieldTemplate: 'popupWithAriaError',
            servicesConfigOptions: { ariaService: true }
        });
        let editor = t.element('editor', field);
        let indicator = t.element('error', field);
        let ariaError = t.element('aria-error', field);

        expect(indicator.getAttribute('role')).toBe('button');
        expect(indicator.getAttribute('aria-label')).toBe('Show validation errors');
        expect(ariaError.classList.contains('jivs-visually-hidden')).toBe(true);

        userEdits(t, field, 'abcdefg');

        expect(editor.getAttribute('aria-invalid')).toBe('true');
        expect(editor.getAttribute('aria-errormessage')).toBe(ariaError.id);
        expect(ariaError.textContent).toBe('UPPER-MSG; LEN-MSG');
        expect(indicator.hasAttribute('aria-errormessage')).toBe(false);

        userEdits(t, field, 'ABC');

        expect(editor.hasAttribute('aria-errormessage')).toBe(false);
        expect(ariaError.textContent).toBe('');
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});
