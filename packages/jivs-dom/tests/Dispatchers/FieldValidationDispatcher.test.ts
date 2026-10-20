import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IAriaService } from '../../src/Interfaces/AriaService';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IFieldPresentation } from '../../src/Interfaces/FieldPresentations';
import { ElementRole } from '../../src/Interfaces/Types';
import { FieldValidationDispatcher } from '../../src/Dispatchers/FieldValidationDispatcher';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import { RecordingLoggingService } from '../TestSupport/mocks';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Creates a minimal valid validation snapshot for dispatch tests.
 */
function createValidationState(): ValueHostValidationState
{
    return {
        isValid: true,
        doNotSave: false,
        issuesFound: null,
        asyncProcessing: false,
        status: ValidationStatus.Valid,
        corrected: false
    };
}

/**
 * Creates a real ElementRegistry backed by the real manager from a FieldValueHost.
 */
function setup(includeAriaService: boolean = true): {
    dispatcher: FieldValidationDispatcher,
    valueHost: IFieldValueHost,
    registry: ElementRegistry,
    root: HTMLElement,
    logger: RecordingLoggingService,
    registryManagers: Array<object>,
    resolvedManagers: Array<object>,
    ariaService: IAriaService | null
}
{
    let { valueHost } = setupFieldValueHostForTesting();
    let registry = new ElementRegistry(valueHost.valueHostsManager);
    let root = document.createElement('form');
    let logger = new RecordingLoggingService();
    let registryManagers: Array<object> = [];
    let resolvedManagers: Array<object> = [];
    let ariaService = includeAriaService ? {
        applyValidationState: () => null
    } as unknown as IAriaService : null;
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices,
        ariaService: ariaService,
        resolveContainerElement: (manager: object): HTMLElement => {
            resolvedManagers.push(manager);
            return root;
        },
        getElementRegistry: (manager: object): IElementRegistry => {
            registryManagers.push(manager);
            return registry;
        }
    });

    return {
        dispatcher: new FieldValidationDispatcher(domServices),
        valueHost: valueHost,
        registry: registry,
        root: root,
        logger: logger,
        registryManagers: registryManagers,
        resolvedManagers: resolvedManagers,
        ariaService: ariaService
    };
}

/**
 * Adds a field role to the real registry and returns its Jivs element.
 * @param registry - Registry populated for the dispatch.
 * @param elementIdentifier - Identifier used to associate the element with a field host.
 * @param role - Field role registered for this element.
 */
function addFieldElement(
    registry: ElementRegistry,
    elementIdentifier: string,
    role: ElementRole | string
): IJivsElement
{
    let element = document.createElement('div') as IJivsElement;
    element.jivsElementRole = role;
    registry.addField(element, elementIdentifier, role);
    return element;
}

/**
 * Creates a minimal field-presentation fake whose apply behavior is controlled by the test.
 * @param apply - Callback invoked when the dispatcher applies validation state.
 */
function createPresentation(apply: IFieldPresentation['apply']): IFieldPresentation
{
    return {
        init: () => {},
        apply: apply,
        getStaticAriaUpdater: () => null,
        getAriaValidationStateUpdater: () => null,
        dispose: () => {}
    };
}

