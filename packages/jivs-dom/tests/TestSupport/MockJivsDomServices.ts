import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { ILoggingService } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IAriaService } from '../../src/Interfaces/AriaService';
import type { IDispatcherService } from '../../src/Interfaces/Dispatchers';
import type { IEditorAdapterDefinitionFactory } from '../../src/Interfaces/EditorAdapterDefinitions';
import type { IEditorInstaller } from '../../src/Interfaces/EditorInstaller';
import type { IFieldPresentation, IFieldPresentationInstaller } from '../../src/Interfaces/FieldPresentations';
import type { IFormPresentation, IFormPresentationInstaller } from '../../src/Interfaces/FormPresentations';
import type { IIssuesFoundFormatterService } from '../../src/Interfaces/IssuesFoundFormatterService';
import {
    IJivsDomServices,
    initJivsDomGlobalOptions
} from '../../src/Interfaces/JivsDomServices';
import type { IPresentationFactory } from '../../src/Interfaces/Presentations_common';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';

function createUnexpectedUseMock<T>(name: string, properties: object = {}): T
{
    return new Proxy(properties, {
        get(target, property, receiver) {
            if (Reflect.has(target, property))
                return Reflect.get(target, property, receiver);
            if (property === 'then' || typeof property === 'symbol')
                return undefined;

            return (..._args: unknown[]) => {
                throw new Error(`Mock ${name}.${String(property)} was used without an override.`);
            };
        }
    }) as T;
}

function unexpectedUse(name: string): (...args: unknown[]) => never
{
    return (..._args: unknown[]) => {
        throw new Error(`Mock IJivsDomServices.${name} was used without an override.`);
    };
}

/**
 * Creates a fresh IJivsDomServices test double. Collaborators are explicit-use mocks:
 * tests can replace only the services they need, while accidental calls to the defaults fail.
 * @param overrides - Properties to replace with focused fakes or real implementations.
 */
export function createMockJivsDomServices(
    overrides: Partial<IJivsDomServices> = {}
): IJivsDomServices
{
    let loggingService = createUnexpectedUseMock<ILoggingService>('IJivsServices.loggingService', {
        serviceName: 'MockLoggingService'
    });
    let defaultServices = createUnexpectedUseMock<IJivsServices>('IJivsServices', {
        loggingService
    });
    let services = overrides.services ?? defaultServices;

    let mock: IJivsDomServices = {
        serviceName: 'MockJivsDomServices',
        dispose: unexpectedUse('dispose'),
        services: services,
        options: initJivsDomGlobalOptions(),
        editorInstaller: createUnexpectedUseMock<IEditorInstaller>('IJivsDomServices.editorInstaller'),
        fieldPresentationInstaller: createUnexpectedUseMock<IFieldPresentationInstaller>(
            'IJivsDomServices.fieldPresentationInstaller'),
        formPresentationInstaller: createUnexpectedUseMock<IFormPresentationInstaller>(
            'IJivsDomServices.formPresentationInstaller'),
        dispatchers: createUnexpectedUseMock<IDispatcherService>('IJivsDomServices.dispatchers'),
        ariaService: createUnexpectedUseMock<IAriaService>('IJivsDomServices.ariaService'),
        issuesFoundFormatterService: createUnexpectedUseMock<IIssuesFoundFormatterService>(
            'IJivsDomServices.issuesFoundFormatterService'),
        popupMechanism: null,
        loggingFacade: overrides.loggingFacade ?? new DomLoggingFacade(services),
        resolveContainerElement: unexpectedUse('resolveContainerElement'),
        resolveFieldElement: unexpectedUse('resolveFieldElement'),
        getElementRegistry: unexpectedUse('getElementRegistry'),
        getPopupService: unexpectedUse('getPopupService'),

        getInstallCounter: unexpectedUse('getInstallCounter'),
        incrementInstallCounter: unexpectedUse('incrementInstallCounter'),        
        editorAdapterDefinitionFactory: createUnexpectedUseMock<IEditorAdapterDefinitionFactory>(
            'IJivsDomServices.editorAdapterDefinitionFactory'),
        fieldPresentationFactory: createUnexpectedUseMock<IPresentationFactory<IFieldPresentation>>(
            'IJivsDomServices.fieldPresentationFactory'),
        formPresentationFactory: createUnexpectedUseMock<IPresentationFactory<IFormPresentation>>(
            'IJivsDomServices.formPresentationFactory')
    };

    let configuredMock = Object.assign(mock, overrides);
    return new Proxy(configuredMock, {
        get(target, property, receiver) {
            if (Reflect.has(target, property))
                return Reflect.get(target, property, receiver);
            if (property === 'asymmetricMatch')
                return undefined;
            if (typeof property === 'symbol')
                return undefined;

            throw new Error(`Mock IJivsDomServices.${property} was accessed without an override.`);
        }
    });
}
