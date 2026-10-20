/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultTextAreaPresentationName,
    TextAreaPresentation
} from '../../src/FieldPresentations/TextAreaPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: TextAreaPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Textareas receive shared editor classes plus their textarea-specific identity class.
describe('TextAreaPresentation CSS classes', () => {
    test('Adds the persistent textarea-editor classes', () => {
        let element = document.createElement('textarea');
        let presentation = new TextAreaPresentation(element);

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-textarea'
        );
    });

    test('Adds variation classes after its persistent classes', () => {
        let element = document.createElement('textarea');
        let presentation = new TextAreaPresentation(element, {
            variationClasses: ['multiline', 'wide']
        });

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-textarea multiline wide'
        );
    });
});

// The public name matches the name used to register the textarea presentation.
describe('TextAreaPresentation default name', () => {
    test('Uses the textareaEditor factory name', () => {
        expect(defaultTextAreaPresentationName).toBe('textareaEditor');
    });
});
