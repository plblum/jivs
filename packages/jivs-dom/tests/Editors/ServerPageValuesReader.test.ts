/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { SetValueOptions } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { ValidationStatus } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { TestingJivsServices } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import { EditorReader } from '../../src/Editors/EditorReader';
import { ServerPageValuesReader } from '../../src/Editors/ServerPageValuesReader';
import type { ITextValueAdapter, IValueAdapter } from '../../src/Interfaces/Adapters';
import type { IEditorAdapterDefinition } from '../../src/Interfaces/EditorAdapterDefinitions';
import type { EditorInstallOptions } from '../../src/Interfaces/EditorInstaller';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createJivsServicesForTesting } from '../TestSupport/CreateJivsServicesForTesting';
import { createFieldValueHostConfig } from '../TestSupport/FieldValueHostTestFunctions';
// This ensures that references to JivsServices include the domServices property
// for the VSCode environment. Not needed for compiling or runtime
import { JivsDomServicesInstaller } from '../../src/Services/JivsDomServicesInstaller';
new JivsDomServicesInstaller();

/**
 * Definition fake. Like the real definitions, sendValue passes the options it receives
 * (from the reader) to setTextValue, so the reader's choices (reset, skipIfUnchanged, ...) take effect.
 * The text it sends plays the role of the value the server put into the HTML.
 */
class ServerValueDefinition implements IEditorAdapterDefinition
{
    public readonly adapterKey = 'serverValue';
    public readonly priority = 10;
    public recommendedFieldPresentationName: string | null | undefined = null;
    public domServices!: IJivsDomServices;

    constructor(public textFromServer: string)
    {
    }
    public sendValue(valueHost: IFieldValueHost, _editor: HTMLElement, _jivsElement: IJivsElement,
        options: SetValueOptions): void
    {
        valueHost.setTextValue(this.textFromServer, options);
    }
    public identifyEditor(_valueHost: IFieldValueHost, jivsElement: IJivsElement): HTMLElement
    {
        return jivsElement;
    }
    public matches(_valueHost: IFieldValueHost, _element: HTMLElement): boolean
    {
        return true;
    }
    public identifyJivsElement(_valueHost: IFieldValueHost, element: HTMLElement): IJivsElement
    {
        return element as IJivsElement;
    }
    public attachToSendValues(_valueHost: IFieldValueHost, _editor: HTMLElement,
        _jivsElement: IJivsElement, _options: EditorInstallOptions): void
    {
    }
    public attachEventHandler(_jivsElement: IJivsElement, _valueHost: IFieldValueHost,
        _eventName: string, _handler: EventListener): void
    {
    }
    public createTextValueAdapter(): ITextValueAdapter | null
    {
        return null;
    }
    public createValueAdapter(): IValueAdapter | null
    {
        return null;
    }
    public getStaticAriaUpdater(): null
    {
        return null;
    }
    public getAriaValidationStateUpdater(): null
    {
        return null;
    }
}

interface IRoundTripSetup
{
    services: TestingJivsServices;
    valueHostsManager: ValueHostsManager;
    registry: IElementRegistry;
    field1: IFieldValueHost;
    field2: IFieldValueHost;
    /** Everything the manager's callbacks reported, in order: 'form', 'field:<name>' or 'text:<name>'. */
    events: string[];
}

/**
 * Emulates the browser side of a server page round trip.
 * Before the submit, Field1 was edited to 'abc' and Field2 to 'old'; both were validated (Valid)
 * and the manager's captured state was saved. The returned manager is a NEW instance built from
 * that captured state, as the page does after the server regenerates it.
 * Restoring state fires no callbacks, so events starts empty; the callbacks are attached after the restore.
 */
function setupRoundTrip(): IRoundTripSetup
{
    let firstServices = createJivsServicesForTesting({ loggerLevel: LoggingLevel.Warn, registerDataTypeParsers: true });
    let configs = [createFieldValueHostConfig(1), createFieldValueHostConfig(2)];
    let firstManager = new ValueHostsManager({
        services: firstServices as any,   // build vs src copies of jivs-dom types are incompatible
        valueHostConfigs: configs as any
    });
    firstManager.getFieldValueHost('Field1')!.setTextValue('abc', { validate: true });
    firstManager.getFieldValueHost('Field2')!.setTextValue('old', { validate: true });
    let capturedState = firstManager.captureState();

    let services = createJivsServicesForTesting({ loggerLevel: LoggingLevel.Warn, registerDataTypeParsers: true });
    let valueHostsManager = new ValueHostsManager({
        services: services as any,
        valueHostConfigs: configs as any,
        capturedState: capturedState
    });
    let events: string[] = [];
    valueHostsManager.onTextValueChanged = (vh) => { events.push('text:' + vh.getName()); };
    valueHostsManager.onValueHostValidationStateChanged = (vh) => { events.push('field:' + vh.getName()); };
    valueHostsManager.onValidationStateChanged = () => { events.push('form'); };
    return {
        services,
        valueHostsManager,
        registry: services.domServices.getElementRegistry(valueHostsManager),
        field1: valueHostsManager.getFieldValueHost('Field1')!,
        field2: valueHostsManager.getFieldValueHost('Field2')!,
        events
    };
}

