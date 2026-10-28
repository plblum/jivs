import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ElementRole } from '../../../src/Interfaces/Types';
import { IJivsElement } from '../../../src/Interfaces/IJivsElement';
import { FormInstaller } from '../../../src/FormInstaller/FormInstaller';
import { createDefaultTestFieldRepository } from './TestFieldRepository';
import { EmulatedPopupMechanism } from './EmulatedPopupMechanism';

const popupErrorTemplateName = 'withPopupError';
import { createTestForm, TestForm, TestFormOptions } from './CreateTestForm';

/**
 * Checks which validators reported issues, by errorCode, in validator order.
 * An empty list means no issues (issuesFound is null or empty).
 */
export function expectIssueCodes(t: TestForm, fieldName: string, expected: string[]): void
{
    let valueHost = t.vhm.getFieldValueHost(fieldName) as IFieldValueHost;
    expect((valueHost.currentValidationState.issuesFound ?? []).map(i => i.errorCode)).toEqual(expected);
}

/**
 * Builds a form and installs it the way a live page is installed, ready for a user to edit it.
 * It accepts every TestFormOptions member except install, which it controls: it uses the static
 * FormInstaller.install so the dispatchers that carry validation state to the presentations are attached
 * (the instance install used by createTestForm does not attach them).
 * Defaults: fieldTemplate 'withRequired', and the AriaService off so only visible changes appear.
 * To register presentations configured through their options, use configureServices
 * (register() replaces existing names).
 */
export function installForm(options: Omit<TestFormOptions, 'install'>): TestForm
{
    let t = createTestForm({
        fieldTemplate: 'withRequired',
        ...options,
        servicesConfigOptions: { ariaService: false, ...options.servicesConfigOptions },
        install: false
    });
    t.page.assign();
    FormInstaller.install(t.vhm, t.collector);
    return t;
}

/**
 * Like installForm, for fields whose error display is a popup. It supplies what the popup needs:
 * - an EmulatedPopupMechanism assigned to domServices.popupMechanism before the presentations register
 *   (the 'PopupError' presentation registers only when a mechanism exists).
 * - a 'withPopupError' field template (label, editor, required indicator, popup error display)
 *   added to the repository when absent, and used unless options.fieldTemplate says otherwise.
 * @returns The form and the emulator, which the test uses to see and drive the popup.
 */
export function installPopupForm(options: Omit<TestFormOptions, 'install'>):
    { t: TestForm, popup: EmulatedPopupMechanism }
{
    let repository = options.repository ?? createDefaultTestFieldRepository();
    if (!repository.fieldTemplateNames().includes(popupErrorTemplateName))
        repository.registerFieldTemplate(popupErrorTemplateName, (page, field) =>
        {
            page.label(field.name, field.name);
            field.addEditor(page);
            page.requiredIndicator(field.name, '*');
            page.errorDisplay(field.name, 'PopupError');
        });
    let popup = new EmulatedPopupMechanism();
    let t = installForm({
        fieldTemplate: popupErrorTemplateName,
        ...options,
        repository: repository,
        configureServices: (services) =>
        {
            services.domServices.popupMechanism = popup;
            options.configureServices?.(services);
        }
    });
    return { t, popup };
}

/**
 * Tools that check the visible feedback on a field's elements against the field's own
 * ValueHostValidationState. The ValueHostsManager is the source of truth, so a test never copies
 * messages or validator lists. The test states only the status it expects the user's action to cause,
 * which proves the state really changed. The expectation functions then prove the elements agree with it.
 *
 * Only the roles the field's elements actually have are checked, found through the ElementRegistry.
 * Persistent classes are covered by the presentations' unit tests and are not checked here.
 */

/** The elements registered for the field, by role. A role the template omitted is absent. */
export function fieldElementsByRole(t: TestForm, fieldName: string): Map<string, IJivsElement>
{
    let result = new Map<string, IJivsElement>();
    for (let element of t.registry.getFieldPresentationElements(fieldName))
        if (element.jivsElementRole)
            result.set(element.jivsElementRole, element);
    return result;
}

/**
 * Proves the field has the expected status, then that each of its elements reflects the
 * ValueHostValidationState:
 * - editor, label and required indicator have jivs-invalid only when the status is Invalid.
 * - the error display has jivs-has-issues and shows every issue's errorMessage when there are issues,
 *   and is empty when there are none. A popup error display holds only an indicator, so pass
 *   messagesInErrorElement: false to skip the message check. It must still be empty when there are no issues.
 * @param expectedStatus The status the user's action should have caused.
 * @param messagesInErrorElement Defaults to true.
 */
export function expectElementsMatchValidationState(t: TestForm, fieldName: string,
    expectedStatus: ValidationStatus, messagesInErrorElement: boolean = true): void
{
    let valueHost = t.vhm.getFieldValueHost(fieldName) as IFieldValueHost;
    let state = valueHost.currentValidationState;
    expect(state.status).toBe(expectedStatus);

    let issues = state.issuesFound ?? [];
    let invalid = state.status === ValidationStatus.Invalid;
    for (let [role, element] of fieldElementsByRole(t, fieldName))
    {
        switch (role)
        {
            case ElementRole.editor:
            case ElementRole.label:
                expect(element.classList.contains('jivs-invalid')).toBe(invalid);
                break;
            case ElementRole.required:
                expect(element.classList.contains('jivs-invalid')).toBe(invalid);
                // The indicator shows jivs-required only when the field has a required validator.
                expect(element.classList.contains('jivs-required')).toBe(valueHost.required);
                break;
            case ElementRole.error:
                expect(element.classList.contains('jivs-has-issues')).toBe(issues.length > 0);
                if (!issues.length)
                    expect(element.textContent).toBe('');
                if (messagesInErrorElement)
                    for (let issue of issues)
                        expect(element.textContent).toContain(issue.errorMessage);
                break;
        }
    }
}
