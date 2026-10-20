/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultLabelPresentationName,
    LabelPresentation,
    LabelPresentationOptions
} from '../../src/FieldPresentations/LabelPresentation';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface IExpandedGlobalOptions extends JivsDomGlobalOptions
{
    label: LabelPresentationOptions;
}

function createPresentation(
    options?: LabelPresentationOptions,
    globalOptions?: LabelPresentationOptions
): {
    presentation: LabelPresentation;
    element: HTMLElement;
    domServices: IJivsDomServices;
}
{
    let element = document.createElement('label');
    let domOptions = {
        ...createMockJivsDomServices().options,
        label: globalOptions ?? {}
    } as IExpandedGlobalOptions;
    let domServices = createMockJivsDomServices({ options: domOptions });
    let presentation = new LabelPresentation(element, options);

    return {
        presentation: presentation,
        element: element,
        domServices: domServices
    };
}

function init(
    presentation: LabelPresentation,
    domServices: IJivsDomServices
): void
{
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    presentation.init(valueHostsManager);
}

function applyState(
    presentation: LabelPresentation,
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

// A label contributes its persistent classes and the standard registration name.
describe('LabelPresentation identity', () => {
    test('Adds both the validity-base and label persistent classes', () => {
        let { presentation, element, domServices } = createPresentation();

        init(presentation, domServices);

        expect(element.className).toBe('jivs-isvalidpresentation jivs-label');
    });

    test('Uses the registered default presentation name', () => {
        expect(defaultLabelPresentationName).toBe('label');
    });
});

// Label-specific global options control inherited state-class behavior, with instance options taking precedence.
describe('LabelPresentation options', () => {
    test('Enables state classes configured in global label options', () => {
        let { presentation, element, domServices } = createPresentation(undefined, {
            validatedClassEnabled: true,
            requiredClassEnabled: true
        });

        init(presentation, domServices);
        applyState(presentation, true, ValidationStatus.Valid, false, true);

        expect(element.classList.contains('jivs-validated')).toBe(true);
        expect(element.classList.contains('jivs-required')).toBe(true);
    });

    test('Lets instance options override global options', () => {
        let { presentation, element, domServices } = createPresentation({
            validatedClassEnabled: false,
            correctedClassEnabled: true
        }, {
            validatedClassEnabled: true,
            correctedClassEnabled: false,
            requiredClassEnabled: true
        });

        init(presentation, domServices);
        applyState(presentation, true, ValidationStatus.Valid, true, true);

        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-corrected')).toBe(true);
        expect(element.classList.contains('jivs-required')).toBe(true);
    });

    test('Adds variation classes after the persistent classes', () => {
        let { presentation, element, domServices } = createPresentation({
            variationClasses: ['emphasized', 'compact']
        });

        init(presentation, domServices);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-label emphasized compact'
        );
    });
});

// Labels remain compatible with generic HTML elements and show invalid state through the shared base behavior.
describe('LabelPresentation validation state', () => {
    test('Applies invalid styling to a non-label HTML element', () => {
        let element = document.createElement('span');
        let domServices = createMockJivsDomServices({
            options: {
                ...createMockJivsDomServices().options,
                label: {}
            } as JivsDomGlobalOptions
        });
        let presentation = new LabelPresentation(element);
        init(presentation, domServices);

        applyState(presentation, false, ValidationStatus.Invalid, false, false);

        expect(element.classList.contains('jivs-invalid')).toBe(true);
        expect(element.classList.contains('jivs-label')).toBe(true);
    });
});
