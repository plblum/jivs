/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultRadioButtonsPresentationName,
    RadioButtonsPresentation
} from '../../src/FieldPresentations/RadioButtonsPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function createDomServices(): IJivsDomServices
{
    return createMockJivsDomServices();
}

function initialize(
    presentation: RadioButtonsPresentation,
    domServices: IJivsDomServices
): void
{
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

function applyState(
    presentation: RadioButtonsPresentation,
    isValid: boolean
): void
{
    presentation.apply(
        { required: false } as IFieldValueHost,
        {
            isValid: isValid,
            status: ValidationStatus.Invalid,
            corrected: false
        } as ValueHostValidationState
    );
}

function createRadio(name: string, classes: string[] = []): HTMLInputElement
{
    let radioButton = document.createElement('input');
    radioButton.type = 'radio';
    radioButton.name = name;
    radioButton.classList.add(...classes);
    return radioButton;
}

// Radio-button presentations add the standard editor classes and their radio-group class.
describe('RadioButtonsPresentation CSS classes', () => {
    test('Adds persistent and variation classes to the supplied radio button', () => {
        let radioButton = createRadio('contact');
        let presentation = new RadioButtonsPresentation(radioButton, {
            variationClasses: 'choice-control'
        });
        initialize(presentation, createDomServices());

        expect(radioButton.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-radiobuttons choice-control'
        );
    });

    test('Uses the radio-buttons editor factory name', () => {
        expect(defaultRadioButtonsPresentationName).toBe('radiobuttonsEditor');
    });
});

// Validation updates affect only radio inputs with the same name under the same parent.
describe('RadioButtonsPresentation group state', () => {
    test('Applies invalid state across matching radios without changing other groups', () => {
        let parent = document.createElement('div');
        let first = createRadio('contact', ['preserve-first']);
        let second = createRadio('contact', ['preserve-second']);
        let anotherGroup = createRadio('delivery', ['preserve-other']);
        let nonRadio = document.createElement('input');
        nonRadio.type = 'checkbox';
        nonRadio.name = 'contact';
        parent.append(first, second, anotherGroup, nonRadio);
        let presentation = new RadioButtonsPresentation(first);
        initialize(presentation, createDomServices());

        applyState(presentation, false);

        expect(first.classList.contains('jivs-invalid')).toBe(true);
        expect(second.classList.contains('jivs-invalid')).toBe(true);
        expect(first.classList.contains('preserve-first')).toBe(true);
        expect(second.classList.contains('preserve-second')).toBe(true);
        expect(anotherGroup.classList.contains('jivs-invalid')).toBe(false);
        expect(nonRadio.classList.contains('jivs-invalid')).toBe(false);
    });

    test('Removes invalid state from all radios in the group when the field becomes valid', () => {
        let parent = document.createElement('div');
        let first = createRadio('contact', ['jivs-invalid']);
        let second = createRadio('contact', ['jivs-invalid']);
        parent.append(first, second);
        let presentation = new RadioButtonsPresentation(first);
        initialize(presentation, createDomServices());

        applyState(presentation, true);

        expect(first.classList.contains('jivs-invalid')).toBe(false);
        expect(second.classList.contains('jivs-invalid')).toBe(false);
    });

    test('Does nothing when the presentation radio has no name', () => {
        let parent = document.createElement('div');
        let radioButton = createRadio('');
        let sibling = createRadio('contact');
        parent.append(radioButton, sibling);
        let presentation = new RadioButtonsPresentation(radioButton);
        initialize(presentation, createDomServices());

        applyState(presentation, false);

        expect(radioButton.classList.contains('jivs-invalid')).toBe(false);
        expect(sibling.classList.contains('jivs-invalid')).toBe(false);
    });

    test('Does nothing when the named radio is detached from a parent', () => {
        let radioButton = createRadio('contact');
        let presentation = new RadioButtonsPresentation(radioButton);
        initialize(presentation, createDomServices());

        applyState(presentation, false);

        expect(radioButton.classList.contains('jivs-invalid')).toBe(false);
    });

    test('Does not apply optional validated, corrected, or required classes by default', () => {
        let parent = document.createElement('div');
        let first = createRadio('contact');
        let second = createRadio('contact');
        parent.append(first, second);
        let presentation = new RadioButtonsPresentation(first);
        initialize(presentation, createDomServices());

        presentation.apply(
            { required: true } as IFieldValueHost,
            {
                isValid: true,
                status: ValidationStatus.Valid,
                corrected: true
            } as ValueHostValidationState
        );

        for (let radioButton of [first, second])
        {
            expect(radioButton.classList.contains('jivs-invalid')).toBe(false);
            expect(radioButton.classList.contains('jivs-validated')).toBe(false);
            expect(radioButton.classList.contains('jivs-corrected')).toBe(false);
            expect(radioButton.classList.contains('jivs-required')).toBe(false);
        }
    });
});
