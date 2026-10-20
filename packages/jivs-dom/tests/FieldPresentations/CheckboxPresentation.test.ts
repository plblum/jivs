/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    CheckboxPresentation,
    defaultCheckboxPresentationName
} from '../../src/FieldPresentations/CheckboxPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: CheckboxPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Checkbox inputs receive the shared editor class and their checkbox-specific identity class.
describe('CheckboxPresentation CSS classes', () => {
    test('Adds the persistent checkbox-editor classes', () => {
        let element = document.createElement('input');
        element.type = 'checkbox';
        let presentation = new CheckboxPresentation(element);

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-checkbox'
        );
    });

    test('Adds variation classes after its persistent classes', () => {
        let element = document.createElement('input');
        element.type = 'checkbox';
        let presentation = new CheckboxPresentation(element, {
            variationClasses: 'toggle-control'
        });

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-checkbox toggle-control'
        );
    });
});

// The public name matches the name used to register the checkbox presentation.
describe('CheckboxPresentation default name', () => {
    test('Uses the checkboxEditor factory name', () => {
        expect(defaultCheckboxPresentationName).toBe('checkboxEditor');
    });
});
