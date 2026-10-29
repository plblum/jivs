import { ValidationSeverity, ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { FormPresentationBase, FormPresentationBaseOptions } from '../../../src/FormPresentations/FormPresentationBase';
import { ElementRole } from '../../../src/Interfaces/Types';
import { createJivsServicesForTesting } from '../../TestSupport/CreateJivsServicesForTesting';

/**
 * Jivs-dom has no presentation for the 'submit' role, so the form-level integration tests use this one.
 * It disables the submit element while the form-level state holds an issue with Error or Severe severity,
 * and enables it otherwise. Warnings and Info issues leave it enabled.
 *
 * FormPresentationBase decides whether the state applies to this element, using its validation group,
 * so applyCore only has to react to the state it is given.
 */
export class TestSubmitPresentation extends FormPresentationBase<FormPresentationBaseOptions>
{
    protected override getGlobalOptions(): object | undefined
    {
        return undefined;
    }

    protected override applyCore(_valueHostsManager: IValueHostsManager, state: ValidationState): void
    {
        let blocking = (state.issuesFound ?? []).some(issue =>
            issue.severity === ValidationSeverity.Error || issue.severity === ValidationSeverity.Severe);
        if (blocking)
            this.element.setAttribute('disabled', '');
        else
            this.element.removeAttribute('disabled');
    }
}

export const testSubmitPresentationName = 'TestSubmit';

/**
 * Registers TestSubmitPresentation as the default presentation of the 'submit' role.
 * Pass it to createTestForm's configureServices option, which runs right after the services are created.
 * The options can set respondToWildcardGroup for the group tests.
 */
export function registerTestSubmitPresentation(
    services: ReturnType<typeof createJivsServicesForTesting>, options: FormPresentationBaseOptions = {}): void
{
    let factory = services.domServices.formPresentationFactory;
    factory.register(testSubmitPresentationName, (element) => new TestSubmitPresentation(element, options));
    factory.setDefaultPresentationName(ElementRole.submit, testSubmitPresentationName);
}