// FieldValidationDispatcher finds the current field's eligible records in a real ElementRegistry and applies state updates.
describe('FieldValidationDispatcher.dispatch with the real ElementRegistry', () => {
    test('Applies presentations when installed and forwards every eligible record to ARIA', () => {
        let { dispatcher, valueHost, registry, root, registryManagers, resolvedManagers, ariaService } = setup();
        let editor = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.editor);
        let label = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.label);
        let visibleError = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.error);
        let ariaError = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.ariaError);
        let unrelatedElement = addFieldElement(registry, 'unrelated-field', ElementRole.label);
        let presentationCalls: Array<{ element: IJivsElement, field: IFieldValueHost, state: ValueHostValidationState }> = [];
        let ariaCalls: Array<{ element: IJivsElement, field: IFieldValueHost, state: ValueHostValidationState }> = [];
        let state = createValidationState();

        for (let element of [editor, visibleError]) {
            element.jivsFieldPresentation = createPresentation((
                field: IFieldValueHost, currentState: ValueHostValidationState
            ) => {
                presentationCalls.push({ element: element, field: field, state: currentState });
            });
        }
        ariaService!.applyValidationState = (
            element: IJivsElement,
            field: IFieldValueHost,
            currentState: ValueHostValidationState
        ) => {
            ariaCalls.push({ element: element, field: field, state: currentState });
            return null;
        };

        dispatcher.dispatch(valueHost, state);

        expect(resolvedManagers).toEqual([valueHost.valueHostsManager]);
        expect(registryManagers).toEqual([valueHost.valueHostsManager]);
        expect(root).toBeInstanceOf(HTMLFormElement);
        expect(presentationCalls).toEqual([
            { element: editor, field: valueHost, state: state },
            { element: visibleError, field: valueHost, state: state }
        ]);
        expect(ariaCalls).toEqual([
            { element: editor, field: valueHost, state: state },
            { element: label, field: valueHost, state: state },
            { element: visibleError, field: valueHost, state: state }
        ]);
        expect(ariaCalls.some(call => call.element === ariaError)).toBe(false);
        expect(ariaCalls.some(call => call.element === unrelatedElement)).toBe(false);
    });

    test('Skips presentation work when none is installed but still applies ARIA state', () => {
        let { dispatcher, valueHost, registry, ariaService } = setup();
        let label = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.label);
        let ariaCalls: Array<IJivsElement> = [];
        ariaService!.applyValidationState = (element) => {
            ariaCalls.push(element);
            return null;
        };

        dispatcher.dispatch(valueHost, createValidationState());

        expect(ariaCalls).toEqual([label]);
    });

    test('Skips a null presentation and still applies ARIA state', () => {
        let { dispatcher, valueHost, registry, ariaService } = setup();
        let label = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.label);
        label.jivsFieldPresentation = null;
        let ariaCalls: Array<IJivsElement> = [];
        ariaService!.applyValidationState = (element) => {
            ariaCalls.push(element);
            return null;
        };

        dispatcher.dispatch(valueHost, createValidationState());

        expect(ariaCalls).toEqual([label]);
    });

    test('Still applies field presentations when ARIA management is disabled', () => {
        let { dispatcher, valueHost, registry } = setup(false);
        let label = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.label);
        let presentationCalls: Array<IJivsElement> = [];
        label.jivsFieldPresentation = createPresentation(() => {
            presentationCalls.push(label);
        });

        dispatcher.dispatch(valueHost, createValidationState());

        expect(presentationCalls).toEqual([label]);
    });
});

// One element's presentation failure is logged and does not stop later registry-selected elements from updating.
describe('FieldValidationDispatcher.dispatch operation failures', () => {
    test('Logs a failed presentation and continues with subsequent elements', () => {
        let { dispatcher, valueHost, registry, logger } = setup(false);
        let failingElement = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.label);
        failingElement.id = 'failing-label';
        let nextElement = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.error);
        let presentationCalls: Array<IJivsElement> = [];
        failingElement.jivsFieldPresentation = createPresentation(() => {
            throw new Error('Presentation failed');
        });
        nextElement.jivsFieldPresentation = createPresentation(() => {
            presentationCalls.push(nextElement);
        });

        dispatcher.dispatch(valueHost, createValidationState());

        expect(presentationCalls).toEqual([nextElement]);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toMatchObject({
            message: "Error processing element 'failing-label': Presentation failed",
            feature: 'Dom',
            data: {
                idAttribute: 'failing-label',
                valueHostName: 'Field1'
            }
        });
    });

    test('Logs an ARIA update failure and continues applying ARIA to later elements', () => {
        let { dispatcher, valueHost, registry, logger, ariaService } = setup();
        let firstElement = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.label);
        firstElement.id = 'first-field-label';
        let secondElement = addFieldElement(registry, valueHost.getElementIdentifier(), ElementRole.error);
        secondElement.id = 'second-field-error';
        let ariaCalls: Array<IJivsElement> = [];
        ariaService!.applyValidationState = (element) => {
            ariaCalls.push(element);
            if (element === firstElement)
                throw new Error('ARIA update failed');
            return null;
        };

        dispatcher.dispatch(valueHost, createValidationState());

        expect(ariaCalls).toEqual([firstElement, secondElement]);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toMatchObject({
            message: "Error processing element 'first-field-label': ARIA update failed",
            feature: 'Dom',
            data: {
                idAttribute: 'first-field-label',
                valueHostName: 'Field1'
            }
        });
    });
});
