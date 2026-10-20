/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultFieldContainerPresentationName,
    FieldContainerPresentation,
    FieldContainerPresentationOptions
} from '../../src/FieldPresentations/FieldContainerPresentation';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface IExpandedGlobalOptions extends JivsDomGlobalOptions
{
    fieldContainer: FieldContainerPresentationOptions;
}

function createPresentation(
    options?: FieldContainerPresentationOptions,
    globalOptions?: FieldContainerPresentationOptions
): {
    presentation: FieldContainerPresentation;
    element: HTMLElement;
    domServices: IJivsDomServices;
}
{
    let element = document.createElement('div');
    let domOptions = {
        ...createMockJivsDomServices().options,
        fieldContainer: globalOptions ?? {}
    } as IExpandedGlobalOptions;
    let domServices = createMockJivsDomServices({ options: domOptions });
    let presentation = new FieldContainerPresentation(element, options);

    return {
        presentation: presentation,
        element: element,
        domServices: domServices
    };
}

function init(
    presentation: FieldContainerPresentation,
    domServices: IJivsDomServices
): void
{
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    presentation.init(valueHostsManager);
}

function applyState(
    presentation: FieldContainerPresentation,
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

// The concrete container presentation identifies its role with persistent CSS classes and factory name.
describe('FieldContainerPresentation identity', () => {
    test('Adds both the validity-base and field-container persistent classes', () => {
        let { presentation, element, domServices } = createPresentation();

        init(presentation, domServices);

        expect(element.className).toBe('jivs-isvalidpresentation jivs-fieldcontainer');
    });

    test('Uses the registered default presentation name', () => {
        expect(defaultFieldContainerPresentationName).toBe('fieldContainer');
    });
});

// Global and instance settings control the inherited optional validation classes using normal precedence.
describe('FieldContainerPresentation options', () => {
    test('Enables inherited state classes from global options', () => {
        let { presentation, element, domServices } = createPresentation(undefined, {
            validatedClassEnabled: true,
            correctedClassEnabled: true,
            requiredClassEnabled: true
        });

        init(presentation, domServices);
        applyState(presentation, true, ValidationStatus.Valid, false, true);

        expect(element.classList.contains('jivs-validated')).toBe(true);
        expect(element.classList.contains('jivs-required')).toBe(true);
    });

    test('Lets instance settings override the corresponding global state-class setting', () => {
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

    test('Applies variation classes after persistent classes', () => {
        let { presentation, element, domServices } = createPresentation({
            variationClasses: 'compact framed'
        });

        init(presentation, domServices);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-fieldcontainer compact framed'
        );
    });
});

// The field container presents invalid state and does not require a particular HTML element type.
describe('FieldContainerPresentation validation state', () => {
    test('Applies invalid styling on a generic container element', () => {
        let { presentation, element, domServices } = createPresentation();
        init(presentation, domServices);

        applyState(presentation, false, ValidationStatus.Invalid, false, false);

        expect(element.classList.contains('jivs-invalid')).toBe(true);
    });
});
