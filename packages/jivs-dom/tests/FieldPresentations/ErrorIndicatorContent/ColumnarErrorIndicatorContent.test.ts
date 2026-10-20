/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ErrorMessagesService } from '@plblum/jivs-engine/build/Services/ErrorMessagesService';
import type { CultureToText } from '@plblum/jivs-engine/build/Interfaces/ErrorMessagesService';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    ColumnarErrorIndicatorContent,
    ColumnarErrorIndicatorContentOptions
} from '../../../src/FieldPresentations/ErrorIndicatorContent/ColumnarErrorIndicatorContent';
import type { JivsDomGlobalOptions } from '../../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../../TestSupport/MockJivsDomServices';

/**
 * Creates configured content with a real ErrorMessagesService and registered translations.
 */
function createContent(
    options?: ColumnarErrorIndicatorContentOptions,
    globalOptions?: ColumnarErrorIndicatorContentOptions,
    localizedTexts?: Record<string, CultureToText>
): {
    content: ColumnarErrorIndicatorContent;
}
{
    let errorMessagesService = new ErrorMessagesService();
    Object.entries(localizedTexts ?? {}).forEach(([key, translations]) => {
        errorMessagesService.register(key, translations);
    });
    let services = {
        errorMessagesService: errorMessagesService
    } as unknown as IJivsServices;
    let domOptions = {
        ...createMockJivsDomServices().options,
        columnarErrorIndicatorContent: globalOptions ?? {}
    } as JivsDomGlobalOptions;
    let domServices = createMockJivsDomServices({
        services: services,
        options: domOptions
    });
    let content = new ColumnarErrorIndicatorContent(options);
    content.setDomServices(domServices);

    return {
        content: content
    };
}

function applyContent(
    content: ColumnarErrorIndicatorContent,
    issuesFound: IssueFound[] = [],
    fieldValueHost: IFieldValueHost | null = null,
    activeCultureId: string = 'en-US'
): HTMLElement
{
    let containerElement = document.createElement('div');
    let valueHostsManager = {
        behaviors: { activeCultureId: activeCultureId }
    } as unknown as IValueHostsManager;

    content.apply(containerElement, issuesFound, valueHostsManager, fieldValueHost);
    return containerElement;
}

// The default indicator must provide its documented wrapper, warning symbol, and three columns.
describe('ColumnarErrorIndicatorContent default content', () => {
    test('Renders the default warning symbol and all three column elements', () => {
        let { content } = createContent();

        let containerElement = applyContent(content);
        let contentElement = containerElement.firstElementChild as HTMLElement;
        let columns = contentElement.children;

        expect(contentElement.className).toBe(
            'jivs-errorindicatorcontent jivs-columnarerrorindicatorcontent'
        );
        expect(columns).toHaveLength(3);
        expect(columns[0].className).toBe('jivs-column1');
        expect(columns[0].textContent).toBe('⚠');
        expect(columns[1].className).toBe('jivs-column2');
        expect(columns[1].innerHTML).toBe('');
        expect(columns[2].className).toBe('jivs-column3');
        expect(columns[2].innerHTML).toBe('');
    });

    test('Keeps all columns present when configured content is empty', () => {
        let { content } = createContent({
            column1Html: '',
            column2Html: '',
            column3Html: ''
        });

        let columns = applyContent(content).firstElementChild?.children;

        expect(columns).toHaveLength(3);
        expect(Array.from(columns ?? []).map(column => column.innerHTML)).toEqual(['', '', '']);
    });
});

