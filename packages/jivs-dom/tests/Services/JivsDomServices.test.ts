/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IAriaService } from '../../src/Interfaces/AriaService';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IDispatcherService } from '../../src/Interfaces/Dispatchers';
import type { IEditorAdapterDefinitionFactory } from '../../src/Interfaces/EditorAdapterDefinitions';
import type { IEditorInstaller } from '../../src/Interfaces/EditorInstaller';
import type { IFieldPresentation, IFieldPresentationInstaller } from '../../src/Interfaces/FieldPresentations';
import type { IFormPresentation, IFormPresentationInstaller } from '../../src/Interfaces/FormPresentations';
import type { IIssuesFoundFormatterService } from '../../src/Interfaces/IssuesFoundFormatterService';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import type { IPresentationFactory } from '../../src/Interfaces/Presentations_common';
import type { IPopupMechanism, IPopupService } from '../../src/Interfaces/PopupErrorMessageDisplays';
import { ElementRole } from '../../src/Interfaces/Types';
import { JivsDomServices } from '../../src/Services/JivsDomServices';
import { RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Replaces service factories with typed sentinels so these tests cover container wiring,
 * caching, and overrides without retesting the collaborators themselves.
 */
class FactoryTrackingJivsDomServices extends JivsDomServices
{
    public factoryCalls: string[] = [];
    public get registryFactoryResult(): IElementRegistry | undefined
    {
        return this._registryFactoryResult;
    }
    public set registryFactoryResult(value: IElementRegistry | undefined)
    {
        this._registryFactoryResult = value;
    }
    private _registryFactoryResult: IElementRegistry | undefined;

    private createSentinel<T>(name: string): T
    {
        this.factoryCalls.push(name);
        return { name } as unknown as T;
    }

    protected override createDefaultEditorInstaller(): IEditorInstaller
    {
        return this.createSentinel('editorInstaller');
    }
    protected override createDefaultFieldPresentationInstaller(): IFieldPresentationInstaller
    {
        return this.createSentinel('fieldPresentationInstaller');
    }
    protected override createDefaultFormPresentationInstaller(): IFormPresentationInstaller
    {
        return this.createSentinel('formPresentationInstaller');
    }
    protected override createDefaultDispatcherService(): IDispatcherService
    {
        return this.createSentinel('dispatchers');
    }
    protected override createDefaultAriaService(): IAriaService | null
    {
        return this.createSentinel('ariaService');
    }
    protected override createDefaultIssuesFoundFormatterService(): IIssuesFoundFormatterService
    {
        return this.createSentinel('issuesFoundFormatterService');
    }
    protected override createEditorAdapterDefinitionFactory(): IEditorAdapterDefinitionFactory
    {
        return this.createSentinel('editorAdapterDefinitionFactory');
    }
    protected override createFieldPresentationFactory(): IPresentationFactory<IFieldPresentation>
    {
        return this.createSentinel('fieldPresentationFactory');
    }
    protected override createFormPresentationFactory(): IPresentationFactory<IFormPresentation>
    {
        return this.createSentinel('formPresentationFactory');
    }
    protected override createElementRegistry(_valueHostsManager: IValueHostsManager): IElementRegistry
    {
        if (this._registryFactoryResult)
            return this._registryFactoryResult;
        return this.createSentinel('elementRegistry');
    }
    protected override createPopupService(): IPopupService
    {
        return this.createSentinel('popupService');
    }
}

/**
 * Creates a manager fake with metadata storage and an optional container selector.
 */
function createManager(containerIdentifier: string | null = null): IValueHostsManager
{
    let metadata = new Map<string, unknown>();
    return {
        getContainerIdentifier: () => containerIdentifier,
        getMetadata: (key: string) => metadata.get(key),
        setMetadata: (key: string, value: unknown) => {
            if (value === undefined)
                metadata.delete(key);
            else
                metadata.set(key, value);
        }
    } as unknown as IValueHostsManager;
}

// The options getter provides one stable, initialized global configuration object.
describe('JivsDomServices.options', () => {
    test('Lazily creates and then returns the same object with defaults for each presentation group', () => {
        let testItem = new JivsDomServices();

        let options = testItem.options;

        expect(testItem.options).toBe(options);
        expect(options).toEqual(<JivsDomGlobalOptions>{
            inlineErrorMessageDisplay: {},
            popupErrorMessageDisplay: {},
            editor: {},
            radioButtons: {},
            wrappedEditor: {},
            label: {},
            requiredIndicator: {},
            fieldContainer: {},
            messageFrame: {},
            templatedMessageFrame: {},
            headerFooterMessageFrame: {},
            iconMessageFrame: {},
            columnarErrorIndicatorContent: {},
            validationSummary: {},
            validationBehaviors: {}
        });
    });
});

// Service properties should create their dependency once and reuse it for subsequent access.
describe('JivsDomServices lazy service properties', () => {
    test('Creates each configured service and factory once', () => {
        let testItem = new FactoryTrackingJivsDomServices();

        let lazilyCreated = [
            testItem.editorInstaller,
            testItem.fieldPresentationInstaller,
            testItem.formPresentationInstaller,
            testItem.dispatchers,
            testItem.ariaService,
            testItem.issuesFoundFormatterService,
            testItem.editorAdapterDefinitionFactory,
            testItem.fieldPresentationFactory,
            testItem.formPresentationFactory
        ];
        let again = [
            testItem.editorInstaller,
            testItem.fieldPresentationInstaller,
            testItem.formPresentationInstaller,
            testItem.dispatchers,
            testItem.ariaService,
            testItem.issuesFoundFormatterService,
            testItem.editorAdapterDefinitionFactory,
            testItem.fieldPresentationFactory,
            testItem.formPresentationFactory
        ];

        expect(again).toEqual(lazilyCreated);
        expect(testItem.factoryCalls).toEqual([
            'editorInstaller',
            'fieldPresentationInstaller',
            'formPresentationInstaller',
            'dispatchers',
            'ariaService',
            'issuesFoundFormatterService',
            'editorAdapterDefinitionFactory',
            'fieldPresentationFactory',
            'formPresentationFactory'
        ]);
    });

    test('Returns null from the default ARIA factory and caches that opt-out state', () => {
        let testItem = new JivsDomServices();

        expect(testItem.ariaService).toBeNull();
        expect(testItem.ariaService).toBeNull();
    });

    test('Uses explicit service overrides rather than creating defaults', () => {
        let testItem = new FactoryTrackingJivsDomServices();
        let editorInstaller = {} as IEditorInstaller;
        let fieldInstaller = {} as IFieldPresentationInstaller;
        let formInstaller = {} as IFormPresentationInstaller;
        let dispatchers = {} as IDispatcherService;
        let ariaService = {} as IAriaService;
        let formatter = {} as IIssuesFoundFormatterService;
        let adapterFactory = {} as IEditorAdapterDefinitionFactory;

        testItem.editorInstaller = editorInstaller;
        testItem.fieldPresentationInstaller = fieldInstaller;
        testItem.formPresentationInstaller = formInstaller;
        testItem.dispatchers = dispatchers;
        testItem.ariaService = ariaService;
        testItem.issuesFoundFormatterService = formatter;
        testItem.editorAdapterDefinitionFactory = adapterFactory;

        expect(testItem.editorInstaller).toBe(editorInstaller);
        expect(testItem.fieldPresentationInstaller).toBe(fieldInstaller);
        expect(testItem.formPresentationInstaller).toBe(formInstaller);
        expect(testItem.dispatchers).toBe(dispatchers);
        expect(testItem.ariaService).toBe(ariaService);
        expect(testItem.issuesFoundFormatterService).toBe(formatter);
        expect(testItem.editorAdapterDefinitionFactory).toBe(adapterFactory);
        expect(testItem.factoryCalls).toEqual([]);
    });

    test('Preserves null as an explicit ARIA opt-out instead of invoking the default factory', () => {
        let testItem = new FactoryTrackingJivsDomServices();

        testItem.ariaService = null;

        expect(testItem.ariaService).toBeNull();
        expect(testItem.factoryCalls).toEqual([]);
    });
});

// The logging facade is created lazily and resolves the current engine logging service for each log.
describe('JivsDomServices.loggingFacade', () => {
    test('Caches one facade and logs missing-container details at warning level', () => {
        let testItem = new JivsDomServices();
        let logger = new RecordingLoggingService();
        testItem.services = { loggingService: logger } as unknown as IJivsServices;
        let manager = createManager('#missing-container');

        let facade = testItem.loggingFacade;
        let result = testItem.resolveContainerElement(manager);

        expect(testItem.loggingFacade).toBe(facade);
        expect(result).toBe(document.body);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Warn);
        expect(logger.calls[0].details).toMatchObject({
            message: 'Container element not found for identifier: #missing-container',
            feature: 'Dom',
            type: testItem,
            identity: '#missing-container'
        });
    });

    test('Does not fail when a missing-container warning has no configured logging service', () => {
        let testItem = new JivsDomServices();
        testItem.services = {} as IJivsServices;

        expect(testItem.resolveContainerElement(createManager('#missing-container'))).toBe(document.body);
    });
});

