/**
 * Presentation for an input type="checkbox" element within a wrapper.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/WrappedCheckboxPresentation
 */

import type { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { WrappedEditorFieldPresentationBase } from './WrappedEditorFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML input type="checkbox" element contained within a specific wrapper.
 * 
 * ## Style Classes
 * 
 * Style classes are applied to the wrapper (the anchor).
 * 
 * - persistent classes: `jivs-wrapped-editor-checkbox`, `jivs-wrapped-editor`, `jivs-isvalidpresentation`
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'wrappedCheckboxEditor'.
 * WrappedCheckboxAdapterDefinition should use this presentation name: 'wrappedCheckboxEditor'.
 */
export class WrappedCheckboxPresentation extends WrappedEditorFieldPresentationBase
{
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        anchor?: IJivsDomElement | null
    )
    {
        super(element, options, anchor);
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-wrapped-editor-checkbox');
    }    
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for WrappedCheckboxAdapterDefinition.
 */
export const defaultWrappedCheckboxPresentationName = 'wrappedCheckboxEditor';