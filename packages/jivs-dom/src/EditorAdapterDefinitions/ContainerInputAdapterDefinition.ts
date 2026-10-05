/**
 * Provides an editor adapter definition for HTML input type='text' elements within a container tag.
 * 
 * @module jivs-dom/EditorAdapterDefinitions/ConcreteClasses/ContainerInputAdapterDefinition
 */

import { defaultContainerTextInputPresentationName } from '../FieldPresentations/ContainerTextInputPresentation';
import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { ContainerEditorAdapterDefinitionBase } from './ContainerEditorAdapterDefinitionBase';
import { InputAdapterDefinition } from './InputAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML input elements of a specific type
 * within a container tag.
 * It does not support type=radio or type=file. Those have other AdapterDefinitions.
 * 
 * Expects the following HTML structure:
 * 
 * ```html
 * <div class="container">      <!-- this is the anchor -- >
 *     <!-- there can be multiple containing elements around the input -->
 *     <input type="text" class="editor" />     <!-- the editor element -->
 * </div>
 * ```
 * Subclass to introduce the containerSelector value to ensure the container is optimally identified.
 */
export class ContainerInputAdapterDefinition extends ContainerEditorAdapterDefinitionBase
{
    /**
     * Creates an editor adapter definition for HTML input elements of a specific type within a container tag.
     *
     * @param inputType The type attribute value of the input element this adapter supports.
     * @param adapterKey Uniquely identifies this definition in the factory.
     * @param priority Determines matching order within the factory where 0 is highest and 100 is lowest.
     * @param containerSelector CSS selector used to identify the container element.
     * @param recommendedFieldPresentationName Optional presentation name used by default.
     */
    public constructor(inputType: string, adapterKey?: string, priority: number = 80,
        containerSelector?: string | null, recommendedFieldPresentationName?: string | null)
    {
        const normalizedInputType = inputType.toLowerCase();

        super(
            adapterKey ??
            getContainerInputAdapterKey(normalizedInputType),
            priority,
            containerSelector,
            recommendedFieldPresentationName
        );

        this._inputType = normalizedInputType;
    }
    /**
     * Supports inputs with this value for its type attribute.
     * Always lowercase, enforced by the constructor.
     */
    protected get inputType(): string
    {
        return this._inputType;
    }
    private readonly _inputType: string;

    override defaultFieldPresentationName(): string | null
    {
        return defaultContainerTextInputPresentationName;
    }    

    protected override get editorSelector(): string
    {
        let result = 'input[type="' + this.inputType + '"]';
        
        // includes inputs that omit type, which default to text in HTML
        if (this.inputType === 'text')
            result += ', input:not([type])';
        return result;
    }
    protected override createChildEditorDefinitionAdapter(): IEditorAdapterDefinition
    {
        return new InputAdapterDefinition(this.inputType);
    }
}

export function getContainerInputAdapterKey(inputType: string): string
{
    return `container:input:${ inputType.toLowerCase() }`;
}