// Container and field resolution should use the manager configuration and registry without owning either behavior.
describe('JivsDomServices DOM resolution', () => {
    test('Uses the configured container element when the selector matches an HTMLElement', () => {
        let testItem = new JivsDomServices();
        let container = document.createElement('form');
        container.id = 'checkout';
        document.body.appendChild(container);

        expect(testItem.resolveContainerElement(createManager('#checkout'))).toBe(container);
        container.remove();
    });

    test('Falls back to document.body without logging when no container selector is configured', () => {
        let testItem = new JivsDomServices();

        expect(testItem.resolveContainerElement(createManager())).toBe(document.body);
    });

    test('Rejects a null manager or field value host', () => {
        let testItem = new JivsDomServices();

        expect(() => testItem.resolveContainerElement(null as unknown as IValueHostsManager))
            .toThrow(new CodingError('valueHostsManager required'));
        expect(() => testItem.resolveContainerElement(undefined as unknown as IValueHostsManager))
            .toThrow(new CodingError('valueHostsManager required'));
        expect(() => testItem.resolveFieldElement(null as unknown as IFieldValueHost, ElementRole.editor))
            .toThrow(new CodingError('valueHost required'));
        expect(() => testItem.resolveFieldElement(undefined as unknown as IFieldValueHost, ElementRole.editor))
            .toThrow(new CodingError('valueHost required'));
    });

    test('Resolves the field identifier and delegates role lookup to the manager registry', () => {
        let testItem = new FactoryTrackingJivsDomServices();
        let expectedElements = [document.createElement('input')];
        let registryCalls: Array<[ElementRole | string, string]> = [];
        let registry = {
            getElementsByRole: (role: ElementRole | string, identifier: string) => {
                registryCalls.push([role, identifier]);
                return expectedElements;
            }
        } as unknown as IElementRegistry;
        let manager = createManager();
        manager.setMetadata('elementRegistry', registry);
        let valueHost = {
            getElementIdentifier: () => 'email-field',
            valueHostsManager: manager
        } as unknown as IFieldValueHost;

        expect(testItem.resolveFieldElement(valueHost, ElementRole.editor)).toBe(expectedElements);
        expect(testItem.resolveFieldElement(valueHost, 'custom-role')).toBe(expectedElements);
        expect(registryCalls).toEqual([
            [ElementRole.editor, 'email-field'],
            ['custom-role', 'email-field']
        ]);
        expect(testItem.factoryCalls).toEqual([]);
    });
});

