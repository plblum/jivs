/** @jest-environment jsdom */
import type { IFieldPresentation } from '../../src/Interfaces/FieldPresentations';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IPresentationFactory } from '../../src/Interfaces/Presentations_common';
import { ElementRole } from '../../src/Interfaces/Types';
import { CheckboxPresentation, defaultCheckboxPresentationName } from '../../src/FieldPresentations/CheckboxPresentation';
import { FieldContainerPresentation, defaultFieldContainerPresentationName } from '../../src/FieldPresentations/FieldContainerPresentation';
import { FieldPresentationFactory } from '../../src/FieldPresentations/FieldPresentationFactory';
import { FileInputPresentation, defaultFileInputPresentationName } from '../../src/FieldPresentations/FileInputPresentation';
import { LabelPresentation, defaultLabelPresentationName } from '../../src/FieldPresentations/LabelPresentation';
import { RadioButtonsPresentation, defaultRadioButtonsPresentationName } from '../../src/FieldPresentations/RadioButtonsPresentation';
import { RequiredIndicatorPresentation, defaultRequiredIndicatorPresentationName } from '../../src/FieldPresentations/RequiredIndicatorPresentation';
import { SelectPresentation, defaultSelectPresentationName } from '../../src/FieldPresentations/SelectPresentation';
import { TextAreaPresentation, defaultTextAreaPresentationName } from '../../src/FieldPresentations/TextAreaPresentation';
import { TextInputPresentation, defaultTextInputPresentationName } from '../../src/FieldPresentations/TextInputPresentation';
import { WrappedCheckboxPresentation, defaultWrappedCheckboxPresentationName } from '../../src/FieldPresentations/WrappedCheckboxPresentation';
import { WrappedFileInputPresentation, defaultWrappedFileInputPresentationName } from '../../src/FieldPresentations/WrappedFileInputPresentation';
import { WrappedRadioButtonsPresentation, defaultWrappedRadioButtonsPresentationName } from '../../src/FieldPresentations/WrappedRadioButtonsPresentation';
import { WrappedSelectPresentation, defaultWrappedSelectPresentationName } from '../../src/FieldPresentations/WrappedSelectPresentation';
import { WrappedTextAreaPresentation, defaultWrappedTextAreaPresentationName } from '../../src/FieldPresentations/WrappedTextAreaPresentation';
import { WrappedTextInputPresentation, defaultWrappedTextInputPresentationName } from '../../src/FieldPresentations/WrappedTextInputPresentation';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface IRegistrationExpectation
{
    name: string;
    verify: (presentation: IFieldPresentation) => void;
}

function setup(): {
    domServices: IJivsDomServices,
    factory: FieldPresentationFactory
}
{
    let domServices = createMockJivsDomServices();
    return {
        domServices: domServices,
        factory: new FieldPresentationFactory(domServices)
    };
}

function createElement(): HTMLElement
{
    return document.createElement('div');
}

// The factory's built-in registrations resolve each documented name to its matching presentation class.
describe('FieldPresentationFactory built-in registrations', () => {
    test('Creates each registered field presentation type', () => {
        let { factory } = setup();
        let registrations: IRegistrationExpectation[] = [
            { name: defaultTextInputPresentationName, verify: value => expect(value).toBeInstanceOf(TextInputPresentation) },
            { name: defaultCheckboxPresentationName, verify: value => expect(value).toBeInstanceOf(CheckboxPresentation) },
            { name: defaultRadioButtonsPresentationName, verify: value => expect(value).toBeInstanceOf(RadioButtonsPresentation) },
            { name: defaultSelectPresentationName, verify: value => expect(value).toBeInstanceOf(SelectPresentation) },
            { name: defaultTextAreaPresentationName, verify: value => expect(value).toBeInstanceOf(TextAreaPresentation) },
            { name: defaultFileInputPresentationName, verify: value => expect(value).toBeInstanceOf(FileInputPresentation) },
            { name: defaultWrappedTextInputPresentationName, verify: value => expect(value).toBeInstanceOf(WrappedTextInputPresentation) },
            { name: defaultWrappedCheckboxPresentationName, verify: value => expect(value).toBeInstanceOf(WrappedCheckboxPresentation) },
            { name: defaultWrappedRadioButtonsPresentationName, verify: value => expect(value).toBeInstanceOf(WrappedRadioButtonsPresentation) },
            { name: defaultWrappedSelectPresentationName, verify: value => expect(value).toBeInstanceOf(WrappedSelectPresentation) },
            { name: defaultWrappedTextAreaPresentationName, verify: value => expect(value).toBeInstanceOf(WrappedTextAreaPresentation) },
            { name: defaultWrappedFileInputPresentationName, verify: value => expect(value).toBeInstanceOf(WrappedFileInputPresentation) },
            { name: defaultLabelPresentationName, verify: value => expect(value).toBeInstanceOf(LabelPresentation) },
            { name: defaultRequiredIndicatorPresentationName, verify: value => expect(value).toBeInstanceOf(RequiredIndicatorPresentation) },
            { name: defaultFieldContainerPresentationName, verify: value => expect(value).toBeInstanceOf(FieldContainerPresentation) }
        ];

        for (let registration of registrations)
            registration.verify(factory.create(createElement(), ElementRole.editor, registration.name));
    });
});

// Role defaults provide the expected fallback for editors, labels, required indicators, and field containers.
describe('FieldPresentationFactory role defaults', () => {
    test('Creates the expected presentation when only the element role is supplied', () => {
        let { factory } = setup();

        expect(factory.create(createElement(), ElementRole.editor)).toBeInstanceOf(TextInputPresentation);
        expect(factory.create(createElement(), ElementRole.label)).toBeInstanceOf(LabelPresentation);
        expect(factory.create(createElement(), ElementRole.required)).toBeInstanceOf(RequiredIndicatorPresentation);
        expect(factory.create(createElement(), ElementRole.container)).toBeInstanceOf(FieldContainerPresentation);
    });
});

// Custom lazy registrations can retain all built-ins and replace a built-in name when registered last.
describe('FieldPresentationFactory custom registrations', () => {
    test('Allows a custom presentation to override a built-in registration', () => {
        let { factory } = setup();
        let customElement = createElement();
        let customCreator = (element: HTMLElement): IFieldPresentation => {
            expect(element).toBe(customElement);
            return new LabelPresentation(element);
        };
        factory.lazyRegistration(registrationFactory => {
            factory.defaultFactoryRegistrations(registrationFactory);
            registrationFactory.register(defaultTextInputPresentationName, customCreator);
        });

        expect(factory.create(customElement, ElementRole.editor, defaultTextInputPresentationName))
            .toBeInstanceOf(LabelPresentation);
        expect(factory.create(createElement(), ElementRole.label)).toBeInstanceOf(LabelPresentation);
    });
});
