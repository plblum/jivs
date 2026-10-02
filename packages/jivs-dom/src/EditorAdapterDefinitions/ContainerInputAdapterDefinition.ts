

import { IEditorAdapterDefinition } from '../Interfaces/EditorAdapterDefinitions';
import { ContainerEditorAdapterDefinitionBase } from './ContainerEditorAdapterDefinitionBase';
import { InputAdapterDefinition } from './InputAdapterDefinition';

/**
 * Provides an editor adapter definition for HTML input elements of a specific type
 * within a container tag.
 * It does not support type=radio or type=file. Those have other AdapterDefinitions.
 * 
 * Subclass to introduce the containerSelector value to ensure the container is correctly identified.
 */
export class ContainerInputAdapterDefinition extends ContainerEditorAdapterDefinitionBase
{

    public constructor(inputType: string, adapterKey?: string, priority: number = 0,
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
        //!!!TODO: Switch to defaultContainerTextInputPresentationName
        // This is here just to allow compilation
        throw new Error("defaultFieldPresentationName() not implemented yet.");
    }    

    protected override get editorSelector(): string
    {
        // includes inputs that omit type, which default to text in HTML
        return 'input[type="' + this.inputType + '"], input:not([type])';
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
export const defaultTextInputPresentationName: string | null = "ContainerInput";