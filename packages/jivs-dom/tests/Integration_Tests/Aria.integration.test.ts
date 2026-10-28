/** @jest-environment jsdom */
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { TestForm } from './TestingSupport/CreateTestForm';
import { createDefaultTestFieldRepository } from './TestingSupport/TestFieldRepository';
import { installForm } from './TestingSupport/FieldFeedbackExpectations';
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
