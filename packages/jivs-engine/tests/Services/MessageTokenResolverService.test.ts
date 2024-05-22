import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { createMockValidationManagerForMessageTokenResolver } from "../TestSupport/mocks";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { IInputValueHost } from "../../src/Interfaces/InputValueHost";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { IMessageTokenSource, TokenLabelAndValue } from "../../src/Interfaces/MessageTokenSource";
import { CapturingLogger } from "../TestSupport/CapturingLogger";


// resolveTokens(message: string, validationManager: IValidationManager, ...hosts: Array<IMessageTokenSource>): string
describe('resolveTokens', () => {
    test('Invalid parameters', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(false);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue> {
                return [];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(() => testItem.resolveTokens(null!, null!, vm, messageTokeSource)).toThrow(/message/);
        expect(() => testItem.resolveTokens('message', null!, null!, messageTokeSource)).toThrow(/valueHostResolver/);
        expect(() => testItem.resolveTokens('message', null!, vm, null!)).toThrow(/hosts/);
    });
    test('Message with no tokens returns verbatim', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(false);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(testItem.resolveTokens('message', null!, vm, messageTokeSource)).toBe('message');
        expect(testItem.resolveTokens('message{', null!, vm, messageTokeSource)).toBe('message{');
        expect(testItem.resolveTokens('message}', null!, vm, messageTokeSource)).toBe('message}');
        expect(testItem.resolveTokens('{ message }', null!, vm, messageTokeSource)).toBe('{ message }');
    });    
    test('Message with {token} gets token replaced. Token value is a string.', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: 'replacement',
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(testItem.resolveTokens('{token}', null!, vm, messageTokeSource)).toBe('replacement');
        expect(testItem.resolveTokens('{token} after', null!, vm, messageTokeSource)).toBe('replacement after');
        expect(testItem.resolveTokens('before {token}', null!, vm, messageTokeSource)).toBe('before replacement');
        expect(testItem.resolveTokens('before{token}after', null!, vm, messageTokeSource)).toBe('beforereplacementafter');
        expect(testItem.resolveTokens('{token} and another {token}', null!, vm, messageTokeSource)).toBe('replacement and another replacement');
        
    });
    test('Message with {token} gets token replaced. Token value is a Date.', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(testItem.resolveTokens('{token}', null!, vm, messageTokeSource)).toBe('1/15/2000');
    });      
    test('Message with {token} gets token replaced. Token value is a Number.', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: 2100,
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(testItem.resolveTokens('{token}', null!, vm, messageTokeSource)).toBe('2,100');
    });            
    test('Message with {token} gets token replaced. Token value is a Boolean.', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: false,
                    purpose: 'label'
                }];
            }
        };
        let testItem = vm.services.messageTokenResolverService;
        expect(testItem.resolveTokens('{token}', null!, vm, messageTokeSource)).toBe('false');
    });            
    test('Message with {token} gets token replaced using formatters. Token value is a String.', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: 'aBC dEF',
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(testItem.resolveTokens('{token:' + LookupKey.Uppercase + '}', null!, vm, messageTokeSource)).toBe('ABC DEF');
        expect(testItem.resolveTokens('{token:' + LookupKey.Lowercase + '}', null!, vm, messageTokeSource)).toBe('abc def');
        expect(testItem.resolveTokens('{token:' + LookupKey.Capitalize + '}', null!, vm, messageTokeSource)).toBe('ABC dEF');
    });          
    test('Message with {token} gets token replaced using formatters. Token value is a Date.', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(testItem.resolveTokens('{token:' + LookupKey.AbbrevDate + '}', null!, vm, messageTokeSource)).toBe('Jan 15, 2000');
        expect(testItem.resolveTokens('{token:' + LookupKey.DateTime + '}', null!, vm, messageTokeSource)).toBe('1/15/2000, 1:30 PM');
        expect(testItem.resolveTokens('{token:' + LookupKey.LongDOWDate + '}', null!, vm, messageTokeSource)).toBe('Saturday, January 15, 2000');
    });          
    test('Message with {token1} and {token2} gets tokens replaced using formatters. Token1 is a Date; Token2 is a string.', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
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
        expect(testItem.resolveTokens('{token1} and {token2}', null!, vm, messageTokeSource)).toBe('1/15/2000 and aBC dEF');

        expect(testItem.resolveTokens('{token2} and {token1:' + LookupKey.AbbrevDate + '}', null!, vm, messageTokeSource)).toBe('aBC dEF and Jan 15, 2000');
    });       
    test('Message with {token:formatter} where formatter does not support value is not replaced and gets logged', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let logger = vm.services.loggerService as CapturingLogger;
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        expect(testItem.resolveTokens('{token:' + LookupKey.Number + '}', null!, vm, messageTokeSource)).toBe('{token:' + LookupKey.Number + '}');

        expect(logger.findMessage('token', LoggingLevel.Error, LoggingCategory.Configuration, 'MessageTokenResolver')).not.toBeNull();        
        expect(logger.findMessage('not replaced', LoggingLevel.Warn, LoggingCategory.Formatting, 'MessageTokenResolver')).not.toBeNull();        
    });          
    test('Message with {token:formatter} where the value cannot be resolved and is not replaced and gets logged', () => {
        let vm = createMockValidationManagerForMessageTokenResolver(true);
        let logger = vm.services.loggerService as CapturingLogger;
        let messageTokeSource: IMessageTokenSource = {
            getValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<TokenLabelAndValue>
            {
                return [{
                    tokenLabel: 'token',
                    associatedValue: new Date(2000, 0, 15, 13, 30),
                    purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolverService();
        vm.services.cultureService.activeCultureId = 'de-DE';  // not configured in LA
        expect(() => testItem.resolveTokens('{token:UNKNOWNLOOKUPKEY}', null!, vm, messageTokeSource)).toThrow();

        expect(logger.findMessage('Unsupported LookupKey', LoggingLevel.Error, LoggingCategory.LookupKey, 'DataTypeFormatterService')).not.toBeNull();
    });        
});