// Element registries and popup services are cached in ValueHostsManager metadata so each manager owns its instances.
describe('JivsDomServices manager-scoped services', () => {
    test('Creates, stores, and reuses one element registry per manager', () => {
        let testItem = new FactoryTrackingJivsDomServices();
        let manager = createManager();
        let first = testItem.getElementRegistry(manager);

        expect(testItem.getElementRegistry(manager)).toBe(first);
        expect(manager.getMetadata('elementRegistry')).toBe(first);
        expect(testItem.factoryCalls).toEqual(['elementRegistry']);
    });

    test('Reuses a registry already stored on the manager', () => {
        let testItem = new FactoryTrackingJivsDomServices();
        let manager = createManager();
        let existing = {} as IElementRegistry;
        manager.setMetadata('elementRegistry', existing);

        expect(testItem.getElementRegistry(manager)).toBe(existing);
        expect(testItem.factoryCalls).toEqual([]);
    });

    test('Creates, stores, and reuses one popup service per manager', () => {
        let testItem = new FactoryTrackingJivsDomServices();
        let manager = createManager();
        let first = testItem.getPopupService(manager);

        expect(testItem.getPopupService(manager)).toBe(first);
        expect(manager.getMetadata('popupService')).toBe(first);
        expect(testItem.factoryCalls).toEqual(['popupService']);
    });

    test('Reuses a popup service already stored on the manager', () => {
        let testItem = new FactoryTrackingJivsDomServices();
        let manager = createManager();
        let existing = {} as IPopupService;
        manager.setMetadata('popupService', existing);

        expect(testItem.getPopupService(manager)).toBe(existing);
        expect(testItem.factoryCalls).toEqual([]);
    });

    test('Creates separate instances for different managers', () => {
        let testItem = new FactoryTrackingJivsDomServices();

        let firstRegistry = testItem.getElementRegistry(createManager());
        let secondRegistry = testItem.getElementRegistry(createManager());
        let firstPopupService = testItem.getPopupService(createManager());
        let secondPopupService = testItem.getPopupService(createManager());

        expect(secondRegistry).not.toBe(firstRegistry);
        expect(secondPopupService).not.toBe(firstPopupService);
        expect(testItem.factoryCalls).toEqual([
            'elementRegistry',
            'elementRegistry',
            'popupService',
            'popupService'
        ]);
    });
});

