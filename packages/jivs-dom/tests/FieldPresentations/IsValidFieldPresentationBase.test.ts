/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    IsValidFieldPresentationBase,
    IsValidFieldPresentationOptions
} from '../../src/FieldPresentations/IsValidFieldPresentationBase';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

class TestIsValidFieldPresentation extends IsValidFieldPresentationBase<IsValidFieldPresentationOptions>
{
    public constructor(element: HTMLElement, options?: IsValidFieldPresentationOptions)
    {
        super(element, options);
    }

    protected override getGlobalOptions(): object | undefined
    {
        return undefined;
    }
}

function createPresentation(
    options?: IsValidFieldPresentationOptions,
    initialClasses: string[] = []
): {
    presentation: TestIsValidFieldPresentation;
    element: HTMLElement;
}
{
    let element = document.createElement('div');
    element.classList.add(...initialClasses);
    let presentation = new TestIsValidFieldPresentation(element, options);
    presentation.init(createValueHostsManager(createDomServices()));
    return { presentation: presentation, element: element };
}

function createDomServices(): IJivsDomServices
{
    return createMockJivsDomServices();
}

function createValueHostsManager(domServices: IJivsDomServices): IValueHostsManager
{
    return {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
}

function applyState(
    presentation: TestIsValidFieldPresentation,
    isValid: boolean,
    status: ValidationStatus,
    corrected: boolean,
    required: boolean
): void
{
    let valueHost = { required: required } as IFieldValueHost;
    let state = {
        isValid: isValid,
        status: status,
        corrected: corrected
    } as ValueHostValidationState;

    presentation.apply(valueHost, state);
}

// The base always exposes its own persistent class, while optional state classes default to disabled.
describe('IsValidFieldPresentationBase initialization', () => {
    test('Adds the base persistent class and does not enable optional state classes by default', () => {
        let { presentation, element } = createPresentation();

        expect(element.classList.contains('jivs-isvalidpresentation')).toBe(true);

        applyState(presentation, true, ValidationStatus.Valid, false, true);

        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-corrected')).toBe(false);
        expect(element.classList.contains('jivs-required')).toBe(false);
    });
});

// Invalid state always adds jivs-invalid and removes other validation-result classes.
describe('IsValidFieldPresentationBase invalid state', () => {
    test('Adds invalid even when optional classes are disabled and removes stale valid classes', () => {
        let { presentation, element } = createPresentation(
            undefined,
            ['jivs-validated', 'jivs-corrected']
        );

        applyState(presentation, false, ValidationStatus.Invalid, true, false);

        expect(element.classList.contains('jivs-invalid')).toBe(true);
        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-corrected')).toBe(false);
    });

    test('Gives invalid precedence over corrected state and leaves required state independent', () => {
        let { presentation, element } = createPresentation({
            correctedClassEnabled: true,
            validatedClassEnabled: true,
            requiredClassEnabled: true
        });

        applyState(presentation, false, ValidationStatus.Invalid, true, true);

        expect(element.classList.contains('jivs-invalid')).toBe(true);
        expect(element.classList.contains('jivs-corrected')).toBe(false);
        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-required')).toBe(true);
    });
});

// Corrected and validated classes are optional, mutually exclusive indicators for valid results.
describe('IsValidFieldPresentationBase valid state', () => {
    test('Adds the corrected class instead of validated when corrected styling is enabled', () => {
        let { presentation, element } = createPresentation({
            correctedClassEnabled: true,
            validatedClassEnabled: true
        });

        applyState(presentation, true, ValidationStatus.Valid, true, false);

        expect(element.classList.contains('jivs-corrected')).toBe(true);
        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-invalid')).toBe(false);
    });

    test('Falls back to the validated class when corrected is true but corrected styling is disabled', () => {
        let { presentation, element } = createPresentation({
            validatedClassEnabled: true
        });

        applyState(presentation, true, ValidationStatus.Valid, true, false);

        expect(element.classList.contains('jivs-validated')).toBe(true);
        expect(element.classList.contains('jivs-corrected')).toBe(false);
    });

    test('Adds the validated class for a valid result when validated styling is enabled', () => {
        let { presentation, element } = createPresentation({
            validatedClassEnabled: true
        });

        applyState(presentation, true, ValidationStatus.Valid, false, false);

        expect(element.classList.contains('jivs-validated')).toBe(true);
        expect(element.classList.contains('jivs-corrected')).toBe(false);
    });

    test('Does not add a validation-result class for an unvalidated state', () => {
        let { presentation, element } = createPresentation({
            validatedClassEnabled: true,
            correctedClassEnabled: true
        });

        applyState(presentation, true, ValidationStatus.Undetermined, false, false);

        expect(element.classList.contains('jivs-invalid')).toBe(false);
        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-corrected')).toBe(false);
    });
});

// Required styling is independent from validation state and remains present while the field stays required.
describe('IsValidFieldPresentationBase required state', () => {
    test('Adds the required class alongside a validated class when both options are enabled', () => {
        let { presentation, element } = createPresentation({
            requiredClassEnabled: true,
            validatedClassEnabled: true
        });

        applyState(presentation, true, ValidationStatus.Valid, false, true);

        expect(element.classList.contains('jivs-required')).toBe(true);
        expect(element.classList.contains('jivs-validated')).toBe(true);
    });

    test('Does not add the required class when the field is not required', () => {
        let { presentation, element } = createPresentation({
            requiredClassEnabled: true
        });

        applyState(presentation, true, ValidationStatus.Valid, false, false);

        expect(element.classList.contains('jivs-required')).toBe(false);
    });

    test('Keeps the required class while validation-result classes change', () => {
        let { presentation, element } = createPresentation({
            requiredClassEnabled: true,
            validatedClassEnabled: true,
            correctedClassEnabled: true
        }, ['application-owned']);

        applyState(presentation, false, ValidationStatus.Invalid, false, true);
        applyState(presentation, true, ValidationStatus.Valid, true, true);

        expect(element.classList.contains('jivs-invalid')).toBe(false);
        expect(element.classList.contains('jivs-required')).toBe(true);
        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-corrected')).toBe(true);
        expect(element.classList.contains('application-owned')).toBe(true);
    });
});
