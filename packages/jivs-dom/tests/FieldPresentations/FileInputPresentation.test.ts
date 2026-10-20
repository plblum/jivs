/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultFileInputPresentationName,
    FileInputPresentation
} from '../../src/FieldPresentations/FileInputPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: FileInputPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// File inputs receive the shared editor classes and their file-input-specific identity class.
describe('FileInputPresentation CSS classes', () => {
    test('Adds the persistent file-input classes', () => {
        let element = document.createElement('input');
        element.type = 'file';
        let presentation = new FileInputPresentation(element);

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-file-input'
        );
    });

    test('Adds variation classes after its persistent classes', () => {
        let element = document.createElement('input');
        element.type = 'file';
        let presentation = new FileInputPresentation(element, {
            variationClasses: ['attachment-control', 'wide']
        });

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-file-input attachment-control wide'
        );
    });
});

// The public name matches the name used to register the file-input presentation.
describe('FileInputPresentation default name', () => {
    test('Uses the fileInputEditor factory name', () => {
        expect(defaultFileInputPresentationName).toBe('fileInputEditor');
    });
});