// The install counter lives in ValueHostsManager metadata so each manager counts its own FormInstaller runs.
describe('JivsDomServices install counter', () => {
    test('getInstallCounter seeds the metadata with 1 when it is not there yet', () => {
        let testItem = new JivsDomServices();
        let manager = createManager();

        expect(manager.getMetadata('installCounter')).toBeUndefined();
        expect(testItem.getInstallCounter(manager)).toBe(1);
        expect(manager.getMetadata('installCounter')).toBe(1);
    });

    test('getInstallCounter returns the stored value without changing it', () => {
        let testItem = new JivsDomServices();
        let manager = createManager();
        manager.setMetadata('installCounter', 5);

        expect(testItem.getInstallCounter(manager)).toBe(5);
        expect(testItem.getInstallCounter(manager)).toBe(5);
        expect(manager.getMetadata('installCounter')).toBe(5);
    });

    test('incrementInstallCounter initializes to 1 without incrementing when the metadata is missing', () => {
        let testItem = new JivsDomServices();
        let manager = createManager();

        testItem.incrementInstallCounter(manager);

        expect(manager.getMetadata('installCounter')).toBe(1);
    });

    test('incrementInstallCounter adds 1 each call, and getInstallCounter reflects it', () => {
        let testItem = new JivsDomServices();
        let manager = createManager();
        manager.setMetadata('installCounter', 1);

        testItem.incrementInstallCounter(manager);
        expect(testItem.getInstallCounter(manager)).toBe(2);
        testItem.incrementInstallCounter(manager);
        expect(testItem.getInstallCounter(manager)).toBe(3);
        expect(manager.getMetadata('installCounter')).toBe(3);
    });

    test('Each manager keeps its own counter', () => {
        let testItem = new JivsDomServices();
        let first = createManager();
        let second = createManager();

        testItem.incrementInstallCounter(first);
        testItem.incrementInstallCounter(first);
        testItem.incrementInstallCounter(second);

        expect(testItem.getInstallCounter(first)).toBe(2);
        expect(testItem.getInstallCounter(second)).toBe(1);
    });
});

// A configured popup mechanism owns global resources and is disposed once by the service container.
describe('JivsDomServices.dispose', () => {
    test('Disposes and clears a configured popup mechanism', () => {
        let testItem = new JivsDomServices();
        let disposeCalls = 0;
        let mechanism = {
            dispose: () => disposeCalls++
        } as unknown as IPopupMechanism;
        testItem.popupMechanism = mechanism;

        testItem.dispose();
        testItem.dispose();

        expect(disposeCalls).toBe(1);
        expect(testItem.popupMechanism).toBeNull();
    });

    test('Does not fail when no popup mechanism is configured', () => {
        let testItem = new JivsDomServices();

        expect(() => testItem.dispose()).not.toThrow();
        expect(testItem.popupMechanism).toBeNull();
    });
});
