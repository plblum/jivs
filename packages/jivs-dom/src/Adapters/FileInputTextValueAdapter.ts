/**
 * Adapter for HTML input elements using type='file'.
 * 
 * @module jivs-dom/Adapters/ConcreteClasses/FileInputTextValueAdapter
 */

import { DomTextValueAdapterBase } from './DomTextValueAdapterBase';

/**
 * Adapter for HTML input elements using type='file'.
 * This type of input is unusual. Its value is mostly representing something a file path
 * and its often not exposed to the browser.
 * Its files property contains the list of selected files.
 * We will return a string containing the names of the selected files, separated by '|'.
 * For example: "invoice.pdf|photo.png|report.docx"
 * RequireText and RegExp validators are best suited for this type of input.
 * The actual contents of the files should be handled separately, not through this adapter.
 * 
 * There is no ability to write to its value.
 * 
 * Exposed by the FileInputEditorAdapterDefinition.
 */
export class FileInputTextValueAdapter
    extends DomTextValueAdapterBase<HTMLInputElement>
{

    /**
     * @returns A pipe delimited string of filenames with extensions, or an empty string if no files are selected.
     */
    public readTextValue(): string
    {
        // If no files are selected, return an empty string (fails 'required' validation)
        const files = this.element.files;
        if (!files || files.length === 0)
        {
            return "";
        }

        // Map to just the file names and join them
        // Example output: "invoice.pdf|photo.png|report.docx"
        return Array.from(files)
            .map(file => file.name)
            .join('|');
    }

    public writeTextValue(textValue: string | undefined): void
    {
        // not supported
    }
}