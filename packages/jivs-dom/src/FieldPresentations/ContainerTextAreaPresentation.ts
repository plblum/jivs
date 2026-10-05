/**
 * Presentation for a textarea element within a container.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/ContainerTextAreaPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { ContainerIsValidFieldPresentationBase } from './ContainerIsValidFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML textarea element contained within a specific container.
 * 
 * Style classes are applied to the container (the anchor).
 * By default, they make the editor element look like our non-contained editor.
 * 
 * Containers around editors allow for additional styling and layout control separate 
 * from the input element itself. Its immediate benefit is to offer an 
 * Indicator for the validity state or required status of the input element
 * by adding visual cues to the container rather than the input element itself.
 * 
 * ```css
 * .jivs-invalid-container-editor.jivs-required-container-editor::after {
        content: '*';
        color: red;
 * }
 * ```
 * 
 * Its default css classes are:
 * - invalidClass: jivs-invalid-container-editor-textarea
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
 * Registered with FieldPresentationFactory as presentation name 'containerTextAreaEditor'.
 * ContainerTextAreaAdapterDefinition should use this presentation name: 'containerTextAreaEditor'.
 */
export class ContainerTextAreaPresentation extends ContainerIsValidFieldPresentationBase
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
        return 'jivs-invalid-container-editor-textarea';
    }
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for ContainerTextAreaAdapterDefinition.
 */
export const defaultContainerTextAreaPresentationName = 'containerTextAreaEditor';