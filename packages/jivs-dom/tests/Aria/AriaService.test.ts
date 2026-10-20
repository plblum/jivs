import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IAriaService } from '../../src/Interfaces/AriaService';
import type { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../../src/Interfaces/AriaUpdaters';
import type { IEditorAdapterDefinition } from '../../src/Interfaces/EditorAdapterDefinitions';
import type {
    IEditorElementRegistryRecord,
    IElementRegistry,
    IFieldElementRegistryRecord,
    IFormElementRegistryRecord
} from '../../src/Interfaces/ElementRegistry';
import type { IFieldPresentation } from '../../src/Interfaces/FieldPresentations';
import type { IFormPresentation } from '../../src/Interfaces/FormPresentations';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { ElementRole } from '../../src/Interfaces/Types';
import { AriaService } from '../../src/Aria/AriaService';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

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

interface AriaFixture
{
    domServices: IJivsDomServices;
    logger: RecordingLoggingService;
    ariaService: AriaService;
}

function createAriaFixture(): AriaFixture
{
    let logger = new RecordingLoggingService();
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    let ariaService = new AriaService(domServices);
    domServices.ariaService = ariaService;
    return { domServices, logger, ariaService };
}

function createResolvedField(identifier: string = 'email'): {
    manager: IValueHostsManager;
    valueHost: IFieldValueHost;
    registry: ElementRegistry;
}
{
    let valueHost = {
        ...createStubFieldValueHost('Email', identifier),
        currentValidationState: createValidationState()
    } as IFieldValueHost;
    let manager = {
        getFieldByElementIdentifier: (candidate: string) =>
            candidate.toLowerCase() === identifier.toLowerCase() ? valueHost : null
    } as unknown as IValueHostsManager;
    return {
        manager,
        valueHost,
        registry: new ElementRegistry(manager)
    };
}

function createStaticUpdater(
    onApply: (element: IJivsElement, role: ElementRole | string, valueHost?: IFieldValueHost) => void = () => {}
): IAriaStaticUpdater
{
    return { applyStaticAttributes: onApply };
}

function createValidationUpdater(
    onApply: (element: IJivsElement, valueHost: IFieldValueHost, state: ValueHostValidationState) => void = () => {}
): IAriaValidationStateUpdater
{
    return { applyValidationState: onApply };
}

function createJivsElement(role: ElementRole | string): IJivsElement
{
    let element = document.createElement('div') as IJivsElement;
    element.jivsElementRole = role;
    return element;
}

function addEditor(
    registry: ElementRegistry,
    valueHost: IFieldValueHost,
    originalElement: IJivsElement,
    jivsElement: IJivsElement = originalElement
): IEditorElementRegistryRecord
{
    registry.addEditor(originalElement, valueHost.getElementIdentifier());
    let record = Array.from(registry).find((entry) =>
        entry.kind === 'field' && entry.role === ElementRole.editor &&
        entry.element === originalElement) as IEditorElementRegistryRecord;
    registry.setEditorJivsElement(record, jivsElement);
    return record;
}

function addFieldElement(
    registry: ElementRegistry,
    valueHost: IFieldValueHost,
    element: IJivsElement,
    role: ElementRole | string
): IFieldElementRegistryRecord
{
    registry.addField(element, valueHost.getElementIdentifier(), role);
    return Array.from(registry).find((entry) =>
        entry.kind === 'field' && entry.element === element) as IFieldElementRegistryRecord;
}

// AriaService requires a valid DOM service container and retains it for logging and form installation.
describe('AriaService constructor', () => {
    test('Retains the supplied DOM service container', () => {
        let { domServices, ariaService } = createAriaFixture();

        expect(ariaService).toBeInstanceOf(AriaService);
        expect(domServices.ariaService).toBe(ariaService);
    });

    test('Rejects null and undefined DOM services', () => {
        expect(() => new AriaService(null as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
        expect(() => new AriaService(undefined as unknown as IJivsDomServices))
            .toThrow(new CodingError('domServices required'));
    });
});

// Static and validation updater registrations are independent, normalized by role, and replace earlier entries.
describe('AriaService updater registration', () => {
    test('Normalizes roles and replaces previous static and validation updaters', () => {
        let { ariaService } = createAriaFixture();
        let firstStatic = createStaticUpdater();
        let secondStatic = createStaticUpdater();
        let firstValidation = createValidationUpdater();
        let secondValidation = createValidationUpdater();
        ariaService.registerStaticUpdater(' CUSTOM-ROLE ', firstStatic);
        ariaService.registerStaticUpdater('custom-role', secondStatic);
        ariaService.registerValidationStateUpdater(' CUSTOM-ROLE ', firstValidation);
        ariaService.registerValidationStateUpdater('custom-role', secondValidation);

        let element = createJivsElement('Custom-Role');
        let valueHost = createStubFieldValueHost('Field');
        let state = createValidationState();
        element.jivsAriaValidationStateUpdater = secondValidation;

        expect(ariaService.applyStaticAttributes(element, valueHost)).toBe(secondStatic);
        expect(ariaService.applyValidationState(element, valueHost, state)).toBe(secondValidation);
        expect(firstStatic).not.toBe(secondStatic);
        expect(firstValidation).not.toBe(secondValidation);
    });

    test.each([
        ['null', null],
        ['undefined', undefined],
        ['empty string', ''],
        ['whitespace-only string', ' \t ']
    ])('Rejects a %s static role', (_label, role) => {
        let { ariaService } = createAriaFixture();

        expect(() => ariaService.registerStaticUpdater(
            role as string, createStaticUpdater()))
            .toThrow(CodingError);
    });

    test.each([
        ['null', null],
        ['undefined', undefined],
        ['empty string', ''],
        ['whitespace-only string', ' \t ']
    ])('Rejects a %s validation role', (_label, role) => {
        let { ariaService } = createAriaFixture();

        expect(() => ariaService.registerValidationStateUpdater(
            role as string, createValidationUpdater()))
            .toThrow(CodingError);
    });

    test('Rejects null or undefined updater instances', () => {
        let { ariaService } = createAriaFixture();

        expect(() => ariaService.registerStaticUpdater('role', null as unknown as IAriaStaticUpdater))
            .toThrow(new CodingError('updater required'));
        expect(() => ariaService.registerStaticUpdater('role', undefined as unknown as IAriaStaticUpdater))
            .toThrow(new CodingError('updater required'));
        expect(() => ariaService.registerValidationStateUpdater(
            'role', null as unknown as IAriaValidationStateUpdater))
            .toThrow(new CodingError('updater required'));
        expect(() => ariaService.registerValidationStateUpdater(
            'role', undefined as unknown as IAriaValidationStateUpdater))
            .toThrow(new CodingError('updater required'));
    });
});

// Lazy registration runs on the first registration or application request and then remains complete.
describe('AriaService.lazyRegistration', () => {
    test('Runs the callback once when an operation first needs the updater registry', () => {
        let { ariaService } = createAriaFixture();
        let callbackCount = 0;
        ariaService.lazyRegistration(() => callbackCount++);

        ariaService.applyStaticAttributes(createJivsElement('unregistered'), undefined);
        ariaService.applyStaticAttributes(createJivsElement('unregistered'), undefined);

        expect(callbackCount).toBe(1);
    });

    test('Allows the lazy callback to register an updater', () => {
        let { ariaService } = createAriaFixture();
        let calls: Array<[IJivsElement, string]> = [];
        let updater = createStaticUpdater((element, role) => calls.push([element, String(role)]));
        ariaService.lazyRegistration((service) => service.registerStaticUpdater('custom', updater));
        let element = createJivsElement('CUSTOM');

        expect(ariaService.applyStaticAttributes(element, undefined)).toBe(updater);
        expect(calls).toEqual([[element, 'custom']]);
    });
});

// Static updater selection prioritizes the appropriate specialized provider, then falls back to its normalized role.
describe('AriaService.applyStaticAttributes', () => {
    test('Requires an element with a role', () => {
        let { ariaService } = createAriaFixture();

        expect(() => ariaService.applyStaticAttributes(null as unknown as IJivsElement, undefined))
            .toThrow(new CodingError('element required'));
        expect(() => ariaService.applyStaticAttributes(undefined as unknown as IJivsElement, undefined))
            .toThrow(new CodingError('element required'));
        expect(() => ariaService.applyStaticAttributes(document.createElement('div') as IJivsElement, undefined))
            .toThrow(new CodingError('element.jivsElementRole required'));
    });

    test('Uses the editor adapter definition before a registered role updater', () => {
        let { ariaService } = createAriaFixture();
        let calls: string[] = [];
        let roleUpdater = createStaticUpdater(() => calls.push('role'));
        let adapterUpdater = createStaticUpdater(() => calls.push('adapter'));
        ariaService.registerStaticUpdater(ElementRole.editor, roleUpdater);
        let element = createJivsElement(ElementRole.editor);
        element.jivsEditorAdapterDefinition = {
            getStaticAriaUpdater: () => adapterUpdater
        } as IEditorAdapterDefinition;

        expect(ariaService.applyStaticAttributes(element, undefined)).toBe(adapterUpdater);
        expect(calls).toEqual(['adapter']);
    });

    test('Uses a field presentation for non-editor field roles', () => {
        let { ariaService } = createAriaFixture();
        let calls: string[] = [];
        let roleUpdater = createStaticUpdater(() => calls.push('role'));
        let presentationUpdater = createStaticUpdater(() => calls.push('presentation'));
        ariaService.registerStaticUpdater(ElementRole.error, roleUpdater);
        let element = createJivsElement(ElementRole.error);
        element.jivsFieldPresentation = {
            getStaticAriaUpdater: () => presentationUpdater
        } as IFieldPresentation;

        expect(ariaService.applyStaticAttributes(element, undefined)).toBe(presentationUpdater);
        expect(calls).toEqual(['presentation']);
    });

    test('Uses a form presentation for form roles', () => {
        let { ariaService } = createAriaFixture();
        let calls: string[] = [];
        let roleUpdater = createStaticUpdater(() => calls.push('role'));
        let presentationUpdater = createStaticUpdater(() => calls.push('presentation'));
        ariaService.registerStaticUpdater(ElementRole.summary, roleUpdater);
        let element = createJivsElement(ElementRole.summary);
        element.jivsFormPresentation = {
            getStaticAriaUpdater: () => presentationUpdater
        } as IFormPresentation;

        expect(ariaService.applyStaticAttributes(element, undefined)).toBe(presentationUpdater);
        expect(calls).toEqual(['presentation']);
    });

    test('Falls back to a normalized role updater and passes its normalized role and value host', () => {
        let { ariaService } = createAriaFixture();
        let valueHost = createStubFieldValueHost('Email');
        let applied: Array<[IJivsElement, ElementRole | string, IFieldValueHost | undefined]> = [];
        let updater = createStaticUpdater((element, role, host) => applied.push([element, role, host]));
        ariaService.registerStaticUpdater(' custom-role ', updater);
        let element = createJivsElement('CUSTOM-ROLE');

        expect(ariaService.applyStaticAttributes(element, valueHost)).toBe(updater);
        expect(applied).toEqual([[element, 'custom-role', valueHost]]);
    });

    test('Converts a null value host to undefined for the updater', () => {
        let { ariaService } = createAriaFixture();
        let receivedHost: IFieldValueHost | undefined = createStubFieldValueHost('previous');
        let updater = createStaticUpdater((_element, _role, valueHost) => receivedHost = valueHost);
        ariaService.registerStaticUpdater('role', updater);

        ariaService.applyStaticAttributes(createJivsElement('role'), null);

        expect(receivedHost).toBeUndefined();
    });

    test('Returns null and logs details when no static updater applies', () => {
        let { ariaService, logger } = createAriaFixture();
        let element = createJivsElement('unknown-role');
        element.id = 'notice';

        expect(ariaService.applyStaticAttributes(element, undefined)).toBeNull();
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Debug);
        expect(logger.calls[0].details?.message)
            .toBe("No static ARIA updater could be resolved for element 'notice' with role: unknown-role");
        expect(logger.calls[0].details?.feature).toBe('Dom');
        expect(logger.calls[0].details?.type).toBe(ariaService);
    });
});

// Validation updater choice is installed on its target element and applied with the supplied state.
describe('AriaService.applyValidationState', () => {
    test('Rejects a null or undefined element', () => {
        let { ariaService } = createAriaFixture();
        let valueHost = createStubFieldValueHost('Email');
        let state = createValidationState();

        expect(() => ariaService.applyValidationState(null as unknown as IJivsElement, valueHost, state))
            .toThrow(new CodingError('element required'));
        expect(() => ariaService.applyValidationState(undefined as unknown as IJivsElement, valueHost, state))
            .toThrow(new CodingError('element required'));
    });

    test('Uses and returns the updater installed on the element', () => {
        let { ariaService } = createAriaFixture();
        let valueHost = createStubFieldValueHost('Email');
        let state = createValidationState();
        let calls: Array<[IJivsElement, IFieldValueHost, ValueHostValidationState]> = [];
        let updater = createValidationUpdater((element, host, currentState) =>
            calls.push([element, host, currentState]));
        let element = createJivsElement(ElementRole.editor);
        element.jivsAriaValidationStateUpdater = updater;

        expect(ariaService.applyValidationState(element, valueHost, state)).toBe(updater);
        expect(calls).toEqual([[element, valueHost, state]]);
    });

    test('Returns null and logs when no updater was installed', () => {
        let { ariaService, logger } = createAriaFixture();
        let valueHost = createStubFieldValueHost('Email');
        let element = createJivsElement('unknown-role');

        expect(ariaService.applyValidationState(element, valueHost, createValidationState())).toBeNull();
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Debug);
        expect(logger.calls[0].details?.message)
            .toBe("No Validation State ARIA updater could be resolved for element 'Email' with role: unknown-role");
        expect(logger.calls[0].details?.feature).toBe('Dom');
        expect(logger.calls[0].details?.type).toBe(ariaService);
    });
});

// Installation applies ARIA to registry-selected anchors, resolves message IDs before initial state, and handles form roles.
describe('AriaService.install', () => {
    test('Rejects a null or undefined registry', () => {
        let { ariaService } = createAriaFixture();

        expect(() => ariaService.install(null as unknown as IElementRegistry))
            .toThrow(new CodingError('registry required'));
        expect(() => ariaService.install(undefined as unknown as IElementRegistry))
            .toThrow(new CodingError('registry required'));
    });

    test('Installs a distinct resolved editor Jivs element and passes its message ID to initial validation', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let originalElement = createJivsElement(ElementRole.editor);
        let jivsElement = createJivsElement(ElementRole.editor);
        addEditor(registry, valueHost, originalElement, jivsElement);
        let errorElement = createJivsElement(ElementRole.ariaError);
        addFieldElement(registry, valueHost, errorElement, ElementRole.ariaError);
        let staticCalls: IJivsElement[] = [];
        let validationCalls: Array<[IJivsElement, string | undefined]> = [];
        let staticUpdater = createStaticUpdater((element) => staticCalls.push(element));
        let validationUpdater = createValidationUpdater((element) =>
            validationCalls.push([element, jivsElement.jivsErrorMessageId]));
        jivsElement.jivsEditorAdapterDefinition = {
            getStaticAriaUpdater: () => staticUpdater,
            getAriaValidationStateUpdater: () => validationUpdater
        } as IEditorAdapterDefinition;

        ariaService.install(registry);

        expect(staticCalls).toContain(jivsElement);
        expect(staticCalls).not.toContain(originalElement);
        expect(jivsElement.jivsAriaValidationStateUpdater).toBe(validationUpdater);
        expect(errorElement.id).toMatch(/^error-email-[a-z0-9]{7}$/);
        expect(jivsElement.jivsErrorMessageId).toBe(errorElement.id);
        expect(validationCalls).toEqual([[jivsElement, errorElement.id]]);
    });

    test('Preserves an existing error element ID and resets the editor message ID when no error anchor exists', () => {
        let { ariaService } = createAriaFixture();
        let withError = createResolvedField('with-error');
        let editorWithError = createJivsElement(ElementRole.editor);
        let errorElement = createJivsElement(ElementRole.error);
        errorElement.id = 'existing-error-id';
        addEditor(withError.registry, withError.valueHost, editorWithError);
        addFieldElement(withError.registry, withError.valueHost, errorElement, ElementRole.error);

        let withoutError = createResolvedField('without-error');
        let editorWithoutError = createJivsElement(ElementRole.editor);
        editorWithoutError.jivsErrorMessageId = 'stale-id';
        addEditor(withoutError.registry, withoutError.valueHost, editorWithoutError);

        let combinedRegistry = {
            getResolvedElementIdentifiers: () => [
                ...withError.registry.getResolvedElementIdentifiers(),
                ...withoutError.registry.getResolvedElementIdentifiers()
            ],
            getFieldAriaElementAnchors: (identifier: string) =>
                identifier === 'with-error'
                    ? withError.registry.getFieldAriaElementAnchors(identifier)
                    : withoutError.registry.getFieldAriaElementAnchors(identifier),
            [Symbol.iterator]: function* () {
                yield* withError.registry;
                yield* withoutError.registry;
            }
        } as unknown as IElementRegistry;

        ariaService.install(combinedRegistry);

        expect(errorElement.id).toBe('existing-error-id');
        expect(editorWithError.jivsErrorMessageId).toBe('existing-error-id');
        expect(editorWithoutError.jivsErrorMessageId).toBeUndefined();
    });

    test('Uses the aria-error anchor in preference to the visible error role', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        let visibleError = createJivsElement(ElementRole.error);
        let ariaError = createJivsElement(ElementRole.ariaError);
        addEditor(registry, valueHost, editor);
        addFieldElement(registry, valueHost, visibleError, ElementRole.error);
        addFieldElement(registry, valueHost, ariaError, ElementRole.ariaError);
        let visited: IJivsElement[] = [];
        ariaService.registerStaticUpdater(ElementRole.editor, createStaticUpdater((element) => visited.push(element)));
        ariaService.registerStaticUpdater(ElementRole.error, createStaticUpdater((element) => visited.push(element)));
        ariaService.registerStaticUpdater(ElementRole.ariaError, createStaticUpdater((element) => visited.push(element)));

        ariaService.install(registry);

        expect(visited).toContain(editor);
        expect(visited).toContain(ariaError);
        expect(visited).not.toContain(visibleError);
    });

    test('Falls back to registered validation updaters when specialized providers return null', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        let errorElement = createJivsElement(ElementRole.error);
        addEditor(registry, valueHost, editor);
        addFieldElement(registry, valueHost, errorElement, ElementRole.error);
        let applied: IJivsElement[] = [];
        let editorRoleUpdater = createValidationUpdater((element) => applied.push(element));
        let errorRoleUpdater = createValidationUpdater((element) => applied.push(element));
        ariaService.registerValidationStateUpdater(ElementRole.editor, editorRoleUpdater);
        ariaService.registerValidationStateUpdater(ElementRole.error, errorRoleUpdater);
        editor.jivsEditorAdapterDefinition = {
            getStaticAriaUpdater: () => null,
            getAriaValidationStateUpdater: () => null
        } as IEditorAdapterDefinition;
        errorElement.jivsFieldPresentation = {
            getStaticAriaUpdater: () => null,
            getAriaValidationStateUpdater: () => null
        } as IFieldPresentation;

        ariaService.install(registry);

        expect(editor.jivsAriaValidationStateUpdater).toBe(editorRoleUpdater);
        expect(errorElement.jivsAriaValidationStateUpdater).toBe(errorRoleUpdater);
        expect(applied).toEqual([editor, errorElement]);
    });

    test('Applies static ARIA to form elements through the configured ariaService', () => {
        let { ariaService, domServices } = createAriaFixture();
        let element = createJivsElement(ElementRole.summary);
        let record: IFormElementRegistryRecord = {
            kind: 'form',
            role: ElementRole.summary,
            element,
            fieldValueHost: null,
            elementIdentifier: null,
            presentationOptions: null
        };
        let registryWithForm = {
            getResolvedElementIdentifiers: () => [],
            [Symbol.iterator]: function* () {
                yield record;
            }
        } as unknown as IElementRegistry;
        let calls: IJivsElement[] = [];
        ariaService.registerStaticUpdater(ElementRole.summary,
            createStaticUpdater((target) => calls.push(target)));
        domServices.ariaService = ariaService;

        ariaService.install(registryWithForm);

        expect(calls).toEqual([element]);
    });
});

