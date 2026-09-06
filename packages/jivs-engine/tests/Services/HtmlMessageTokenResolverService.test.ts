import { IFieldValueHost } from '../../src/Interfaces/FieldValueHost';
import { IMessageTokenSource, TokenLabelAndValue } from '../../src/Interfaces/MessageTokenSource';
import { IValueHostResolver } from '../../src/Interfaces/ValueHostResolver';
import { HtmlMessageTokenResolverService } from '../../src/Services/HtmlMessageTokenResolverService';
import { MessageTokenResolverService } from '../../src/Services/MessageTokenResolverService';
import { createMockValueHostsManagerForMessageTokenResolver } from '../TestSupport/mocks';

describe('HtmlMessageTokenResolverService', () =>
{
    class Publicify_HtmlMessageTokenResolverService extends HtmlMessageTokenResolverService
    {
        public publicify_finalizeReplacement(
            replacement: string,
            tav: any
        ): string
        {
            return super.finalizeReplacement(replacement, tav);
        }
    }
    // nothing to replace
    test('should handle empty replacement values', () =>
    {
        const service = new Publicify_HtmlMessageTokenResolverService();
        const replacement = '';
        const tav = { purpose: 'test' } as any;
        const result = service.publicify_finalizeReplacement(replacement, tav);
        expect(result).toBe(
            '<span class="token test"></span>'
        );
    });
    test('should handle replacement values with no special characters', () =>
    {
        const service = new Publicify_HtmlMessageTokenResolverService();
        const replacement = 'plain text';
        const tav = { purpose: 'test' } as any;
        const result = service.publicify_finalizeReplacement(replacement, tav);
        expect(result).toBe(
            '<span class="token test">plain text</span>'
        );
    });

    test('should encode HTML special characters in replacement values', () =>
    {
        const service = new Publicify_HtmlMessageTokenResolverService();
        const replacement = '<script>alert("XSS")</script>';
        const tav = { purpose: 'test' } as any;
        const result = service.publicify_finalizeReplacement(replacement, tav);
        expect(result).toBe(
            '<span class="token test">&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</span>'
        );
    });

    test('Message with {token} gets token replaced. Token value is a string without a need for encoding.', () =>
    {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);

        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost: IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: 'replacement',
                    purpose: 'label'
                }];
            }
        };
        let testItem = new Publicify_HtmlMessageTokenResolverService();
        testItem.services = vhm.services;
        const replacement = '<span class=\"token label\">replacement</span>';
        expect(testItem.resolveTokens('{token}', null!, vhm, messageTokeSource)).toBe(replacement);
        expect(testItem.resolveTokens('{token} after', null!, vhm, messageTokeSource)).toBe(replacement + ' after');
        expect(testItem.resolveTokens('before {token}', null!, vhm, messageTokeSource)).toBe('before ' + replacement);
        expect(testItem.resolveTokens('before{token}after', null!, vhm, messageTokeSource)).toBe('before' + replacement + 'after');
        expect(testItem.resolveTokens('{token} and another {token}', null!, vhm, messageTokeSource)).toBe(replacement + ' and another ' + replacement);

    });
    test('Message with {token} gets token replaced. Token value contains HTML special characters and needs encoding.', () =>
    {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost: IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: '<b>replacement</b>',
                    purpose: 'label'
                }];
            }
        };
        let testItem = new Publicify_HtmlMessageTokenResolverService();
        testItem.services = vhm.services;
        const replacement = '<span class=\"token label\">&lt;b&gt;replacement&lt;/b&gt;</span>';
        expect(testItem.resolveTokens('{token}', null!, vhm, messageTokeSource)).toBe(replacement);
        expect(testItem.resolveTokens('{token} after', null!, vhm, messageTokeSource)).toBe(replacement + ' after');
        expect(testItem.resolveTokens('before {token}', null!, vhm, messageTokeSource)).toBe('before ' + replacement);
        expect(testItem.resolveTokens('before{token}after', null!, vhm, messageTokeSource)).toBe('before' + replacement + 'after');
        expect(testItem.resolveTokens('{token} and another {token}', null!, vhm, messageTokeSource)).toBe(replacement + ' and another ' + replacement);
    });
});