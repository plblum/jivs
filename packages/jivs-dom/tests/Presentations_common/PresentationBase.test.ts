/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import {
    PresentationBase,
    PresentationBaseOptions
} from '../../src/Presentations_common/PresentationBase';
import type { IJivsDomServices, JivsDomGlobalOptions } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ITestOptions extends PresentationBaseOptions
{
    defaulted?: string;
    globalOnly?: string;
    instanceOnly?: string;
}

interface IExpandedGlobalOptions extends JivsDomGlobalOptions
{
    presentationTest?: ITestOptions;
}

class Publicify_PresentationBase extends PresentationBase<ITestOptions>
{
    public constructor(
        element: HTMLElement,
        options?: ITestOptions,
        private readonly redirectedElement?: HTMLElement,
        private readonly persistentClassNames: string[] = []
    )
    {
        super(element, options);
    }

    public get publicify_element(): HTMLElement
    {
        return this.element;
    }

    public get publicify_options(): ITestOptions
    {
        return this.options;
    }

    public get publicify_domServices(): IJivsDomServices
    {
        return this.domServices;
    }

    public get publicify_presentationElement(): HTMLElement
    {
        return this.presentationElement;
    }

    public publicify_addClasses(element: HTMLElement, classes: string[]): void
    {
        this.addClasses(element, classes);
    }

    public publicify_removeClasses(element: HTMLElement, classes: string[]): void
    {
        this.removeClasses(element, classes);
    }

    public override init(valueHostsManager: IValueHostsManager): void
    {
        super.init(valueHostsManager);
    }

    protected override getOptionDefaults(): Partial<ITestOptions>
    {
        return {
            ...super.getOptionDefaults(),
            defaulted: 'component default'
        };
    }

    protected override getGlobalOptions(): object | undefined
    {
        return (<IExpandedGlobalOptions>this.domServices.options).presentationTest;
    }

    protected override gatherPersistentClasses(list: string[]): void
    {
        super.gatherPersistentClasses(list);
        list.push(...this.persistentClassNames);
    }

    protected override resolvePresentationElement(element: HTMLElement): HTMLElement
    {
        return this.redirectedElement ?? super.resolvePresentationElement(element);
    }
}

function createDomServices(globalOptions?: ITestOptions): IJivsDomServices
{
    let options = {
        ...createMockJivsDomServices().options,
        presentationTest: globalOptions
    } as IExpandedGlobalOptions;
    return createMockJivsDomServices({ options: options });
}

function createValueHostsManager(domServices?: IJivsDomServices): IValueHostsManager
{
    let services = domServices ? { domServices: domServices } : {};
    return { services: services as IJivsServices } as IValueHostsManager;
}

// Constructor and option access retain caller values while keeping a separate top-level options object.
describe('PresentationBase constructor and options', () => {
    test('Uses an empty options object when options are omitted', () => {
        let presentation = new Publicify_PresentationBase(document.createElement('div'));

        expect(presentation.publicify_options).toEqual({});
    });

    test('Copies supplied options so later top-level changes do not replace presentation values', () => {
        let suppliedOptions: ITestOptions = { instanceOnly: 'before' };
        let presentation = new Publicify_PresentationBase(
            document.createElement('div'),
            suppliedOptions
        );

        suppliedOptions.instanceOnly = 'after';

        expect(presentation.publicify_options.instanceOnly).toBe('before');
        expect(presentation.publicify_options).not.toBe(suppliedOptions);
    });
});

