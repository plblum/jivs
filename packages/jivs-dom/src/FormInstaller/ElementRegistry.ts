/**
 * Interface representing the element registry used by the FormInstaller.
 * 
 * @module jivs-dom/FormInstaller/ConcreteClasses/ElementRegistry
 */

import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { EditorInstallOptions } from '../Interfaces/EditorInstaller';
import { ElementIdentifierRegistryEntry, ElementRegistryRecord, IEditorElementRegistryRecord, IElementRegistry, IFieldAriaElementInfo, IFormElementRegistryRecord } from '../Interfaces/ElementRegistry';
import { FieldPresentationInstallOptions } from '../Interfaces/FieldPresentations';
import { FormPresentationInstallOptions } from '../Interfaces/FormPresentations';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { ElementRole } from '../Interfaces/Types';

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

    /**
     * A secondary mapping used to report attempts at adding duplicate element instances
     * and to find by element itself.
     */
    protected get elementsToRecords(): Map<IJivsElement, ElementRegistryRecord>
    {
        return this._elementsToRecords;
    }
    private _elementsToRecords = new Map<IJivsElement, ElementRegistryRecord>();
//#endregion storage    
    
    /**
     * Adds an editor element to the registry.
     * @param element 
     * @param elementIdentifier 
     * @param options 
     */
    public addEditor(element: IJivsElement, elementIdentifier: string,
        options?: EditorInstallOptions): void
    {
        this.ensureUniqueElement(element);
        let elIdeEntry = this.resolveElementIdentifierRegistryEntry(elementIdentifier);
        let record: ElementRegistryRecord = {
            kind: 'field',
            role: 'editor',
            elementIdentifier: elementIdentifier,
            fieldValueHost: elIdeEntry.fieldValueHost,   // may be null
            jivsElement: null, // provided later
            element: element,
            editorOptions: options || null,
        };
        this.records.push(record);
        elIdeEntry.records.push(record);
        this.elementsToRecords.set(element, record);
    }
    private ensureUniqueElement(element: IJivsElement): void
    {
        if (this._elementsToRecords.has(element))
        {
            const id = element.id || '<no id>';
            throw new Error(`Duplicate element instance detected. ID: '${id}'`);
        }
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
    public addField(element: IJivsElement, elementIdentifier: string, role: ElementRole | string,
        options?: FieldPresentationInstallOptions): void
    {
        this.ensureUniqueElement(element);
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
        this.elementsToRecords.set(element, record);
    }

    /**
     * Adds a form element to the registry. Use it for any form-related role.
     * @param element 
     * @param role 
     * @param options 
     */
    public addForm(element: IJivsElement, role: ElementRole | string,
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
        this.ensureUniqueElement(element);
        this.records.push(record);
        this.elementsToRecords.set(element, record);
    }
    
    /**
     * The consumer (FormInstaller) determines the value of 
     * IEditorElementRegistryRecord.jivsElement. 
     * This is used to assign that property.
     * @param record 
     * @param jivsElement 
     */
    public setEditorJivsElement(record: IEditorElementRegistryRecord, jivsElement: IJivsElement): void
    {
        (record as any).jivsElement = jivsElement;
    }
    
    /**
     * Query designed for ITextValueDispatcher. 
     * Query uses role='editor' and elementIdentifier to locate the relevant editor elements.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the text value adapters 
     * for the specified element identifier. It may return an empty list.
     */
    public getTextValueAdapterElements(elementIdentifier: string): IJivsElement[]
    {
        // optimized query with entriesByElementIdentifier
        let elementIdentifierLC = elementIdentifier.toLowerCase();
        let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
        if (!entry) return [];
        let elements: IJivsElement[] = [];
        for (let record of entry.records) // already kind='field'
        {
            if (record.element.jivsTextValueAdapter)
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
    public getValueAdapterElements(elementIdentifier: string): IJivsElement[]
    {
        // optimized query with entriesByElementIdentifier
        let elementIdentifierLC = elementIdentifier.toLowerCase();
        let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
        if (!entry) return [];
        let elements: IJivsElement[] = [];
        for (let record of entry.records) // already kind='field'
        {
            if (record.element.jivsValueAdapter)
                elements.push(record.element);
        }
        return elements;
    }

    /**
     * Query designed for IFieldValidationDispatcher.
     * Query uses kind='field' and elementIdentifier to locate the relevant elements.
     * Omits role='aria-error' which is a member of kind='field'.
     * @param elementIdentifier 
     * @returns An array of DOM elements corresponding to the elements 
     * for the specified element identifier. It may return an empty list.
     */
    public getFieldPresentationElements(elementIdentifier: string): IJivsElement[]
    {
        // optimized query with entriesByElementIdentifier
        let elementIdentifierLC = elementIdentifier.toLowerCase();
        let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
        if (!entry) return [];
        let elements: IJivsElement[] = [];
        for (let record of entry.records) { // already kind='field'
            elements.push(record.element);
        }
        return elements;
    }

    /**
     * Query designed for IFormValidationDispatcher.
     * Query uses kind='form' to locate the relevant elements.
     * @returns An array of DOM elements corresponding to the elements.
     * It may return an empty list.
     */
    public getFormPresentationElements(): IJivsElement[]
    {
        let elements: IJivsElement[] = [];
        for (let record of this.records) {
            if (record.kind === 'form') {
                elements.push(record.element);
            }
        }
        return elements;
    }
    
    /**
     * General purpose query applying a required role and optional element identifier filter.
     * @param role The role to filter elements by.
     * @param elementIdentifier The optional element identifier to further filter elements by. If null, all elements with the specified role are returned.
     * @returns An array of DOM elements corresponding to the specified role and optional element identifier. It may return an empty list.
     */
    public getElementsByRole(role: ElementRole | string, elementIdentifier: string | null): IJivsElement[]
    {
        let elements: IJivsElement[] = [];
        if (elementIdentifier) {
            let elementIdentifierLC = elementIdentifier.toLowerCase();
            let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
            if (!entry) return [];
            for (let record of entry.records) {
                if (record.role === role) {
                    elements.push(record.element);
                }
            }
        } else {
            for (let record of this.records) {
                if (record.role === role) {
                    elements.push(record.element);
                }
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
    public getFieldAriaElementInfo(elementIdentifier: string): IFieldAriaElementInfo
    {
        let elementIdentifierLC = elementIdentifier.toLowerCase();
        let entry = this.entriesByElementIdentifier.get(elementIdentifierLC);
        let result: IFieldAriaElementInfo = {
            editorJivsElement: null,
            errorMessageElement: null,
            errorMessageRole: null,
            elementIdentifier: elementIdentifier,
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
                    result.editorJivsElement = (<IEditorElementRegistryRecord>record).jivsElement;
                    break;
            }
        }
        return result;
    }
    
    /**
     * Returns each unique Element Identifier associated with the registered elements
     * so long as they have a matching FieldValueHost.
     */
    public getResolvedElementIdentifiers(): ElementIdentifierRegistryEntry[]
    {
        let result: ElementIdentifierRegistryEntry[] = [];
        for (let entry of this.entriesByElementIdentifier.values()) {
            if (entry.fieldValueHost) {
                result.push(entry);
            }
        }
        return result;
    }

    /**
     * Retrieves the registry record for the specified element.
     * @param element The IJivsElement for which to retrieve the registry record.
     * @returns The ElementRegistryRecord associated with the element, or null if none exists.
     */
    public getRecordForElement(element: IJivsElement): ElementRegistryRecord | null
    {
        return this.elementsToRecords.get(element) || null;
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
                (record as any).jivsElement = null;
            }
*/            
        }
        this.entriesByElementIdentifier.clear();
        
        for (let entry of this.records)
        {
            (entry as any).element = null;
            (entry as any).fieldValueHost = null;
            (entry as any).jivsElement = null;
        }
        this._records = [];
        this._elementsToRecords.clear();
    }

    /**
     * Disposes of the element registry, releasing any resources and references it holds.
     * It is as aggressive as clear() in nulling references to 
     * promote rapid garbage collection and memory cleanup.
     */
    public dispose(): void
    {
        this.clear();

        (this._entriesByElementIdentifier as any) = null;
        (this._records as any) = null;
        (this._elementsToRecords as any) = null;
    }
}