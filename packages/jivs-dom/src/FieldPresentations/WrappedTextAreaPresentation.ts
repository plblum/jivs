/**
 * Presentation for a textarea element within a wrapper.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/WrappedTextAreaPresentation
 */

import type { IJivsElement } from '../Interfaces/IJivsElement';
import { WrappedEditorFieldPresentationBase } from './WrappedEditorFieldPresentationBase';
import { IsValidFieldPresentationOptions } from './IsValidFieldPresentationBase';

/**
 * Presentation for HTML textarea element contained within a specific wrapper.
 * 
 * ## CSS Classes
 * CSS classes are applied to the wrapper.
 * - persistent classes: `jivs-wrapped-editor-textarea`, `jivs-wrapped-editor`, `jivs-isvalidpresentation`
 *   Add your own permanent classes within the options.variationClasses property.
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/FieldPresentationBase} for more guidance.
 * - supports these stateful classes: 'jivs-invalid', 'jivs-validated', 'jivs-corrected', 'jivs-required'
 *   See {@see jivs-dom/FieldPresentations/AbstractClasses/IsValidFieldPresentationBase} for more guidance.
 * 
 * Registered with FieldPresentationFactory as presentation name 'wrappedTextAreaEditor'.
 * WrappedTextAreaAdapterDefinition should use this presentation name: 'wrappedTextAreaEditor'.
 */
export class WrappedTextAreaPresentation extends WrappedEditorFieldPresentationBase
{
    constructor(element: HTMLElement,
        options?: IsValidFieldPresentationOptions,
        anchor?: IJivsElement | null
    )
    {
        super(element, options, anchor);
    }


    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push('jivs-wrapped-editor-textarea');
    }    
}

/**
 * For registering this presentation with the FieldPresentationFactory
 * and consumed as default for WrappedTextAreaAdapterDefinition.
 */
export const defaultWrappedTextAreaPresentationName = 'wrappedTextAreaEditor';