// init() obtains DOM services, resolves options in documented precedence, then applies classes to the presentation element.
describe('PresentationBase.init', () => {
    test('Merges defaults, global options, and instance options in precedence order', () => {
        let element = document.createElement('div');
        let presentation = new Publicify_PresentationBase(element, {
            defaulted: 'instance value',
            instanceOnly: 'instance value'
        });
        let domServices = createDomServices({
            defaulted: 'global value',
            globalOnly: 'global value'
        });

        presentation.init(createValueHostsManager(domServices));

        expect(presentation.publicify_options).toEqual({
            defaulted: 'instance value',
            globalOnly: 'global value',
            instanceOnly: 'instance value'
        });
        expect(presentation.publicify_domServices).toBe(domServices);
    });

    test('Applies persistent classes before variation classes supplied as a string', () => {
        let element = document.createElement('div');
        let presentation = new Publicify_PresentationBase(
            element,
            { variationClasses: 'variant-one variant-two' },
            undefined,
            ['persistent-one', 'persistent-two']
        );

        presentation.init(createValueHostsManager(createDomServices()));

        expect(element.className).toBe(
            'persistent-one persistent-two variant-one variant-two'
        );
    });

    test('Applies variation classes supplied as an array after persistent classes', () => {
        let element = document.createElement('div');
        let presentation = new Publicify_PresentationBase(
            element,
            { variationClasses: ['variant-one', 'variant-two'] },
            undefined,
            ['persistent']
        );

        presentation.init(createValueHostsManager(createDomServices()));

        expect(element.className).toBe('persistent variant-one variant-two');
    });

    test('Does not change the element when variation classes are null or empty', () => {
        let nullElement = document.createElement('div');
        let nullPresentation = new Publicify_PresentationBase(
            nullElement,
            { variationClasses: null }
        );
        let emptyElement = document.createElement('div');
        let emptyPresentation = new Publicify_PresentationBase(
            emptyElement,
            { variationClasses: '' }
        );

        nullPresentation.init(createValueHostsManager(createDomServices()));
        emptyPresentation.init(createValueHostsManager(createDomServices()));

        expect(nullElement.className).toBe('');
        expect(emptyElement.className).toBe('');
    });

    test('Throws a clear error when the value-host manager has no DOM services', () => {
        let presentation = new Publicify_PresentationBase(document.createElement('div'));

        expect(() => presentation.init(createValueHostsManager())).toThrow('domServices required');
    });
});

// Presentation helpers resolve the target element and manipulate only the requested classes.
describe('PresentationBase element and class helpers', () => {
    test('Uses the original element when no alternate presentation element is provided', () => {
        let element = document.createElement('div');
        let presentation = new Publicify_PresentationBase(element);

        expect(presentation.publicify_element).toBe(element);
        expect(presentation.publicify_presentationElement).toBe(element);
    });

    test('Uses a resolved element for presentation styling while retaining the adapter element', () => {
        let element = document.createElement('div');
        let redirectedElement = document.createElement('span');
        let presentation = new Publicify_PresentationBase(
            element,
            undefined,
            redirectedElement,
            ['persistent']
        );

        presentation.init(createValueHostsManager(createDomServices()));

        expect(presentation.publicify_element).toBe(element);
        expect(element.className).toBe('');
        expect(redirectedElement.className).toBe('persistent');
        expect(presentation.publicify_presentationElement).toBe(redirectedElement);
    });

    test('Adds and removes the requested classes without disturbing other classes', () => {
        let element = document.createElement('div');
        element.className = 'keep remove-me';
        let presentation = new Publicify_PresentationBase(document.createElement('div'));

        presentation.publicify_addClasses(element, ['added', 'another']);
        presentation.publicify_removeClasses(element, ['remove-me', 'another']);

        expect(element.className).toBe('keep added');
    });
});

// The public style-class converter handles arrays, whitespace-delimited strings, and absent values.
describe('PresentationBase.toStyleClassNameArray', () => {
    test('Clones arrays so callers cannot mutate the original through the result', () => {
        let classes = ['one', 'two'];

        let result = PresentationBase.toStyleClassNameArray(classes);
        result.push('three');

        expect(result).toEqual(['one', 'two', 'three']);
        expect(classes).toEqual(['one', 'two']);
        expect(PresentationBase.toStyleClassNameArray([])).toEqual([]);
    });

    test('Splits a space-delimited string and removes empty class names', () => {
        expect(PresentationBase.toStyleClassNameArray(' one  two ')).toEqual(['one', 'two']);
        expect(PresentationBase.toStyleClassNameArray('')).toEqual([]);
    });

    test('Returns an empty array for null or undefined', () => {
        expect(PresentationBase.toStyleClassNameArray(null)).toEqual([]);
        expect(PresentationBase.toStyleClassNameArray(undefined)).toEqual([]);
    });
});

// dispose() releases adapter state and presentation-specific options and DOM-service references.
describe('PresentationBase.dispose', () => {
    test('Clears the options and makes DOM services unavailable', () => {
        let presentation = new Publicify_PresentationBase(document.createElement('div'));
        presentation.init(createValueHostsManager(createDomServices()));

        presentation.dispose();

        expect(presentation.publicify_options).toBeUndefined();
        expect(() => presentation.publicify_domServices).toThrow('DOM services not initialized.');
    });
});
