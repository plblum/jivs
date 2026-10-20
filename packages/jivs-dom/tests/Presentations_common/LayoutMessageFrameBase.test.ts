import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import {
    LayoutMessageFrameBase,
    LayoutMessageFrameBaseOptions
} from '../../src/Presentations_common/LayoutMessageFrameBase';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';

class Publicify_LayoutMessageFrameBase extends LayoutMessageFrameBase<LayoutMessageFrameBaseOptions>
{
    public constructor(options?: LayoutMessageFrameBaseOptions)
    {
        super(options);
    }

    public publicify_outerClasses(): string[]
    {
        return this.outerClasses;
    }

    public publicify_outerTag(): string
    {
        return this.outerTag;
    }

    public publicify_outerBeginTag(): string
    {
        return this.outerBeginTag;
    }

    public publicify_defaultIssuesFoundHtml(): string
    {
        return this.defaultIssuesFoundHtml();
    }

    protected override generateTemplateContent(): string
    {
        return this.defaultIssuesFoundHtml();
    }
}

class HeaderFooterTokenLayoutMessageFrame extends Publicify_LayoutMessageFrameBase
{
    protected override generateTemplateContent(): string
    {
        return `<header>{Header}</header>${this.defaultIssuesFoundHtml()}<footer>{Footer}</footer>`;
    }
}

/**
 * Creates the frame and DOM services with real issue formatting and text localization services.
 * @param options - Optional frame-specific options.
 */
function setup(options?: LayoutMessageFrameBaseOptions): {
    testItem: Publicify_LayoutMessageFrameBase,
    domServices: IJivsDomServices
}
{
    let services = {
        errorMessagesService: new ErrorMessagesService()
    } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({ services: services });
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);

    return {
        testItem: new Publicify_LayoutMessageFrameBase(options),
        domServices: domServices
    };
}

/**
 * Supplies the default manager shape required by the issue formatter.
 */
function createValueHostsManager(): IValueHostsManager
{
    return {
        behaviors: { activeCultureId: 'en-US' }
    } as unknown as IValueHostsManager;
}

// Layout frames always add the standard class and preserve application-provided classes.
describe('LayoutMessageFrameBase.resolveOptions', () => {
    test('Adds the standard class when no outer classes are configured', () => {
        let { testItem, domServices } = setup();

        testItem.setDomServices(domServices);

        expect(testItem.publicify_outerClasses()).toEqual(['jivs-layoutmessageframe']);
    });

    test('Accepts a class string or class array and appends the standard class', () => {
        let stringSetup = setup({ outerClasses: 'custom-one custom-two' });
        let inputClasses = ['custom-three', 'custom-four'];
        let arraySetup = setup({ outerClasses: inputClasses });

        stringSetup.testItem.setDomServices(stringSetup.domServices);
        arraySetup.testItem.setDomServices(arraySetup.domServices);

        expect(stringSetup.testItem.publicify_outerClasses()).toEqual([
            'custom-one',
            'custom-two',
            'jivs-layoutmessageframe'
        ]);
        expect(arraySetup.testItem.publicify_outerClasses()).toEqual([
            'custom-three',
            'custom-four',
            'jivs-layoutmessageframe'
        ]);
        expect(inputClasses).toEqual(['custom-three', 'custom-four']);
    });
});

// The base consistently generates a div wrapper and the standard message-content container.
describe('LayoutMessageFrameBase template helpers', () => {
    test('Uses a div wrapper with its collected outer classes', () => {
        let { testItem, domServices } = setup({ outerClasses: ['custom-frame'] });
        testItem.setDomServices(domServices);

        expect(testItem.publicify_outerTag()).toBe('div');
        expect(testItem.publicify_outerBeginTag()).toBe(
            '<div class="custom-frame jivs-layoutmessageframe">'
        );
    });

    test('Includes the standard message-content class and issue insertion token', () => {
        let { testItem } = setup();

        expect(testItem.publicify_defaultIssuesFoundHtml()).toBe(
            '<div class="jivs-messagecontent">{IssuesFound}</div>'
        );
    });

    test('Wraps generated content in the layout frame and does not request another content class', () => {
        let { testItem, domServices } = setup();
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [{ errorMessage: 'Invalid' }] as IssueFound[],
            createValueHostsManager(),
            null
        );

        expect(testItem.needsContainerUpdate()).toBe(false);
        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-layoutmessageframe">' +
            '<div class="jivs-messagecontent">' +
            '<span data-errorcode="" data-severity="error">Invalid</span>' +
            '</div></div>'
        );
    });

    test('Retains inherited Header and Footer token support in subclass-generated layouts', () => {
        let testItem = new HeaderFooterTokenLayoutMessageFrame({
            headerHtml: 'Issues found: {Count}',
            footerHtml: 'Review {Count} messages'
        });
        let domServices = setup().domServices;
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [
                { errorMessage: 'First issue' },
                { errorMessage: 'Second issue' }
            ] as IssueFound[],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-layoutmessageframe">' +
            '<header>Issues found: 2</header>' +
            '<div class="jivs-messagecontent">' +
            '<ul><li data-errorcode="" data-severity="error">First issue</li>' +
            '<li data-errorcode="" data-severity="error">Second issue</li></ul>' +
            '</div>' +
            '<footer>Review 2 messages</footer>' +
            '</div>'
        );
    });

    test('Can generate a wrapper without a class attribute when a subclass removes all classes', () => {
        class ClasslessLayoutMessageFrame extends Publicify_LayoutMessageFrameBase
        {
            protected override gatherOuterClasses(_list: string[]): void
            {
            }
        }
        let testItem = new ClasslessLayoutMessageFrame();
        let domServices = createMockJivsDomServices();
        domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div><div class="jivs-messagecontent"></div></div>'
        );
    });
});
