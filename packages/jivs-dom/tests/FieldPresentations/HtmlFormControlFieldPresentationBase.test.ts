/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    HtmlFormControlFieldPresentationBase,
    HtmlFormControlFieldPresentationBaseGlobalOptions,
    HtmlFormControlFieldPresentationBaseOptions
} from '../../src/FieldPresentations/HtmlFormControlFieldPresentationBase';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost } from '../TestSupport/mocks';

interface IExpandedGlobalOptions extends JivsDomGlobalOptions
{
    editor: HtmlFormControlFieldPresentationBaseGlobalOptions;
}

class TestHtmlFormControlFieldPresentation extends HtmlFormControlFieldPresentationBase<
    HtmlFormControlFieldPresentationBaseOptions,
    HTMLInputElement>
{
    public constructor(element: HTMLInputElement, options?: HtmlFormControlFieldPresentationBaseOptions)
    {
        super(element, options);
    }
}

function createValueHost(readOnly: boolean): IFieldValueHost
{
    return {
        ...createStubFieldValueHost('Field1'),
        readOnly: readOnly,
        required: false
    };
}

function createPresentation(
    options?: HtmlFormControlFieldPresentationBaseOptions,
    globalOptions?: HtmlFormControlFieldPresentationBaseGlobalOptions
): {
    presentation: TestHtmlFormControlFieldPresentation;
    element: HTMLInputElement;
    domServices: IJivsDomServices;
}
{
    let element = document.createElement('input');
    element.type = 'text';
    let presentation = new TestHtmlFormControlFieldPresentation(element, options);
    let domOptions = {
        ...createMockJivsDomServices().options,
        editor: globalOptions ?? {}
    } as IExpandedGlobalOptions;
    let domServices = createMockJivsDomServices({ options: domOptions });

    return {
        presentation: presentation,
        element: element,
        domServices: domServices
    };
}

function initialize(presentation: TestHtmlFormControlFieldPresentation, domServices: IJivsDomServices): void
{
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    presentation.init(valueHostsManager);
}

function applyReadOnlyState(
    presentation: TestHtmlFormControlFieldPresentation,
    readOnly: boolean
): void
{
    presentation.apply(
        createValueHost(readOnly),
        {
            isValid: true,
            status: ValidationStatus.Valid,
            corrected: false
        } as ValueHostValidationState
    );
}

// A read-only FieldValueHost makes a supported text input read-only, while a writable host leaves it editable.
describe('HtmlFormControlFieldPresentationBase read-only state', () => {
    test('Adds the readonly attribute when the FieldValueHost is read-only', () => {
        let { presentation, element, domServices } = createPresentation();
        initialize(presentation, domServices);

        applyReadOnlyState(presentation, true);

        expect(element.readOnly).toBe(true);
        expect(element.getAttribute('readonly')).toBe('true');
    });

    test('Does not add the readonly attribute when the FieldValueHost is writable', () => {
        let { presentation, element, domServices } = createPresentation();
        initialize(presentation, domServices);

        applyReadOnlyState(presentation, false);

        expect(element.readOnly).toBe(false);
        expect(element.hasAttribute('readonly')).toBe(false);
    });

    test('Leaves an existing readonly attribute unchanged when automatic read-only setup is disabled', () => {
        let { presentation, element, domServices } = createPresentation({ forceReadOnly: false });
        element.setAttribute('readonly', '');
        initialize(presentation, domServices);

        applyReadOnlyState(presentation, true);

        expect(element.hasAttribute('readonly')).toBe(true);
        expect(element.getAttribute('readonly')).toBe('');
    });
});

// The forceReadOnly option is resolved globally first and may be overridden for a specific presentation.
describe('HtmlFormControlFieldPresentationBase forceReadOnly options', () => {
    test('Uses the editor global option to enable read-only setup', () => {
        let { presentation, element, domServices } = createPresentation(undefined, {
            forceReadOnly: true
        });
        initialize(presentation, domServices);

        applyReadOnlyState(presentation, true);

        expect(element.readOnly).toBe(true);
    });

    test('An instance false overrides a true editor global option', () => {
        let { presentation, element, domServices } = createPresentation(
            { forceReadOnly: false },
            { forceReadOnly: true }
        );
        initialize(presentation, domServices);

        applyReadOnlyState(presentation, true);

        expect(element.readOnly).toBe(false);
        expect(element.hasAttribute('readonly')).toBe(false);
    });

    test('An instance true overrides a false editor global option', () => {
        let { presentation, element, domServices } = createPresentation(
            { forceReadOnly: true },
            { forceReadOnly: false }
        );
        initialize(presentation, domServices);

        applyReadOnlyState(presentation, true);

        expect(element.readOnly).toBe(true);
    });
});