// Install only touches the registry-selected anchors and respects prior installation.
describe('AriaService.install element selection and repeat installs', () => {
    test('Applies ARIA only to the editor and error anchors, not other field roles', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        let errorElement = createJivsElement(ElementRole.error);
        let label = createJivsElement(ElementRole.label);
        addEditor(registry, valueHost, editor);
        addFieldElement(registry, valueHost, errorElement, ElementRole.error);
        addFieldElement(registry, valueHost, label, ElementRole.label);
        let visited: IJivsElement[] = [];
        for (let role of [ElementRole.editor, ElementRole.error, ElementRole.label])
            ariaService.registerStaticUpdater(role, createStaticUpdater((element) => visited.push(element)));

        ariaService.install(registry);

        expect(visited).toEqual([editor, errorElement]);
        expect(label.jivsAriaValidationStateUpdater).toBeUndefined();
    });

    test('Skips an editor whose Jivs element has not been resolved but still installs the error element', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        let errorElement = createJivsElement(ElementRole.error);
        let record = addEditor(registry, valueHost, editor);
        (record as { jivsElement: IJivsElement | null }).jivsElement = null;
        addFieldElement(registry, valueHost, errorElement, ElementRole.error);
        let visited: IJivsElement[] = [];
        ariaService.registerStaticUpdater(ElementRole.editor, createStaticUpdater((element) => visited.push(element)));
        ariaService.registerStaticUpdater(ElementRole.error, createStaticUpdater((element) => visited.push(element)));

        expect(() => ariaService.install(registry)).not.toThrow();

        expect(visited).toEqual([errorElement]);
        expect(editor.jivsAriaValidationStateUpdater).toBeUndefined();
    });

    test('Installs a field with no error element and leaves the editor without a message ID', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        addEditor(registry, valueHost, editor);
        let validationCalls: IJivsElement[] = [];
        ariaService.registerValidationStateUpdater(ElementRole.editor,
            createValidationUpdater((element) => validationCalls.push(element)));

        ariaService.install(registry);

        expect(editor.jivsErrorMessageId).toBeUndefined();
        expect(validationCalls).toEqual([editor]);
    });

    test('Gives each field its own error message ID and message ID assignment', () => {
        let { ariaService } = createAriaFixture();
        let valueHosts: Record<string, IFieldValueHost> = {};
        for (let identifier of ['email', 'phone'])
            valueHosts[identifier] = {
                ...createStubFieldValueHost(identifier, identifier),
                currentValidationState: createValidationState()
            } as IFieldValueHost;
        let manager = {
            getFieldByElementIdentifier: (candidate: string) => valueHosts[candidate.toLowerCase()] ?? null
        } as unknown as IValueHostsManager;
        let registry = new ElementRegistry(manager);
        let elements: Record<string, { editor: IJivsElement, error: IJivsElement }> = {};
        for (let identifier of ['email', 'phone'])
        {
            let editor = createJivsElement(ElementRole.editor);
            let errorElement = createJivsElement(ElementRole.error);
            addEditor(registry, valueHosts[identifier], editor);
            addFieldElement(registry, valueHosts[identifier], errorElement, ElementRole.error);
            elements[identifier] = { editor, error: errorElement };
        }

        ariaService.install(registry);

        expect(elements.email.error.id).toMatch(/^error-email-/);
        expect(elements.phone.error.id).toMatch(/^error-phone-/);
        expect(elements.email.editor.jivsErrorMessageId).toBe(elements.email.error.id);
        expect(elements.phone.editor.jivsErrorMessageId).toBe(elements.phone.error.id);
    });

    test('Does not repeat static installation on a second install but reapplies validation state and keeps the ID', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        let errorElement = createJivsElement(ElementRole.error);
        addEditor(registry, valueHost, editor);
        addFieldElement(registry, valueHost, errorElement, ElementRole.error);
        let staticCalls: IJivsElement[] = [];
        let validationCalls: IJivsElement[] = [];
        for (let role of [ElementRole.editor, ElementRole.error])
        {
            ariaService.registerStaticUpdater(role, createStaticUpdater((element) => staticCalls.push(element)));
            ariaService.registerValidationStateUpdater(role,
                createValidationUpdater((element) => validationCalls.push(element)));
        }

        ariaService.install(registry);
        let generatedId = errorElement.id;
        ariaService.install(registry);

        expect(staticCalls).toEqual([editor, errorElement]);
        expect(validationCalls).toEqual([editor, errorElement, editor, errorElement]);
        expect(errorElement.id).toBe(generatedId);
        expect(editor.jivsErrorMessageId).toBe(generatedId);
    });

    test('Stores null when no validation updater applies, so later applyValidationState logs and does nothing', () => {
        let { ariaService, logger } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        addEditor(registry, valueHost, editor);

        ariaService.install(registry);

        expect(editor.jivsAriaValidationStateUpdater).toBeNull();
        logger.calls.length = 0;
        expect(ariaService.applyValidationState(editor, valueHost, createValidationState())).toBeNull();
        expect(logger.calls).toHaveLength(1);
    });

    test('Runs the lazy registration before installing so registered updaters are used', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        addEditor(registry, valueHost, editor);
        let visited: IJivsElement[] = [];
        ariaService.lazyRegistration((service) =>
            service.registerStaticUpdater(ElementRole.editor, createStaticUpdater((element) => visited.push(element))));

        ariaService.install(registry);

        expect(visited).toEqual([editor]);
    });
});

