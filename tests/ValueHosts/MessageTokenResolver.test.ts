import { LoggingLevel, FormattingCategory, ConfigurationCategory, TypeMismatchCategory } from "../../src/Interfaces/Logger";
import { AbbrevDateLookupKey, CapitalizeStringLookupKey, DateTimeLookupKey, LongDOWDateLookupKey, LowercaseStringLookupKey, NumberLookupKey, UppercaseStringLookupKey } from "../../src/DataTypes/LookupKeys";
import { MessageTokenResolver } from "../../src/ValueHosts/MessageTokenResolver";
import { CreateMockValidationManagerForMessageTokenResolver, MockCapturingLogger } from "../Mocks";
import { IValueHost } from "../../src/Interfaces/ValueHost";
import { IValueHostResolver } from "../../src/Interfaces/ValueHostResolver";
import { IInputValueHost } from "../../src/Interfaces/InputValueHost";
import { IMessageTokenSource, ITokenLabelAndValue } from "../../src/Interfaces/InputValidator";


// ResolveTokens(message: string, validationManager: IValidationManager, ...hosts: Array<IMessageTokenSource>): string
describe('ResolveTokens', () => {
    test('Invalid parameters', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(false);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue> {
                return [];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(() => testItem.ResolveTokens(null!, null!, vm, messageTokeSource)).toThrow(/message/);
        expect(() => testItem.ResolveTokens('message', null!, null!, messageTokeSource)).toThrow(/valueHostResolver/);
        expect(() => testItem.ResolveTokens('message', null!, vm, null!)).toThrow(/hosts/);
    });
    test('Message with no tokens returns verbatim', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(false);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('message', null!, vm, messageTokeSource)).toBe('message');
        expect(testItem.ResolveTokens('message{', null!, vm, messageTokeSource)).toBe('message{');
        expect(testItem.ResolveTokens('message}', null!, vm, messageTokeSource)).toBe('message}');
        expect(testItem.ResolveTokens('{ message }', null!, vm, messageTokeSource)).toBe('{ message }');
    });    
    test('Message with {token} gets token replaced. Token value is a string.', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: 'replacement',
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token}', null!, vm, messageTokeSource)).toBe('replacement');
        expect(testItem.ResolveTokens('{token} after', null!, vm, messageTokeSource)).toBe('replacement after');
        expect(testItem.ResolveTokens('before {token}', null!, vm, messageTokeSource)).toBe('before replacement');
        expect(testItem.ResolveTokens('before{token}after', null!, vm, messageTokeSource)).toBe('beforereplacementafter');
        expect(testItem.ResolveTokens('{token} and another {token}', null!, vm, messageTokeSource)).toBe('replacement and another replacement');
        
    });
    test('Message with {token} gets token replaced. Token value is a Date.', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: new Date(2000, 0, 15),
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token}', null!, vm, messageTokeSource)).toBe('1/15/2000');
    });      
    test('Message with {token} gets token replaced. Token value is a Number.', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: 2100,
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token}', null!, vm, messageTokeSource)).toBe('2,100');
    });            
    test('Message with {token} gets token replaced. Token value is a Boolean.', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: false,
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token}', null!, vm, messageTokeSource)).toBe('false');
    });            
    test('Message with {token} gets token replaced using formatters. Token value is a String.', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: 'aBC dEF',
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token:' + UppercaseStringLookupKey + '}', null!, vm, messageTokeSource)).toBe('ABC DEF');
        expect(testItem.ResolveTokens('{token:' + LowercaseStringLookupKey + '}', null!, vm, messageTokeSource)).toBe('abc def');
        expect(testItem.ResolveTokens('{token:' + CapitalizeStringLookupKey + '}', null!, vm, messageTokeSource)).toBe('ABC dEF');
    });          
    test('Message with {token} gets token replaced using formatters. Token value is a Date.', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: new Date(2000, 0, 15, 13, 30),
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token:' + AbbrevDateLookupKey + '}', null!, vm, messageTokeSource)).toBe('Jan 15, 2000');
        expect(testItem.ResolveTokens('{token:' + DateTimeLookupKey + '}', null!, vm, messageTokeSource)).toBe('1/15/2000, 1:30 PM');
        expect(testItem.ResolveTokens('{token:' + LongDOWDateLookupKey + '}', null!, vm, messageTokeSource)).toBe('Saturday, January 15, 2000');
    });          
    test('Message with {token1} and {token2} gets tokens replaced using formatters. Token1 is a Date; Token2 is a string.', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token1',
                    AssociatedValue: new Date(2000, 0, 15, 13, 30),
                    Purpose: 'label'
                },
                {
                    TokenLabel: 'token2',
                    AssociatedValue: 'aBC dEF',
                    Purpose: 'label'
                }
                ];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token1} and {token2}', null!, vm, messageTokeSource)).toBe('1/15/2000 and aBC dEF');

        expect(testItem.ResolveTokens('{token2} and {token1:' + AbbrevDateLookupKey + '}', null!, vm, messageTokeSource)).toBe('aBC dEF and Jan 15, 2000');
    });       
    test('Message with {token:formatter} where formatter does not support value is not replaced and gets logged', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let logger = vm.Services.LoggerService as MockCapturingLogger;
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: new Date(2000, 0, 15, 13, 30),
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        expect(testItem.ResolveTokens('{token:' + NumberLookupKey + '}', null!, vm, messageTokeSource)).toBe('{token:' + NumberLookupKey + '}');
        expect(logger.EntryCount()).toBe(2);
        expect(logger.GetLatest()?.Level).toBe(LoggingLevel.Warn);
        expect(logger.GetLatest()?.Category).toBe(FormattingCategory);
        expect(logger.Captured[0].Level).toBe(LoggingLevel.Error);
        expect(logger.Captured[0].Category).toBe(ConfigurationCategory);
    });          
    test('Message with {token:formatter} where the value cannot be resolved and is not replaced and gets logged', () => {
        let vm = CreateMockValidationManagerForMessageTokenResolver(true);
        let logger = vm.Services.LoggerService as MockCapturingLogger;
        let messageTokeSource: IMessageTokenSource = {
            GetValuesForTokens: function (valueHost : IInputValueHost, vm: IValueHostResolver): Array<ITokenLabelAndValue>
            {
                return [{
                    TokenLabel: 'token',
                    AssociatedValue: new Date(2000, 0, 15, 13, 30),
                    Purpose: 'label'
                }];
            }
        };
        let testItem = new MessageTokenResolver();
        vm.Services.ActiveCultureId = 'de-DE';  // not configured in LA
        expect(testItem.ResolveTokens('{token:' + NumberLookupKey + '}', null!, vm, messageTokeSource)).toBe('{token:' + NumberLookupKey + '}');
        expect(logger.EntryCount()).toBe(2);
        expect(logger.GetLatest()?.Level).toBe(LoggingLevel.Warn);
        expect(logger.GetLatest()?.Category).toBe(FormattingCategory);
        expect(logger.Captured[0].Level).toBe(LoggingLevel.Error);
        expect(logger.Captured[0].Category).toBe(TypeMismatchCategory);
    });        
});

