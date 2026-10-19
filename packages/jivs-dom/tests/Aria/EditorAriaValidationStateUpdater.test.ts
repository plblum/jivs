import { ValidationSeverity, ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { EditorAriaValidationStateUpdater } from '../../src/Aria/EditorAriaValidationStateUpdater';
import { ElementRole } from '../../src/Interfaces/Types';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';

/**
 * Creates a validation-state fixture and a field value host that this updater does not inspect.
 * @param isValid - Whether the supplied validation snapshot is valid.
 */
function createValidationState(isValid: boolean): ValueHostValidationState
{
    let issuesFound: any[] | null = null;
    if (!isValid)
        issuesFound = [{ severity: ValidationSeverity.Error, message: 'Invalid', errorCode: 'INVALID' }];
    return {
        isValid: isValid,
        doNotSave: !isValid,
        issuesFound: issuesFound,
        asyncProcessing: false,
        status: isValid ? ValidationStatus.Valid : ValidationStatus.Invalid,
        corrected: false
    };
}

/**
 * Creates a role-tagged editor element, a minimal unused value-host fake, and the updater.
 * @param role - Role stored on the element; defaults to ElementRole.editor.
 */
function setup(role: ElementRole | string = ElementRole.editor): {
    element: IJivsElement,
    valueHost: IFieldValueHost,
    testItem: EditorAriaValidationStateUpdater
}
{
    let element = document.createElement('input') as IJivsElement;
    element.jivsElementRole = role;
    return {
        element: element,
        valueHost: {} as IFieldValueHost,
        testItem: new EditorAriaValidationStateUpdater()
    };
}

// Invalid editor state sets aria-invalid and associates the provided, eligible error-message ID.
describe('EditorAriaValidationStateUpdater invalid editor state', () => {
    test('Sets aria-invalid and aria-errormessage when the editor is invalid and an ID is supplied', () => {
        let { element, valueHost, testItem } = setup();

        testItem.applyValidationState(element, valueHost, createValidationState(false), 'field-error');

        expect(element.getAttribute('aria-invalid')).toBe('true');
        expect(element.getAttribute('aria-errormessage')).toBe('field-error');
    });
    test('Removes a stale aria-errormessage when the editor is invalid but no ID is supplied', () => {
        let { element, valueHost, testItem } = setup();
        element.setAttribute('aria-errormessage', 'old-error');

        testItem.applyValidationState(element, valueHost, createValidationState(false));

        expect(element.getAttribute('aria-invalid')).toBe('true');
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
    test('Removes a stale aria-errormessage when the editor is invalid but the supplied ID is empty', () => {
        let { element, valueHost, testItem } = setup();
        element.setAttribute('aria-errormessage', 'old-error');

        testItem.applyValidationState(element, valueHost, createValidationState(false), '');

        expect(element.getAttribute('aria-invalid')).toBe('true');
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
    test('Leaves aria-errormessage absent when invalid and no ID has ever been assigned', () => {
        let { element, valueHost, testItem } = setup();

        testItem.applyValidationState(element, valueHost, createValidationState(false));

        expect(element.getAttribute('aria-invalid')).toBe('true');
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
});

// A valid editor clears dynamic error attributes regardless of any prior state or supplied error-message ID.
describe('EditorAriaValidationStateUpdater valid editor state', () => {
    test('Removes aria-invalid and aria-errormessage when the editor becomes valid', () => {
        let { element, valueHost, testItem } = setup();
        element.setAttribute('aria-invalid', 'true');
        element.setAttribute('aria-errormessage', 'field-error');

        testItem.applyValidationState(element, valueHost, createValidationState(true), 'another-error');

        expect(element.hasAttribute('aria-invalid')).toBe(false);
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
    test('Does not add error attributes to a valid editor that has no existing error state', () => {
        let { element, valueHost, testItem } = setup();

        testItem.applyValidationState(element, valueHost, createValidationState(true));

        expect(element.hasAttribute('aria-invalid')).toBe(false);
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
});

// Only elements marked with the installed editor role receive validation-state ARIA updates.
describe('EditorAriaValidationStateUpdater role gating', () => {
    test('Leaves a non-editor element and its authored attributes unchanged', () => {
        let { element, valueHost, testItem } = setup(ElementRole.label);
        element.setAttribute('aria-invalid', 'custom');
        element.setAttribute('aria-errormessage', 'authored-error');

        testItem.applyValidationState(element, valueHost, createValidationState(false), 'field-error');

        expect(element.getAttribute('aria-invalid')).toBe('custom');
        expect(element.getAttribute('aria-errormessage')).toBe('authored-error');
    });
    test('Leaves an element without a Jivs role unchanged', () => {
        let { element, valueHost, testItem } = setup();
        element.jivsElementRole = undefined;

        testItem.applyValidationState(element, valueHost, createValidationState(false), 'field-error');

        expect(element.hasAttribute('aria-invalid')).toBe(false);
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
    test('Uses the element role rather than an unrelated role on the supplied value host', () => {
        let { element, valueHost, testItem } = setup(ElementRole.container);
        Object.assign(valueHost, { jivsElementRole: ElementRole.editor });

        testItem.applyValidationState(element, valueHost, createValidationState(false), 'field-error');

        expect(element.hasAttribute('aria-invalid')).toBe(false);
    });
});

// Real engine validation snapshots confirm that only invalid errors, not warning-only issues, mark an editor invalid.
describe('EditorAriaValidationStateUpdater with real FieldValueHost validation state', () => {
    test('Sets invalid semantics from a real invalid state and clears them after the host becomes valid', () => {
        let { valueHost } = setupFieldValueHostForTesting();
        valueHost.addExternalIssueFound({
            errorMessage: 'A real validation error'
        }, true);
        valueHost.validate();
        let element = document.createElement('input') as IJivsElement;
        element.jivsElementRole = ElementRole.editor;
        let testItem = new EditorAriaValidationStateUpdater();

        expect(valueHost.currentValidationState.isValid).toBe(false);
        testItem.applyValidationState(element, valueHost, valueHost.currentValidationState, 'field-error');

        expect(element.getAttribute('aria-invalid')).toBe('true');
        expect(element.getAttribute('aria-errormessage')).toBe('field-error');

        valueHost.clearExternalIssuesFound();
        valueHost.validate();
        testItem.applyValidationState(element, valueHost, valueHost.currentValidationState);

        expect(valueHost.currentValidationState.isValid).toBe(true);
        expect(element.hasAttribute('aria-invalid')).toBe(false);
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
    test('Does not mark a real warning-only state invalid even though it contains an issue', () => {
        let { valueHost } = setupFieldValueHostForTesting();
        valueHost.addExternalIssueFound({
            errorMessage: 'A real warning',
            severity: ValidationSeverity.Warning
        }, true);
        valueHost.validate();
        let element = document.createElement('input') as IJivsElement;
        element.jivsElementRole = ElementRole.editor;
        let testItem = new EditorAriaValidationStateUpdater();

        expect(valueHost.currentValidationState.issuesFound).toHaveLength(1);
        expect(valueHost.currentValidationState.isValid).toBe(true);
        testItem.applyValidationState(element, valueHost, valueHost.currentValidationState);

        expect(element.hasAttribute('aria-invalid')).toBe(false);
        expect(element.hasAttribute('aria-errormessage')).toBe(false);
    });
});
