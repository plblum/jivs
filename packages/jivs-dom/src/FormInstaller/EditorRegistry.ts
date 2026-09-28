/**
 * Interface representing the element registry used by the FormInstaller.
 * 
 * @module jivs-dom/FormInstaller/ConcreteClasses/ElementRegistry
 */

import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { ElementRegistryRecord, IEditorElementRegistryRecord, IElementRegistry, IFieldAriaElementAnchors, IFieldElementRegistryRecord, IFormElementRegistryRecord } from '../Interfaces/ElementRegistry';
import { FieldPresentationInstallOptions } from '../Interfaces/FieldPresentations';
import { FormPresentationInstallOptions } from '../Interfaces/FormPresentations';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ElementRole } from '../Interfaces/Types';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';

/**
 * @inheritdoc jivs-dom/Types/ElementRegistry
 */
export class ElementRegistry implements IElementRegistry, Iterable<ElementRegistryRecord>
{
    constructor(valueHostsManager: IValueHostsManager)
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        this._valueHostsManager = valueHostsManager;
    }

    [Symbol.iterator](): Iterator<ElementRegistryRecord, any, any>
    {
        return this._records[Symbol.iterator]();
    }
    
    private _valueHostsManager: IValueHostsManager;
//#region storage    
    protected get records(): ElementRegistryRecord[]
    {
        return this._records;
    }
    private _records: ElementRegistryRecord[] = [];

    /**
     * Tracks each unique Element Identifier (case insensitive)
     * and its associated records. It exposes FieldValueHost
     * because it is essential for resolving field value hosts associated with each element identifier.
     * The list of associated records assist in optimized queries.
     */
    protected get entriesByElementIdentifier(): Map<string, ElementIdentifierRegistryEntry>
    {
        return this._entriesByElementIdentifier;
    } 
    private readonly _entriesByElementIdentifier = new Map<string, ElementIdentifierRegistryEntry>(); 
