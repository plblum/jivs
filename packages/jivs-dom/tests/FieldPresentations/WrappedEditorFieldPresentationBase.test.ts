/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    WrappedEditorFieldPresentationBase,
    WrappedEditorFieldPresentationBaseOptions
} from '../../src/FieldPresentations/WrappedEditorFieldPresentationBase';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface IExpandedGlobalOptions extends JivsDomGlobalOptions
{
    wrappedEditor: WrappedEditorFieldPresentationBaseOptions;
}

class TestWrappedEditorPresentation extends
    WrappedEditorFieldPresentationBase<WrappedEditorFieldPresentationBaseOptions>
{
    public constructor(element: HTMLElement, options?: WrappedEditorFieldPresentationBaseOptions)
    {
        super(element, options);
    }
}

function createPresentation(
    options?: WrappedEditorFieldPresentationBaseOptions,
    globalOptions?: WrappedEditorFieldPresentationBaseOptions
): {
    presentation: TestWrappedEditorPresentation;
    wrapper: HTMLElement;
    control: HTMLInputElement;
    domServices: IJivsDomServices;
}
{
    let wrapper = document.createElement('div');
    let control = document.createElement('input');
    control.type = 'text';
    wrapper.appendChild(control);

    let domOptions = {
        ...createMockJivsDomServices().options,
        wrappedEditor: globalOptions ?? {}
    } as IExpandedGlobalOptions;
    let domServices = createMockJivsDomServices({ options: domOptions });
    let presentation = new TestWrappedEditorPresentation(wrapper, options);

    return {
        presentation: presentation,
        wrapper: wrapper,
        control: control,
        domServices: domServices
    };
}

function initialize(
    presentation: TestWrappedEditorPresentation,
    domServices: IJivsDomServices
): void
{
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    presentation.init(valueHostsManager);
}

function applyState(
    presentation: TestWrappedEditorPresentation,
    required: boolean,
    isValid: boolean,
    status: ValidationStatus,
    corrected: boolean
): void
{
    presentation.apply(
        { required: required } as IFieldValueHost,
        {
            isValid: isValid,
            status: status,
            corrected: corrected
        } as ValueHostValidationState
    );
}

// The wrapper itself receives the persistent editor classes and variation classes, not its child control.
describe('WrappedEditorFieldPresentationBase wrapper styling', () => {
    test('Adds validity and wrapped-editor persistent classes to the wrapper', () => {
        let { presentation, wrapper, control, domServices } = createPresentation();

        initialize(presentation, domServices);

        expect(wrapper.className).toBe('jivs-isvalidpresentation jivs-wrapped-editor');
        expect(control.className).toBe('');
    });

    test('Adds variation classes to the wrapper after the persistent classes', () => {
        let { presentation, wrapper, control, domServices } = createPresentation({
            variationClasses: 'outlined padded'
        });

        initialize(presentation, domServices);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor outlined padded'
        );
        expect(control.className).toBe('');
    });

    test('Keeps the wrapper as the presentation target when applying validation state', () => {
        let { presentation, wrapper, control, domServices } = createPresentation();
        initialize(presentation, domServices);

        applyState(presentation, false, false, ValidationStatus.Invalid, false);

        expect(wrapper.classList.contains('jivs-invalid')).toBe(true);
        expect(control.classList.contains('jivs-invalid')).toBe(false);
    });
});

// Wrapped-editor options come from the wrappedEditor global group and instance values override them.
describe('WrappedEditorFieldPresentationBase options', () => {
    test('Uses global options to enable inherited validated and required classes', () => {
        let { presentation, wrapper, domServices } = createPresentation(undefined, {
            validatedClassEnabled: true,
            requiredClassEnabled: true
        });
        initialize(presentation, domServices);

        applyState(presentation, true, true, ValidationStatus.Valid, false);

        expect(wrapper.classList.contains('jivs-validated')).toBe(true);
        expect(wrapper.classList.contains('jivs-required')).toBe(true);
    });

    test('Lets instance options override wrapped-editor global options', () => {
        let { presentation, wrapper, domServices } = createPresentation({
            validatedClassEnabled: false,
            correctedClassEnabled: true
        }, {
            validatedClassEnabled: true,
            correctedClassEnabled: false,
            requiredClassEnabled: true
        });
        initialize(presentation, domServices);

        applyState(presentation, true, true, ValidationStatus.Valid, true);

        expect(wrapper.classList.contains('jivs-validated')).toBe(false);
        expect(wrapper.classList.contains('jivs-corrected')).toBe(true);
        expect(wrapper.classList.contains('jivs-required')).toBe(true);
    });
});
