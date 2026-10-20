/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../../src/Interfaces/AriaUpdaters';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import {
    FieldPresentationBase,
    FieldPresentationBaseOptions
} from '../../src/FieldPresentations/FieldPresentationBase';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ITestOptions extends FieldPresentationBaseOptions
{
    testOption?: string;
}

class Publicify_FieldPresentationBase extends FieldPresentationBase<ITestOptions>
{
    public applyCalls: {
        valueHost: IFieldValueHost;
        state: ValueHostValidationState;
    }[] = [];

    public constructor(
        element: HTMLElement,
        options?: ITestOptions,
        jivsElement?: IJivsElement | null
    )
    {
        super(element, options, jivsElement);
    }

    public get publicify_element(): HTMLElement
    {
        return this.element;
    }

    public get publicify_jivsElement(): IJivsElement
    {
        return this.jivsElement;
    }

    public get publicify_domServices(): IJivsDomServices
    {
        return this.domServices;
    }

    protected override getGlobalOptions(): object | undefined
    {
        return undefined;
    }

    public apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        this.applyCalls.push({ valueHost: valueHost, state: state });
    }
}

function createDomServices(): IJivsDomServices
{
    return createMockJivsDomServices();
}

function createValueHostsManager(domServices: IJivsDomServices): IValueHostsManager
{
    return {
        services: { domServices: domServices }
    } as unknown as IValueHostsManager;
}

// The base retains the presentation element and optional Jivs element supplied to its adapter superclass.
describe('FieldPresentationBase constructor', () => {
    test('Uses the presentation element as the Jivs element when none is supplied', () => {
        let element = document.createElement('div');
        let presentation = new Publicify_FieldPresentationBase(element);

        expect(presentation.publicify_element).toBe(element);
        expect(presentation.publicify_jivsElement).toBe(element);
    });

    test('Retains a separately supplied Jivs element', () => {
        let element = document.createElement('div');
        let jivsElement = document.createElement('span') as IJivsElement;
        let presentation = new Publicify_FieldPresentationBase(element, undefined, jivsElement);

        expect(presentation.publicify_element).toBe(element);
        expect(presentation.publicify_jivsElement).toBe(jivsElement);
    });

    test('Treats a null Jivs element as omitted', () => {
        let element = document.createElement('div');
        let presentation = new Publicify_FieldPresentationBase(element, undefined, null);

        expect(presentation.publicify_jivsElement).toBe(element);
    });
});

// apply() is the required field-presentation operation and receives the current host and validation state.
describe('FieldPresentationBase.apply contract', () => {
    test('Makes the supplied host and state available to the concrete presentation implementation', () => {
        let presentation = new Publicify_FieldPresentationBase(document.createElement('div'));
        let valueHost = {} as IFieldValueHost;
        let validationState = {
            isValid: false,
            issuesFound: [{ errorMessage: 'Invalid' }]
        } as ValueHostValidationState;

        presentation.apply(valueHost, validationState);

        expect(presentation.applyCalls).toHaveLength(1);
        expect(presentation.applyCalls[0].valueHost).toBe(valueHost);
        expect(presentation.applyCalls[0].state).toBe(validationState);
    });
});

// Presentations without specialized accessibility behavior return null so default ARIA updaters can be used.
describe('FieldPresentationBase ARIA updater defaults', () => {
    test('Returns null for both optional ARIA updaters', () => {
        let presentation = new Publicify_FieldPresentationBase(document.createElement('div'));

        expect(presentation.getStaticAriaUpdater()).toBeNull();
        expect(presentation.getAriaValidationStateUpdater()).toBeNull();
    });
});

// Field presentations use the inherited initialization lifecycle to acquire DOM services and apply variation classes.
describe('FieldPresentationBase.init', () => {
    test('Initializes DOM services and applies configured variation classes', () => {
        let element = document.createElement('div');
        let presentation = new Publicify_FieldPresentationBase(
            element,
            { variationClasses: 'compact highlighted' }
        );
        let domServices = createDomServices();

        presentation.init(createValueHostsManager(domServices));

        expect(element.className).toBe('compact highlighted');
        expect(presentation.publicify_domServices).toBe(domServices);
    });
});

// dispose() delegates cleanup to the presentation and adapter base classes.
describe('FieldPresentationBase.dispose', () => {
    test('Clears inherited DOM-service state', () => {
        let presentation = new Publicify_FieldPresentationBase(document.createElement('div'));
        presentation.init(createValueHostsManager(createDomServices()));

        presentation.dispose();

        expect(() => presentation.publicify_domServices).toThrow('DOM services not initialized.');
    });
});