//#endregion storage    
    
    /**
     * Adds an editor element to the registry.
     * @param element 
     * @param elementIdentifier 
     * @param options 
     */
    public addEditor(element: IJivsDomElement, elementIdentifier: string,
        options?: EditorInstallOptions): void
    {
        let elIdeEntry = this.resolveElementIdentifierRegistryEntry(elementIdentifier);
        let record: ElementRegistryRecord = {
            kind: 'field',
            role: 'editor',
            elementIdentifier: elementIdentifier,
            fieldValueHost: elIdeEntry.fieldValueHost,   // may be null
            anchorElement: null, // provided later
            element: element,
            editorOptions: options || null,
        };
        this.records.push(record);
        elIdeEntry.records.push(record);
    }
    /**
     * Finds or creates the registry entry for the specified element identifier.
     * @param elementIdentifier 
     * @returns 
     */
    protected resolveElementIdentifierRegistryEntry(elementIdentifier: string): ElementIdentifierRegistryEntry
    {
        let elementIdentifierLC = elementIdentifier.toLowerCase();

        let entry = this._entriesByElementIdentifier.get(elementIdentifierLC);
        if (!entry)
        {
            // create a new entry if it doesn't exist
            const fieldValueHost = this._valueHostsManager.getFieldByElementIdentifier(elementIdentifier);
            entry = {
                fieldValueHost, // may be null
                records: []
            };
            this._entriesByElementIdentifier.set(elementIdentifierLC, entry);
        }
        return entry;
    }

    /**
     * Adds a field element to the registry. Use it for any field-related role
     * except editor.
     * @param element 
     * @param elementIdentifier 
     * @param role 
     * @param options 
     */
    public addField(element: IJivsDomElement, elementIdentifier: string, role: ElementRole | string,
        options?: FieldPresentationInstallOptions): void
    {
        let elIdeEntry = this.resolveElementIdentifierRegistryEntry(elementIdentifier);
        let record: ElementRegistryRecord = {
            kind: 'field',
            role: role,
            elementIdentifier: elementIdentifier,
            fieldValueHost: elIdeEntry.fieldValueHost,   // may be null
            element: element,
            presentationOptions: options || null,
        };
        this.records.push(record);
        elIdeEntry.records.push(record);
    }

    /**
     * Adds a form element to the registry. Use it for any form-related role.
     * @param element 
     * @param role 
     * @param options 
     */
    public addForm(element: IJivsDomElement, role: ElementRole | string,
        options?: FormPresentationInstallOptions): void
    {
        let record: IFormElementRegistryRecord = {
            kind: 'form',
            role: role,
            element: element,
            fieldValueHost: null,
            elementIdentifier: null,
            presentationOptions: options || null,
        };
        this.records.push(record);
    }
    
    /**
     * The consumer (FormInstaller) determines the value of 
     * IEditorElementRegistryRecord.anchorElement. 
     * This is used to assign that property.
     * @param record 
     * @param anchorElement 
     */
    public setEditorAnchorElement(record: IEditorElementRegistryRecord, anchorElement: IJivsDomElement): void
    {
        (record as any).anchorElement = anchorElement;
    }
    
    /**
     * Query designed for ITextValueDispatcher. 
     * Query uses role='editor' and elementIdentifier to locate the relevant editor elements.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the text value adapters 
     * for the specified element identifier. It may return an empty list.
     */
    public getTextValueAdapterElements(elementIdentifier: string): IJivsDomElement[]
    {
        // optimized query with entriesByElementIdentifier
        let elementIdentifierLC = elementIdentifier.toLowerCase();
        let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
        if (!entry) return [];
        let elements: IJivsDomElement[] = [];
        for (let record of entry.records) { // already kind='field'
                elements.push(record.element);
        }
        return elements;
    }

    /**
     * Query designed for IValueDispatcher.
     * Query uses role='editor' and elementIdentifier to locate the relevant elements.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the value adapters 
     * for the specified element identifier. It may return an empty list.
     */
    public getValueAdapterElements(elementIdentifier: string): IJivsDomElement[]
    {
        return this.getTextValueAdapterElements(elementIdentifier); // same!
    }

    /**
     * Query designed for IFieldValidationDispatcher.
     * Query uses kind='field' and elementIdentifier to locate the relevant elements.
     * Omits role='aria-error' which is a member of kind='field'.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the elements 
     * for the specified element identifier. It may return an empty list.
     */
    public getFieldPresentationElements(elementIdentifier: string): IJivsDomElement[]
    {
        // optimized query with entriesByElementIdentifier
        let elementIdentifierLC = elementIdentifier.toLowerCase();
        let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
        if (!entry) return [];
        let elements: IJivsDomElement[] = [];
        for (let record of entry.records) { // already kind='field'
            if (record.role !== ElementRole.ariaError) {
                elements.push(record.element);
            }
        }
        return elements;
    }

    /**
     * Query designed for IFormValidationDispatcher.
     * Query uses kind='form' to locate the relevant elements.
     * @returns An array of DOM elements corresponding to the elements.
     * It may return an empty list.
     */
    public getFormPresentationElements(): IJivsDomElement[]
    {
        let elements: IJivsDomElement[] = [];
        for (let record of this.records) {
            if (record.kind === 'form') {
                elements.push(record.element);
            }
        }
        return elements;
    }

    /**
     * Query designed to retrieve these specific roles for a field element
     * given a matching Element Identifier.
     * - editor
     * - either 'aria-error' or 'error'. If both exists, it always uses 'aria-error'. 
     * Both may not exist, and it will return null for the element property in that case.
     * @param elementIdentifier 
     */
    public getFieldAriaElementAnchors(elementIdentifier: string): IFieldAriaElementAnchors
    {
        let elementIdentifierLC = elementIdentifier.toLowerCase();
        let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
        let result: IFieldAriaElementAnchors = {
            editorAnchor: null,
            errorMessageElement: null,
            errorMessageRole: null
        };
        if (!entry) return result;
        for (let record of entry.records)
        {
            switch (record.role)
            {
                case ElementRole.ariaError:
                // will override any previous error message element if it exists
                    result.errorMessageElement = record.element;
                    result.errorMessageRole = ElementRole.ariaError;
                    break;
                case ElementRole.error:
                    if (!result.errorMessageRole)
                    {
                        result.errorMessageElement = record.element;
                        result.errorMessageRole = ElementRole.error;
                    }
                    break;
                case ElementRole.editor:
                    result.editorAnchor = record.element;
                    break;
            }
        }
        return result;

    }
    
    /**
     * Returns each unique FieldValueHost associated with the registered elements.
     */
    public getResolvedFieldValueHosts(): IFieldValueHost[]
    {
        let result: IFieldValueHost[] = [];
        for (let entry of this.entriesByElementIdentifier.values()) {
            if (entry.fieldValueHost) {
                result.push(entry.fieldValueHost);
            }
        }
        return result;
    }

    /**
     * Clears all registered elements from the registry.
     * It is aggressive in that it nulls references from the records 
     * to promote rapid garbage collection and memory cleanup.
     */
    public clear(): void
    {
        for (let entry of this.entriesByElementIdentifier.values())
        {
            (entry as any).records = null;
            (entry as any).fieldValueHost = null;
/* entry.records has the same instances as this.records, so nulling them here would be redundant.
            for (let record of entry.records)
            {
                (record as any).element = null;
                (record as any).fieldValueHost = null;
                (record as any).anchorElement = null;
            }
*/            
        }
        this.entriesByElementIdentifier.clear();
        
        for (let entry of this.records)
        {
            (entry as any).element = null;
            (entry as any).fieldValueHost = null;
            (entry as any).anchorElement = null;
        }
        this._records = [];
    }

    /**
     * Disposes of the element registry, releasing any resources and references it holds.
     * It is as aggressive as clear() in nulling references to 
     * promote rapid garbage collection and memory cleanup.
     */
    public dispose(): void
    {
        this.clear();
        (this.entriesByElementIdentifier as any) = null;
        (this.records as any) = null;
    }
}

/**
 * Internal data for ElementRegistry to maintain a map between
 * each Element Identifier and its associated records.
 */
interface ElementIdentifierRegistryEntry
{
    readonly fieldValueHost: IFieldValueHost | null;
    readonly records: (IEditorElementRegistryRecord | IFieldElementRegistryRecord)[];
}