// Field presentations supply validation updaters for non-editor roles only.
describe('AriaService validation updater resolution during install', () => {
    test('Uses the field presentation updater for an error element', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        let errorElement = createJivsElement(ElementRole.error);
        addEditor(registry, valueHost, editor);
        addFieldElement(registry, valueHost, errorElement, ElementRole.error);
        let presentationUpdater = createValidationUpdater();
        errorElement.jivsFieldPresentation = {
            getStaticAriaUpdater: () => null,
            getAriaValidationStateUpdater: () => presentationUpdater
        } as IFieldPresentation;
        ariaService.registerValidationStateUpdater(ElementRole.error, createValidationUpdater());

        ariaService.install(registry);

        expect(errorElement.jivsAriaValidationStateUpdater).toBe(presentationUpdater);
    });

    test('Ignores a field presentation on the editor and uses the role updater', () => {
        let { ariaService } = createAriaFixture();
        let { valueHost, registry } = createResolvedField();
        let editor = createJivsElement(ElementRole.editor);
        addEditor(registry, valueHost, editor);
        editor.jivsFieldPresentation = {
            getStaticAriaUpdater: () => createStaticUpdater(),
            getAriaValidationStateUpdater: () => createValidationUpdater()
        } as IFieldPresentation;
        let roleUpdater = createValidationUpdater();
        ariaService.registerValidationStateUpdater(ElementRole.editor, roleUpdater);

        ariaService.install(registry);

        expect(editor.jivsAriaValidationStateUpdater).toBe(roleUpdater);
    });
});
