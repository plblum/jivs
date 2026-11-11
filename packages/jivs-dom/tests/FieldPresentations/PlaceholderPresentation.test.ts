/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { PlaceholderPresentation, defaultPlaceholderPresentationName } from '../../src/FieldPresentations/PlaceholderPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initPresentation(presentation: PlaceholderPresentation, domServices: IJivsDomServices): void
{
    let valueHostsManager = {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
    presentation.init(valueHostsManager);
}

// PlaceholderPresentation adds its specific CSS marker alongside the shared editor and validity classes.
describe('PlaceholderPresentation persistent classes', () => {
    test('Adds the placeholder, editor, and validity presentation classes', () => {
        let element = document.createElement('span');
        let presentation = new PlaceholderPresentation(element);

        initPresentation(presentation, createMockJivsDomServices());

        expect(element.className).toBe('jivs-isvalidpresentation jivs-editor jivs-editor-placeholder');
    });

    test('Adds configured variation classes after the persistent classes', () => {
        let element = document.createElement('span');
        let presentation = new PlaceholderPresentation(element, {
            variationClasses: 'wide highlighted'
        });

        initPresentation(presentation, createMockJivsDomServices());

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-placeholder wide highlighted'
        );
    });
});

// Invalid validation state is always reflected on the placeholder, even when optional state classes are disabled.
describe('PlaceholderPresentation validation state', () => {
    test('Adds jivs-invalid when the field value host is invalid', () => {
        let element = document.createElement('span');
        let presentation = new PlaceholderPresentation(element);
        initPresentation(presentation, createMockJivsDomServices());
        let valueHost = {} as IFieldValueHost;
        let state = {
            isValid: false,
            status: ValidationStatus.Invalid,
            corrected: false
        } as ValueHostValidationState;

        presentation.apply(valueHost, state);

        expect(element.classList.contains('jivs-invalid')).toBe(true);
    });
});

// The exported name is the registration key used to select this companion presentation.
describe('PlaceholderPresentation registration name', () => {
    test('Exports the placeholder editor presentation name', () => {
        expect(defaultPlaceholderPresentationName).toBe('placeholderEditor');
    });
});
