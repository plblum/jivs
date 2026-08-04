import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { createMockValueHostsManagerForMessageTokenResolver } from "../TestSupport/mocks";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { IFieldValueHost } from "../../src/Interfaces/FieldValueHost";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IMessageTokenSource, TokenLabelAndValue } from "../../src/Interfaces/MessageTokenSource";
import { CapturedLogDetails, CapturingLogger } from "../../src/Support/CapturingLogger";


// resolveTokens(message: string, valueHostsManager: IValueHostsManager, ...hosts: Array<IMessageTokenSource>): string
describe('resolveTokens', () => {
    test('Invalid parameters', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(false);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue> {
                return [];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(() => testItem.resolveTokens(null!, null!, vhm, messageTokeSource)).toThrow(/message/);
        expect(() => testItem.resolveTokens('message', null!, null!, messageTokeSource)).toThrow(/valueHostResolver/);
        expect(() => testItem.resolveTokens('message', null!, vhm, null!)).toThrow(/hosts/);
    });
    test('Message with no tokens returns verbatim', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(false);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('message', null!, vhm, messageTokeSource)).toBe('message');
        expect(testItem.resolveTokens('message{', null!, vhm, messageTokeSource)).toBe('message{');
        expect(testItem.resolveTokens('message}', null!, vhm, messageTokeSource)).toBe('message}');
        expect(testItem.resolveTokens('{ message }', null!, vhm, messageTokeSource)).toBe('{ message }');
    });    
    test('Message with {token} gets token replaced. Token value is a string.', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: 'replacement',
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token}', null!, vhm, messageTokeSource)).toBe('replacement');
        expect(testItem.resolveTokens('{token} after', null!, vhm, messageTokeSource)).toBe('replacement after');
        expect(testItem.resolveTokens('before {token}', null!, vhm, messageTokeSource)).toBe('before replacement');
        expect(testItem.resolveTokens('before{token}after', null!, vhm, messageTokeSource)).toBe('beforereplacementafter');
        expect(testItem.resolveTokens('{token} and another {token}', null!, vhm, messageTokeSource)).toBe('replacement and another replacement');
        
    });
    test('Message with {token} gets token replaced. Token value is a Date.', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token}', null!, vhm, messageTokeSource)).toBe('1/15/2000');
    });      
    test('Message with {token} gets token replaced. Token value is a Number.', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: 2100,
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token}', null!, vhm, messageTokeSource)).toBe('2,100');
    });            
    test('Message with {token} gets token replaced. Token value is a Boolean.', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: false,
                    purpose: 'label'
                }];
            }
        };
        let testItem = vhm.services.messageTokenResolverService;
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token}', null!, vhm, messageTokeSource)).toBe('false');
    });            
    test('Message with {token} gets token replaced using formatters. Token value is a String.', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: 'aBC dEF',
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token:' + LookupKey.Uppercase + '}', null!, vhm, messageTokeSource)).toBe('ABC DEF');
        expect(testItem.resolveTokens('{token:' + LookupKey.Lowercase + '}', null!, vhm, messageTokeSource)).toBe('abc def');
        expect(testItem.resolveTokens('{token:' + LookupKey.Capitalize + '}', null!, vhm, messageTokeSource)).toBe('ABC dEF');
    });          
    test('Message with {token} gets token replaced using formatters. Token value is a Date.', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token:' + LookupKey.AbbrevDate + '}', null!, vhm, messageTokeSource)).toBe('Jan 15, 2000');
        expect(testItem.resolveTokens('{token:' + LookupKey.DateTime + '}', null!, vhm, messageTokeSource)).toBe('1/15/2000, 1:30 PM');
        expect(testItem.resolveTokens('{token:' + LookupKey.LongDOWDate + '}', null!, vhm, messageTokeSource)).toBe('Saturday, January 15, 2000');
    });          
    test('Message with {token1} and {token2} gets tokens replaced using formatters. Token1 is a Date; Token2 is a string.', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token1',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                },
                {
                    tokenLabel: 'token2',
                    associatedValue: 'aBC dEF',
                    purpose: 'label'
                }
                ];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token1} and {token2}', null!, vhm, messageTokeSource)).toBe('1/15/2000 and aBC dEF');

        expect(testItem.resolveTokens('{token2} and {token1:' + LookupKey.AbbrevDate + '}', null!, vhm, messageTokeSource)).toBe('aBC dEF and Jan 15, 2000');
    });       
    test('Message with {token:formatter} where formatter does not support value is not replaced and gets logged', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        let logger = vhm.services.loggerService as CapturingLogger;
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(testItem.resolveTokens('{token:' + LookupKey.Number + '}', null!, vhm, messageTokeSource)).toBe('{token:' + LookupKey.Number + '}');

        expect(logger.findMessage('token', LoggingLevel.Error, LoggingCategory.Configuration)).toBeTruthy();        
        expect(logger.findMessage('not replaced', LoggingLevel.Warn)).toBeTruthy();        
    });          
    test('Message with {token:formatter} where the value cannot be resolved and is not replaced and gets logged', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(true);
        vhm.services.cultureService.register({ cultureId: 'de-DE' });
        let logger = vhm.services.loggerService as CapturingLogger;
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        vhm.behaviors.activeCultureId = 'de-DE';  // not configured in LA
        expect(() => testItem.resolveTokens('{token:UNKNOWNLOOKUPKEY}', null!, vhm, messageTokeSource)).toThrow();
        logger.toConsole();
        expect(logger.findMessage('No DataTypeFormatter for LookupKey', LoggingLevel.Error, LoggingCategory.Exception)).toBeTruthy();
    });        
    test('getValuesForTokens function throws an error', () => {
        let vhm = createMockValueHostsManagerForMessageTokenResolver(false);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IFieldValueHost, vhm: IValueHostResolver): Array<TokenLabelAndValue> {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        testItem.services = vhm.services;
        expect(() => testItem.resolveTokens('{token:INVALID}', null!, vhm, messageTokeSource)).toThrow(/No DataTypeFormatter for LookupKey/);
        let logger = vhm.services.loggerService as CapturingLogger;
        expect(logger.findMessage('No DataTypeFormatter for LookupKey', null, null, {
            type: MessageTokenResolverService
        })).toEqual(
            expect.objectContaining(
            <CapturedLogDetails>{
            level: LoggingLevel.Error,
            category: LoggingCategory.Exception,
            feature: 'service',
            typeAsString: 'MessageTokenResolverService',
            data: { token: '{token:INVALID}' }
        }));
    });    
});

