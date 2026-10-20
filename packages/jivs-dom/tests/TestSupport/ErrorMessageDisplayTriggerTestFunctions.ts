import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type {
    IErrorMessageDisplayController,
    IErrorMessageDisplayTriggerContext
} from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IEditorAdapterDefinition } from '../../src/Interfaces/EditorAdapterDefinitions';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from './MockJivsDomServices';

export type TriggerAction =
    | { name: 'open', context: IErrorMessageDisplayTriggerContext, delay: number }
    | { name: 'close', context: IErrorMessageDisplayTriggerContext, delay: number }
    | { name: 'toggle', context: IErrorMessageDisplayTriggerContext, openDelay: number, closeDelay: number };

export interface IEditorEventHandlerCall
{
    editor: IJivsElement;
    valueHost: IFieldValueHost;
    eventName: string;
    handler: EventListener;
}

/**
 * Creates a trigger context with DOM-backed elements and recording controller/editor handlers.
 * @param editors - Editor elements returned by the DOM services; defaults to one editor.
 * @param includeEditorAdapter - Whether the default editor has an event adapter definition.
 */
export function createErrorMessageDisplayTriggerTestContext(
    editors: IJivsElement[] = [document.createElement('input') as IJivsElement],
    includeEditorAdapter: boolean = true
): {
    context: IErrorMessageDisplayTriggerContext,
    element: IJivsElement,
    valueHost: IFieldValueHost,
    actions: TriggerAction[],
    resolveFieldElementCalls: Array<{ valueHost: IFieldValueHost, role: string }>,
    editorEventHandlerCalls: IEditorEventHandlerCall[]
}
{
    let element = document.createElement('div') as IJivsElement;
    let valueHost = {} as IFieldValueHost;
    let actions: TriggerAction[] = [];
    let resolveFieldElementCalls: Array<{ valueHost: IFieldValueHost, role: string }> = [];
    let editorEventHandlerCalls: IEditorEventHandlerCall[] = [];
    let editorAdapterDefinition = {
        attachEventHandler: (
            editor: IJivsElement,
            eventValueHost: IFieldValueHost,
            eventName: string,
            handler: EventListener
        ): void => {
            editorEventHandlerCalls.push({
                editor: editor,
                valueHost: eventValueHost,
                eventName: eventName,
                handler: handler
            });
            editor.addEventListener(eventName, handler);
        }
    } as unknown as IEditorAdapterDefinition;

    if (includeEditorAdapter)
    {
        for (let editor of editors)
            editor.jivsEditorAdapterDefinition = editorAdapterDefinition;
    }

    let controller: IErrorMessageDisplayController = {
        open: (context, delay) => actions.push({ name: 'open', context: context, delay: delay }),
        opened: () => undefined,
        close: (context, delay) => actions.push({ name: 'close', context: context, delay: delay }),
        closed: () => undefined,
        toggle: (context, openDelay, closeDelay) => actions.push({
            name: 'toggle',
            context: context,
            openDelay: openDelay,
            closeDelay: closeDelay
        }),
        cancelDelayedClose: () => undefined
    };
    let domServices = createMockJivsDomServices({
        resolveFieldElement: (requestedValueHost, role) => {
            resolveFieldElementCalls.push({ valueHost: requestedValueHost, role: role });
            return editors;
        }
    });
    let context: IErrorMessageDisplayTriggerContext = {
        jivsElement: element,
        domServices: domServices,
        valueHost: valueHost,
        controller: controller,
        issuesFound: null,
        dispose: () => undefined
    };

    return {
        context: context,
        element: element,
        valueHost: valueHost,
        actions: actions,
        resolveFieldElementCalls: resolveFieldElementCalls,
        editorEventHandlerCalls: editorEventHandlerCalls
    };
}