/** Adds the editor the server generated for the field. */
function addServerEditor(registry: IElementRegistry, valueHost: IFieldValueHost, textFromServer: string): void
{
    let element = document.createElement('input') as IJivsElement;
    registry.addEditor(element, valueHost.getElementIdentifier());
    element.jivsEditorAdapterDefinition = new ServerValueDefinition(textFromServer);
}

// ServerPageValuesReader is an EditorReader, so EditorReader's own tests cover how values are transferred.
// These tests cover what it adds: drawing the restored validation state once the values are read.
describe('ServerPageValuesReader as an EditorReader', () => {
    test('Is an EditorReader and transfers the server values into the FieldValueHosts', () => {
        let { valueHostsManager, registry, field1, field2 } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');
        addServerEditor(registry, field2, 'new');

        let testItem = new ServerPageValuesReader(valueHostsManager);
        testItem.read();

        expect(testItem).toBeInstanceOf(EditorReader);
        expect(field1.getTextValue()).toBe('abc');
        expect(field2.getTextValue()).toBe('new');
    });
});

// After a round trip, restoring capturedState fires no callbacks. The broadcast at the end of read()
// is what lets the presentations, error displays and summary show the restored state.
describe('ServerPageValuesReader.read broadcasting', () => {
    test('Broadcasts the form state, then each enabled field state, after the values are read and validated', () => {
        let { services, valueHostsManager, registry, field1, field2, events } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');
        addServerEditor(registry, field2, 'new');

        new ServerPageValuesReader(valueHostsManager).read();

        // The last three events are the broadcast: the form first, then each field.
        // validate() ran before it, so anything earlier is not part of the broadcast.
        expect(events.slice(-3)).toEqual(['form', 'field:Field1', 'field:Field2']);
        expect(services.loggingService.entryCount).toBe(0);
    });

    test('Does not broadcast text values, because the editors are the source of the values', () => {
        let { valueHostsManager, registry, field1, field2, events } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');
        addServerEditor(registry, field2, 'new');

        new ServerPageValuesReader(valueHostsManager).read();

        expect(events.filter((e) => e.startsWith('text:'))).toEqual([]);
        expect(events.length).toBeGreaterThan(0);   // other callbacks did run
    });

    test('A field whose server text is unchanged keeps its captured state and is still drawn', () => {
        let { valueHostsManager, registry, field1, field2, events } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');   // same as before the submit
        addServerEditor(registry, field2, 'new');

        new ServerPageValuesReader(valueHostsManager).read();

        expect(field1.validationStatus).toBe(ValidationStatus.Valid);
        // Field1 was skipped by skipIfUnchanged, so its only callback is the broadcast.
        expect(events.filter((e) => e === 'field:Field1')).toEqual(['field:Field1']);
    });

    test('A field whose server text changed is reset, then validated by the preliminary pass', () => {
        let { valueHostsManager, registry, field1, field2 } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');
        addServerEditor(registry, field2, 'new');

        new ServerPageValuesReader(valueHostsManager).read();

        expect(field2.getTextValue()).toBe('new');
        expect(field2.validationStatus).toBe(ValidationStatus.Valid);
        expect(field2.isValid).toBe(true);
    });

    test('A field without an editor is disabled and is left out of the broadcast', () => {
        let { valueHostsManager, registry, field1, field2, events } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');
        // The server removed Field2's editor. FormInstaller disables such fields.
        field2.setEnabled(false);
        events.length = 0;   // disabling may itself notify; only the reader's callbacks matter here

        new ServerPageValuesReader(valueHostsManager).read();

        expect(events.filter((e) => e.endsWith('Field2'))).toEqual([]);
        expect(events.filter((e) => e === 'field:Field1').length).toBeGreaterThan(0);
    });
});

// options.preliminaryValidation = false means the caller will validate and show state later,
// so the reader neither validates nor broadcasts.
describe('ServerPageValuesReader.read with preliminaryValidation false', () => {
    test('Neither validates nor broadcasts, leaving changed fields reset to NotAttempted', () => {
        let { services, valueHostsManager, registry, field1, field2, events } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');
        addServerEditor(registry, field2, 'new');

        new ServerPageValuesReader(valueHostsManager, { preliminaryValidation: false }).read();

        // The only callback is Field2's own reset notification. No form-level event and no Field1 event
        // means the broadcast did not run.
        expect(events).toEqual(['field:Field2']);
        expect(field1.validationStatus).toBe(ValidationStatus.Valid);          // skipped, captured state retained
        expect(field2.validationStatus).toBe(ValidationStatus.NotAttempted);   // reset, not validated
        expect(services.loggingService.entryCount).toBe(0);
    });

    test('preliminaryValidation true behaves the same as the default', () => {
        let { valueHostsManager, registry, field1, field2, events } = setupRoundTrip();
        addServerEditor(registry, field1, 'abc');
        addServerEditor(registry, field2, 'new');

        new ServerPageValuesReader(valueHostsManager, { preliminaryValidation: true }).read();

        expect(events.slice(-3)).toEqual(['form', 'field:Field1', 'field:Field2']);
    });
});
