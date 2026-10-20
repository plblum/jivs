/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultSelectPresentationName,
    SelectPresentation
} from '../../src/FieldPresentations/SelectPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: SelectPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Select elements receive shared editor classes plus the select-specific identity class.
describe('SelectPresentation CSS classes', () => {
    test('Adds the persistent select-editor classes', () => {
        let element = document.createElement('select');
        let presentation = new SelectPresentation(element);

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-select'
        );
    });

    test('Adds variation classes after its persistent classes', () => {
        let element = document.createElement('select');
        let presentation = new SelectPresentation(element, {
            variationClasses: 'compact'
        });

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-select compact'
        );
    });
});

// The public name matches the name used to register the select presentation.
describe('SelectPresentation default name', () => {
    test('Uses the selectEditor factory name', () => {
        expect(defaultSelectPresentationName).toBe('selectEditor');
    });
});
