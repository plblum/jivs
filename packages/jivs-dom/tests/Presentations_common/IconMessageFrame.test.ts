import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import {
    IconMessageFrame,
    IconMessageFrameGlobalOptions,
    IconMessageFrameOptions
} from '../../src/Presentations_common/IconMessageFrame';
import { IssuesFoundFormatterService } from '../../src/Services/IssuesFoundFormatterService';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Creates the frame with real issue formatting and localization services.
 * @param globalOptions - Optional icon-frame settings from DOM services.
 * @param instanceOptions - Optional icon-frame instance settings.
 * @param localizedTexts - French-Canadian translations keyed by localization key.
 */
function setup(
    globalOptions: IconMessageFrameGlobalOptions = {},
    instanceOptions?: IconMessageFrameOptions,
    localizedTexts: Record<string, string> = {}
): {
    testItem: IconMessageFrame,
    domServices: IJivsDomServices
}
{
    let errorMessagesService = new ErrorMessagesService();
    for (let key of Object.keys(localizedTexts))
        errorMessagesService.register(key, { 'fr-CA': localizedTexts[key] });
    let services = {
        errorMessagesService: errorMessagesService
    } as unknown as IJivsServices;
    let domServices = createMockJivsDomServices({ services: services });
    domServices.options.iconMessageFrame = globalOptions;
    domServices.issuesFoundFormatterService = new IssuesFoundFormatterService(domServices);

    return {
        testItem: new IconMessageFrame(instanceOptions),
        domServices: domServices
    };
}

/**
 * Supplies an active culture for resolving the optional header.
 */
function createValueHostsManager(activeCultureId: string = 'en-US'): IValueHostsManager
{
    return {
        behaviors: { activeCultureId: activeCultureId }
    } as unknown as IValueHostsManager;
}

// Icon frames always render the icon and content columns, with a header only when its text or key is configured.
describe('IconMessageFrame.apply layout', () => {
    test('Renders an empty decorative icon span, content column, and message content by default', () => {
        let { testItem, domServices } = setup();
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [{ errorMessage: 'Invalid' }] as IssueFound[],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div class="jivs-layoutmessageframe jivs-iconmessageframe">' +
            '<div class="jivs-column1"><span class="jivs-icon" aria-hidden="true"></span></div>' +
            '<div class="jivs-column2"><div class="jivs-messagecontent">' +
            '<span data-errorcode="" data-severity="error">Invalid</span>' +
            '</div></div></div>'
        );
    });

    test('Includes the optional header and preserves custom outer classes', () => {
        let { testItem, domServices } = setup(
            {},
            {
                outerClasses: ['custom-frame'],
                iconContent: '<strong>!</strong>',
                headerHtml: 'Issues: {Count}'
            }
        );
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [{ errorMessage: 'One' }, { errorMessage: 'Two' }] as IssueFound[],
            createValueHostsManager(),
            null
        );

        expect(containerElement.innerHTML).toBe(
            '<div class="custom-frame jivs-layoutmessageframe jivs-iconmessageframe">' +
            '<div class="jivs-column1"><span class="jivs-icon" aria-hidden="true"><strong>!</strong></span></div>' +
            '<div class="jivs-column2"><div class="jivs-header">Issues: 2</div>' +
            '<div class="jivs-messagecontent"><ul>' +
            '<li data-errorcode="" data-severity="error">One</li>' +
            '<li data-errorcode="" data-severity="error">Two</li>' +
            '</ul></div></div></div>'
        );
    });

    test('Localizes the header and falls back to global header text when the culture has no translation', () => {
        let { testItem, domServices } = setup(
            { headerHtml: 'Global header {Count}', headerHtmll10n: 'global-header-key' },
            undefined,
            { 'global-header-key': 'Translated header' }
        );
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [{ errorMessage: 'First' }, { errorMessage: 'Second' }] as IssueFound[],
            createValueHostsManager('en-US'),
            null
        );

        expect(containerElement.querySelector('.jivs-header')?.textContent).toBe('Global header 2');
    });

    test('Does not request another container update because the frame supplies its content container', () => {
        let { testItem, domServices } = setup();
        testItem.setDomServices(domServices);

        expect(testItem.needsContainerUpdate()).toBe(false);
    });
});

// Icon configuration selects HTML content over an image URL and safely encodes image sources in generated markup.
describe('IconMessageFrame icon options', () => {
    test('Uses iconContent in preference to imageSrc', () => {
        let { testItem, domServices } = setup(
            {},
            { iconContent: '<span>!</span>', imageSrc: 'icons/error.svg' }
        );
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(containerElement, [], createValueHostsManager(), null);

        expect(containerElement.querySelector('.jivs-icon')?.outerHTML).toBe(
            '<span class="jivs-icon" aria-hidden="true"><span>!</span></span>'
        );
        expect(containerElement.querySelector('img')).toBeNull();
    });

    test('Keeps quotes in an image URL within its source attribute and marks it decorative', () => {
        let { testItem, domServices } = setup(
            {},
            { imageSrc: 'icons/error.svg?size="wide"&mode=small' }
        );
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(containerElement, [], createValueHostsManager(), null);

        let image = containerElement.querySelector('.jivs-icon');
        expect(image?.tagName).toBe('IMG');
        expect(image?.getAttribute('src')).toBe('icons/error.svg?size="wide"&mode=small');
        expect(image?.getAttribute('alt')).toBe('');
        expect(image?.getAttribute('aria-hidden')).toBe('true');
        expect(Array.from(image?.attributes ?? []).map(attribute => attribute.name)).toEqual([
            'class',
            'alt',
            'aria-hidden',
            'src'
        ]);
    });

    test('Uses global icon settings when instance options are omitted', () => {
        let { testItem, domServices } = setup({
            iconContent: '<b>Global icon</b>',
            headerHtml: 'Global heading'
        });
        let containerElement = document.createElement('div');

        testItem.setDomServices(domServices);
        testItem.apply(
            containerElement,
            [],
            createValueHostsManager(),
            null
        );

        expect(containerElement.querySelector('.jivs-icon')?.innerHTML).toBe('<b>Global icon</b>');
        expect(containerElement.querySelector('.jivs-header')?.textContent).toBe('Global heading');
    });
});