// Instance options override global settings, while unspecified content falls back to class defaults.
describe('ColumnarErrorIndicatorContent option resolution', () => {
    test('Uses instance values before global values and defaults', () => {
        let { content } = createContent(
            { column2Html: '<b>Instance</b>' },
            {
                column1Html: '<i>Global icon</i>',
                column2Html: '<b>Global</b>',
                column3Html: '<span>Global action</span>'
            }
        );

        let columns = applyContent(content).firstElementChild?.children;

        expect(columns?.[0].innerHTML).toBe('<i>Global icon</i>');
        expect(columns?.[1].innerHTML).toBe('<b>Instance</b>');
        expect(columns?.[2].innerHTML).toBe('<span>Global action</span>');
    });

    test('Uses configured HTML as HTML in each column', () => {
        let { content } = createContent({
            column1Html: '<em>Icon</em>',
            column2Html: '<strong>Errors</strong>',
            column3Html: '<button type="button">Open</button>'
        });

        let columns = applyContent(content).firstElementChild?.children;

        expect(columns?.[0].innerHTML).toBe('<em>Icon</em>');
        expect(columns?.[1].innerHTML).toBe('<strong>Errors</strong>');
        expect(columns?.[2].innerHTML).toBe('<button type="button">Open</button>');
    });
});

// Each column localizes independently and supports the count and encoded field-label tokens.
describe('ColumnarErrorIndicatorContent localization', () => {
    test('Resolves each configured key through the real localization service', () => {
        let { content } = createContent({
            column1Htmll10n: 'indicator.icon',
            column1Html: '<i>Fallback icon</i>',
            column2Htmll10n: 'indicator.summary',
            column2Html: 'Fallback summary',
            column3Htmll10n: 'indicator.action',
            column3Html: 'Fallback action'
        }, undefined, {
            'indicator.icon': { en: '<b>Localized icon</b>' },
            'indicator.summary': { 'en-US': 'Localized summary' },
            'indicator.action': { '*': '<span>Localized action</span>' }
        });

        let columns = applyContent(content).firstElementChild?.children;

        expect(Array.from(columns ?? []).map(column => column.innerHTML)).toEqual([
            '<b>Localized icon</b>',
            'Localized summary',
            '<span>Localized action</span>'
        ]);
    });

    test('Uses configured fallback HTML when a localization key has no registered translation', () => {
        let { content } = createContent({
            column2Htmll10n: 'indicator.unregistered',
            column2Html: 'Fallback summary'
        });

        let columns = applyContent(content).firstElementChild?.children;

        expect(columns?.[1].textContent).toBe('Fallback summary');
    });

    test('Uses global localization options unless an instance key overrides them', () => {
        let { content } = createContent(
            { column2Htmll10n: 'indicator.instance' },
            {
                column1Htmll10n: 'indicator.global',
                column1Html: 'Global fallback',
                column2Htmll10n: 'indicator.global.summary',
                column2Html: 'Global summary fallback'
            },
            {
                'indicator.global': { fr: 'Icône globale' },
                'indicator.global.summary': { fr: 'Résumé global' },
                'indicator.instance': { fr: 'Résumé personnalisé' }
            }
        );

        let columns = applyContent(content, [], null, 'fr-CA').firstElementChild?.children;

        expect(columns?.[0].textContent).toBe('Icône globale');
        expect(columns?.[1].textContent).toBe('Résumé personnalisé');
    });

    test('Replaces count and encodes the field label in content', () => {
        let { content } = createContent({
            column2Html: '<strong>{Count} errors for {Label}</strong>'
        });
        let fieldValueHost = {
            getLabel: () => '<First & Last>'
        } as unknown as IFieldValueHost;

        let columns = applyContent(content, [{}, {}] as IssueFound[], fieldValueHost)
            .firstElementChild?.children;

        expect(columns?.[1].innerHTML).toBe(
            '<strong>2 errors for &lt;First &amp; Last&gt;</strong>'
        );
        expect(columns?.[1].textContent).toBe('2 errors for <First & Last>');
    });

    test('Replaces count and encoded label tokens in localized content', () => {
        let { content } = createContent({
            column2Htmll10n: 'indicator.localizedSummary'
        }, undefined, {
            'indicator.localizedSummary': {
                'en-US': '<strong>{Count} errors for {Label}</strong>'
            }
        });
        let fieldValueHost = {
            getLabel: () => 'Account & Profile'
        } as unknown as IFieldValueHost;

        let columns = applyContent(content, [{}, {}, {}] as IssueFound[], fieldValueHost)
            .firstElementChild?.children;

        expect(columns?.[1].innerHTML).toBe(
            '<strong>3 errors for Account &amp; Profile</strong>'
        );
    });
});
