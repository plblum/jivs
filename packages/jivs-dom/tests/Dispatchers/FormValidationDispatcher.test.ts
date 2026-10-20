/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { ValidationState } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IFormPresentation } from '../../src/Interfaces/FormPresentations';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import { FormValidationDispatcher } from '../../src/Dispatchers/FormValidationDispatcher';
import { ElementRole } from '../../src/Interfaces/Types';
import { RecordingLoggingService } from '../TestSupport/mocks';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Creates a valid form validation snapshot suitable for forwarding assertions.
 */
function createValidationState(): ValidationState
{
    return {
        isValid: true,
        doNotSave: false,
        issuesFound: null,
        asyncProcessing: false
    };
}

/**
 * Creates a dispatcher and real ElementRegistry associated with a real ValueHostsManager.
 */
function setup(): {
    dispatcher: FormValidationDispatcher,
    manager: IValueHostsManager,
    registry: ElementRegistry,
    root: HTMLElement,
    logger: RecordingLoggingService,
    registryManagers: Array<IValueHostsManager>,
    resolvedManagers: Array<IValueHostsManager>
}
{
    let { valueHost } = setupFieldValueHostForTesting();
    let manager = valueHost.valueHostsManager;
    let registry = new ElementRegistry(manager);
    let root = document.createElement('form');
    let logger = new RecordingLoggingService();
    let registryManagers: Array<IValueHostsManager> = [];
    let resolvedManagers: Array<IValueHostsManager> = [];
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices,
        resolveContainerElement: (resolvedManager: IValueHostsManager): HTMLElement => {
            resolvedManagers.push(resolvedManager);
            return root;
        },
        getElementRegistry: (resolvedManager: IValueHostsManager): ElementRegistry => {
            registryManagers.push(resolvedManager);
            return registry;
        }
    });

    return {
        dispatcher: new FormValidationDispatcher(domServices),
        manager: manager,
        registry: registry,
        root: root,
        logger: logger,
        registryManagers: registryManagers,
        resolvedManagers: resolvedManagers
    };
}

/**
 * Adds a form role to the real registry and returns its Jivs element.
 * @param registry - Registry populated for the dispatch.
 * @param role - Form role registered for this element.
 */
function addFormElement(registry: ElementRegistry, role: ElementRole | string): IJivsElement
{
    let element = document.createElement('div') as IJivsElement;
    element.jivsElementRole = role;
    registry.addForm(element, role);
    return element;
}

/**
 * Creates a form-presentation fake whose apply behavior is controlled by the test.
 * @param apply - Callback invoked when the dispatcher applies validation state.
 */
function createPresentation(apply: IFormPresentation['apply']): IFormPresentation
{
    return {
        init: () => {},
        apply: apply,
        getStaticAriaUpdater: () => null
    };
}

// FormValidationDispatcher queries form entries from the real ElementRegistry and applies each installed presentation in order.
describe('FormValidationDispatcher.dispatch with the real ElementRegistry', () => {
    test('Applies installed presentations to form elements in registry order and forwards manager and state', () => {
        let { dispatcher, manager, registry, root, registryManagers, resolvedManagers } = setup();
        let summary = addFormElement(registry, ElementRole.summary);
        let submit = addFormElement(registry, ElementRole.submit);
        let calls: Array<{ element: IJivsElement, manager: IValueHostsManager, state: ValidationState }> = [];
        let state = createValidationState();
        summary.jivsFormPresentation = createPresentation((valueHostsManager, currentState) => {
            calls.push({ element: summary, manager: valueHostsManager, state: currentState });
        });
        submit.jivsFormPresentation = createPresentation((valueHostsManager, currentState) => {
            calls.push({ element: submit, manager: valueHostsManager, state: currentState });
        });

        dispatcher.dispatch(manager, state);

        expect(resolvedManagers).toEqual([manager]);
        expect(registryManagers).toEqual([manager]);
        expect(root).toBeInstanceOf(HTMLFormElement);
        expect(calls).toEqual([
            { element: summary, manager: manager, state: state },
            { element: submit, manager: manager, state: state }
        ]);
    });

    test('Does not dispatch to field records returned by the registry iterator', () => {
        let { dispatcher, manager, registry } = setup();
        let form = addFormElement(registry, ElementRole.summary);
        let fieldElement = document.createElement('input') as IJivsElement;
        registry.addField(fieldElement, 'Field1', ElementRole.label);
        let calls: Array<IJivsElement> = [];
        form.jivsFormPresentation = createPresentation(() => calls.push(form));
        fieldElement.jivsFormPresentation = createPresentation(() => calls.push(fieldElement));

        dispatcher.dispatch(manager, createValidationState());

        expect(calls).toEqual([form]);
    });

    test('Skips absent and null form presentations', () => {
        let { dispatcher, manager, registry } = setup();
        let absent = addFormElement(registry, ElementRole.summary);
        let explicitlyUnused = addFormElement(registry, ElementRole.submit);
        explicitlyUnused.jivsFormPresentation = null;
        let calls = 0;
        let thirdElement = addFormElement(registry, 'custom-form-role');
        thirdElement.jivsFormPresentation = createPresentation(() => calls++);

        dispatcher.dispatch(manager, createValidationState());

        expect(calls).toBe(1);
        expect(absent.jivsFormPresentation).toBeUndefined();
        expect(explicitlyUnused.jivsFormPresentation).toBeNull();
    });

    test('Does nothing when the registry has no form elements', () => {
        let { dispatcher, manager, registry, logger } = setup();
        registry.addField(document.createElement('input') as IJivsElement, 'Field1', ElementRole.editor);

        expect(() => dispatcher.dispatch(manager, createValidationState())).not.toThrow();
        expect(logger.calls).toHaveLength(0);
    });
});

// A failing form presentation is logged without field-host context and does not block later presentations.
describe('FormValidationDispatcher.dispatch operation failures', () => {
    test('Logs the failure and continues to subsequent form elements', () => {
        let { dispatcher, manager, registry, logger } = setup();
        let failingElement = addFormElement(registry, ElementRole.summary);
        failingElement.id = 'validation-summary';
        let nextElement = addFormElement(registry, ElementRole.submit);
        let calls: Array<IJivsElement> = [];
        failingElement.jivsFormPresentation = createPresentation(() => {
            throw new Error('Summary update failed');
        });
        nextElement.jivsFormPresentation = createPresentation(() => calls.push(nextElement));

        dispatcher.dispatch(manager, createValidationState());

        expect(calls).toEqual([nextElement]);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toMatchObject({
            message: "Error processing element 'validation-summary': Summary update failed",
            feature: 'Dom',
            data: {
                idAttribute: 'validation-summary'
            }
        });
        expect(logger.calls[0].details?.data).not.toHaveProperty('valueHostName');
    });
});
