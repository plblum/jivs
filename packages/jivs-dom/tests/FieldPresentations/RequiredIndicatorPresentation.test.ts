/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { RequiredIndicatorAriaStaticUpdater } from '../../src/Aria/RequiredIndicatorAriaStaticUpdater';
import {
    defaultRequiredIndicatorPresentationName,
    RequiredIndicatorPresentation,
    RequiredIndicatorPresentationOptions
} from '../../src/FieldPresentations/RequiredIndicatorPresentation';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface IExpandedGlobalOptions extends JivsDomGlobalOptions
{
    requiredIndicator: RequiredIndicatorPresentationOptions;
}

function createPresentation(
    options?: RequiredIndicatorPresentationOptions,
    globalOptions?: RequiredIndicatorPresentationOptions
): {
    presentation: RequiredIndicatorPresentation;
    element: HTMLElement;
    domServices: IJivsDomServices;
}
{
    let element = document.createElement('span');
    let domOptions = {
        ...createMockJivsDomServices().options,
        requiredIndicator: globalOptions ?? {}
    } as IExpandedGlobalOptions;
    let domServices = createMockJivsDomServices({ options: domOptions });
    let presentation = new RequiredIndicatorPresentation(element, options);

    return {
        presentation: presentation,
        element: element,
        domServices: domServices
    };
}

function init(
    presentation: RequiredIndicatorPresentation,
    domServices: IJivsDomServices
): void
{
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    presentation.init(valueHostsManager);
}

function applyState(
    presentation: RequiredIndicatorPresentation,
    required: boolean,
    isValid: boolean = true,
    status: ValidationStatus = ValidationStatus.Undetermined
): void
{
    let valueHost = { required: required } as IFieldValueHost;
    let state = {
        isValid: isValid,
        status: status,
        corrected: false
    } as ValueHostValidationState;
    presentation.apply(valueHost, state);
}

// A required indicator adds its role-specific persistent class and default factory name.
describe('RequiredIndicatorPresentation identity', () => {
    test('Adds the validity-base and indicator persistent classes', () => {
        let { presentation, element, domServices } = createPresentation();

        init(presentation, domServices);

        expect(element.className).toBe('jivs-isvalidpresentation jivs-indicator');
    });

    test('Uses the registered default presentation name', () => {
        expect(defaultRequiredIndicatorPresentationName).toBe('requiredIndicator');
    });
});

// The required-indicator role enables required-state styling by default and applies it only to required fields.
describe('RequiredIndicatorPresentation required state', () => {
    test('Adds jivs-required for a required field without requiring an opt-in option', () => {
        let { presentation, element, domServices } = createPresentation();
        init(presentation, domServices);

        applyState(presentation, true);

        expect(element.classList.contains('jivs-required')).toBe(true);
    });

    test('Does not add jivs-required for a field that is not required', () => {
        let { presentation, element, domServices } = createPresentation();
        init(presentation, domServices);

        applyState(presentation, false);

        expect(element.classList.contains('jivs-required')).toBe(false);
    });
});

// The presentation lets the role-specific global option group configure inherited validation styling.
describe('RequiredIndicatorPresentation options', () => {
    test('Uses required-indicator global options for optional validation classes', () => {
        let { presentation, element, domServices } = createPresentation(undefined, {
            validatedClassEnabled: true,
            correctedClassEnabled: true
        });
        init(presentation, domServices);

        applyState(presentation, true, true, ValidationStatus.Valid);

        expect(element.classList.contains('jivs-validated')).toBe(true);
        expect(element.classList.contains('jivs-required')).toBe(true);
    });

    test('Applies variation classes after its persistent classes', () => {
        let { presentation, element, domServices } = createPresentation({
            variationClasses: 'required-symbol visually-hidden'
        });
        init(presentation, domServices);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-indicator required-symbol visually-hidden'
        );
    });
});

// Required indicator markup is redundant to assistive technology when the editor provides required semantics.
describe('RequiredIndicatorPresentation static ARIA updater', () => {
    test('Supplies a RequiredIndicatorAriaStaticUpdater', () => {
        let { presentation } = createPresentation();

        expect(presentation.getStaticAriaUpdater()).toBeInstanceOf(
            RequiredIndicatorAriaStaticUpdater
        );
    });
});
