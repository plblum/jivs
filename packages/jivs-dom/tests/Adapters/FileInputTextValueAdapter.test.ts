/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { FileInputTextValueAdapter } from '../../src/Adapters/FileInputTextValueAdapter';

/**
 * Creates a file input adapter with an optional associated Jivs element.
 * @param jivsElement - Defaults to null, which uses the input as the Jivs element.
 */
function setup(jivsElement: IJivsElement | null = null): {
    element: HTMLInputElement,
    testItem: FileInputTextValueAdapter
}
{
    let element = document.createElement('input');
    element.type = 'file';
    return {
        element: element,
        testItem: new FileInputTextValueAdapter(element, jivsElement)
    };
}

/**
 * Supplies selected File objects to jsdom, which does not provide a user-operated file picker in unit tests.
 * @param element - File input whose selected-files collection is being simulated.
 * @param files - File objects to expose as selected.
 */
function setSelectedFiles(element: HTMLInputElement, files: File[] | null): void
{
    Object.defineProperty(element, 'files', {
        configurable: true,
        value: files
    });
}

// FileInputTextValueAdapter requires an input element and preserves the associated Jivs element chosen by its caller.
describe('FileInputTextValueAdapter constructor', () => {
    test('Uses the input as its Jivs element when none is supplied', () => {
        let { element, testItem } = setup();

        expect(testItem.readTextValue()).toBe('');
        expect(element.type).toBe('file');
    });
    test('Accepts null as the associated Jivs element and uses the input as the fallback', () => {
        let element = document.createElement('input');
        element.type = 'file';
        let testItem = new FileInputTextValueAdapter(element, null);
        setSelectedFiles(element, [new File(['content'], 'report.txt')]);

        expect(testItem.readTextValue()).toBe('report.txt');
    });
    test('Rejects a null input element', () => {
        expect(() => new FileInputTextValueAdapter(null!)).toThrow(/element/);
    });
    test('Rejects an undefined input element', () => {
        expect(() => new FileInputTextValueAdapter(undefined!)).toThrow(/element/);
    });
    test('Reads files from the input while retaining a separate Jivs element', () => {
        let element = document.createElement('input');
        element.type = 'file';
        let jivsElement = document.createElement('section');
        let testItem = new FileInputTextValueAdapter(element, jivsElement);
        setSelectedFiles(element, [new File(['content'], 'selected.pdf')]);

        expect(testItem.readTextValue()).toBe('selected.pdf');
    });
});

// Reading exposes only selected file names, joined in order, and returns an empty string when no file is selected.
describe('FileInputTextValueAdapter.readTextValue', () => {
    test('Returns an empty string when the input has no selected files', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, []);

        expect(testItem.readTextValue()).toBe('');
    });
    test('Returns an empty string when the input files collection is null', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, null);

        expect(testItem.readTextValue()).toBe('');
    });
    test('Returns the selected file name when one file is selected', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, [new File(['pdf contents'], 'invoice.pdf')]);

        expect(testItem.readTextValue()).toBe('invoice.pdf');
    });
    test('Joins multiple selected file names with pipe characters in selection order', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, [
            new File(['first'], 'invoice.pdf'),
            new File(['second'], 'photo.png'),
            new File(['third'], 'report.docx')
        ]);

        expect(testItem.readTextValue()).toBe('invoice.pdf|photo.png|report.docx');
    });
    test('Does not return file contents or a local path', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, [new File(['private file contents'], 'document.txt')]);

        expect(testItem.readTextValue()).toBe('document.txt');
    });
});

// Writing is unsupported for security reasons, so calls must not change the user's selected files.
describe('FileInputTextValueAdapter.writeTextValue', () => {
    test('Leaves selected files unchanged when a text value is written', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, [
            new File(['first'], 'first.txt'),
            new File(['second'], 'second.txt')
        ]);

        testItem.writeTextValue('replacement.txt');

        expect(testItem.readTextValue()).toBe('first.txt|second.txt');
    });
    test('Leaves selected files unchanged when undefined is written', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, [new File(['existing'], 'existing.txt')]);

        testItem.writeTextValue(undefined);

        expect(testItem.readTextValue()).toBe('existing.txt');
    });
});

// Disposing the concrete adapter releases the element references inherited from AdapterBase.
describe('FileInputTextValueAdapter.dispose', () => {
    test('Reading after disposal fails while the unsupported write remains a safe no-op', () => {
        let { element, testItem } = setup();
        setSelectedFiles(element, [new File(['existing'], 'existing.txt')]);

        testItem.dispose();

        expect(() => testItem.readTextValue()).toThrow(TypeError);
        expect(() => testItem.writeTextValue('ignored.txt')).not.toThrow();
        expect(element.files?.[0].name).toBe('existing.txt');
    });
});
