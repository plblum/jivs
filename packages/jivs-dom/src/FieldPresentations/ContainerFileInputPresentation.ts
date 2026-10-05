/**
 * Presentation for a text input type='file' element within a container.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/ContainerFileInputPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ContainerIsValidFieldPresentationBase } from './ContainerIsValidFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input type='file' element contained within a specific container.
 * 
 * Style classes are applied to the container (the anchor).
 * By default, they make the editor element look like our non-contained editor.
 * 
 * Containers around editors allow for additional styling and layout control separate 
 * from the input type='file' element itself. Its immediate benefit is to offer an 
 * Indicator for the validity state or required status of the input type='file' element
 * by adding visual cues to the container rather than the input type='file' element itself.
 * 
 * ```css
 * .jivs-invalid-container-editor.jivs-required-container-editor::after {
        content: '*';
        color: red;
 * }
 * ```
 * 
 * Its default css classes are:
 * - invalidClass: jivs-invalid-container-editor-file-input'
 * - validatedClass: null
 * - correctedClass: null
 * - requiredClass: null
 * - presentationClass: inherited 'jivs-container-editor'
 * 
 * We supply these CSS classes to activate the validated, corrected and required visual cues:
 * - validatedClass: jivs-validated-container-editor
 * - correctedClass: jivs-corrected-container-editor
 * - requiredClass: jivs-required-container-editor
 * 
 * Registered with FieldPresentationFactory as presentation name 'containerFileInputEditor'.
 * ContainerFileInputAdapterDefinition should use this presentation name: 'containerFileInputEditor'.
 */
export class ContainerFileInputPresentation extends ContainerIsValidFieldPresentationBase
{
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        jivsElement?: IJivsDomElement | null
    )
    {
        super(element, options, jivsElement);
    }

    protected override defaultInvalidClass(): string | null
    {
        return 'jivs-invalid-container-editor-file-input';
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for ContainerFileInputAdapterDefinition.
 */
export const defaultContainerFileInputPresentationName = 'containerFileInputEditor';