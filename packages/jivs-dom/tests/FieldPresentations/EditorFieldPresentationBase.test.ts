/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    EditorFieldPresentationBase,
    EditorFieldPresentationBaseOptions
} from '../../src/FieldPresentations/EditorFieldPresentationBase';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface IExpandedGlobalOptions extends JivsDomGlobalOptions
{
    editor: EditorFieldPresentationBaseOptions;
}

class TestEditorFieldPresentation extends EditorFieldPresentationBase<EditorFieldPresentationBaseOptions>
{
    public constructor(element: HTMLElement, options?: EditorFieldPresentationBaseOptions)
    {
        super(element, options);
    }

    public override apply(_valueHost: IFieldValueHost, _state: ValueHostValidationState): void
    {
        super.apply(_valueHost, _state);
    }

    public get publicify_options(): EditorFieldPresentationBaseOptions
    {
        return this.options;
    }
}

function createPresentation(
    element: HTMLElement,
    options?: EditorFieldPresentationBaseOptions,
    globalOptions?: EditorFieldPresentationBaseOptions
): {
    presentation: TestEditorFieldPresentation;
    domServices: IJivsDomServices;
}
{
    let domOptions = {
        ...createMockJivsDomServices().options,
        editor: globalOptions ?? {}
    } as IExpandedGlobalOptions;
    let domServices = createMockJivsDomServices({ options: domOptions });
    let presentation = new TestEditorFieldPresentation(element, options);

    return {
        presentation: presentation,
        domServices: domServices
    };
}

function init(
    presentation: TestEditorFieldPresentation,
    domServices: IJivsDomServices
): void
{
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    presentation.init(valueHostsManager);
}

// Editor presentations contribute the standard persistent editor class to the bound element.
describe('EditorFieldPresentationBase persistent classes', () => {
    test('Adds editor and validity-base classes to a generic HTML element', () => {
        let element = document.createElement('div');
        let { presentation, domServices } = createPresentation(element);

        init(presentation, domServices);

        expect(element.className).toBe('jivs-isvalidpresentation jivs-editor');
    });

    test('Applies variation classes after persistent classes', () => {
        let element = document.createElement('input');
        let { presentation, domServices } = createPresentation(
            element,
            { variationClasses: 'wide highlighted' }
        );

        init(presentation, domServices);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor wide highlighted'
        );
    });
});

// Editor-specific global settings configure inherited validation classes and instance settings take precedence.
describe('EditorFieldPresentationBase options', () => {
    test('Reads optional state-class settings from the editor global options group', () => {
        let element = document.createElement('input');
        let { presentation, domServices } = createPresentation(element, undefined, {
            validatedClassEnabled: true,
            requiredClassEnabled: true
        });

        init(presentation, domServices);
        expect(presentation.publicify_options.validatedClassEnabled).toBe(true);
        expect(presentation.publicify_options.requiredClassEnabled).toBe(true);
        presentation.apply(
            { required: true } as IFieldValueHost,
            {
                isValid: true,
                status: ValidationStatus.Valid,
                corrected: false
            } as ValueHostValidationState
        );

        expect(element.classList.contains('jivs-validated')).toBe(true);
        expect(element.classList.contains('jivs-required')).toBe(true);
    });

    test('Lets instance options override editor global options', () => {
        let element = document.createElement('input');
        let { presentation, domServices } = createPresentation(element, {
            validatedClassEnabled: false,
            correctedClassEnabled: true
        }, {
            validatedClassEnabled: true,
            correctedClassEnabled: false,
            requiredClassEnabled: true
        });

        init(presentation, domServices);
        expect(presentation.publicify_options.validatedClassEnabled).toBe(false);
        expect(presentation.publicify_options.correctedClassEnabled).toBe(true);
        presentation.apply(
            { required: true } as IFieldValueHost,
            {
                isValid: true,
                status: ValidationStatus.Valid,
                corrected: true
            } as ValueHostValidationState
        );

        expect(element.classList.contains('jivs-validated')).toBe(false);
        expect(element.classList.contains('jivs-corrected')).toBe(true);
        expect(element.classList.contains('jivs-required')).toBe(true);
    });
});
