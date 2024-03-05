import { DefaultComparer, ComparersResult, BooleanComparer, CaseInsensitiveComparer, DateTimeComparer, DateOnlyComparer, DateAsMonthYearComparer, DateAsAnniversaryComparer } from "../../src/Conditions/Comparers";

// function DefaultComparer(value1: any, value2: any): ComparersResult
describe('Comparers.DefaultComparer', () => {
    test('Equal primitives', () => {
        expect(DefaultComparer(0, 0)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(10, 10)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(true, true)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(false, false)).toBe(ComparersResult.Equals);
        expect(DefaultComparer('10', '10')).toBe(ComparersResult.Equals);
        expect(DefaultComparer(null, null)).toBe(ComparersResult.Equals);
        expect(DefaultComparer(undefined, undefined)).toBe(ComparersResult.Equals);
    });
    test('Undetermined with different type primitives', () => {
        expect(DefaultComparer(0, '0')).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(0, undefined)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(0, false)).toBe(ComparersResult.Undetermined);  
        expect(DefaultComparer('0', 0)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(undefined, 0)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(false, 0)).toBe(ComparersResult.Undetermined); 
        expect(DefaultComparer(null, undefined)).toBe(ComparersResult.Undetermined); 
    });
// there are no cases with same type primitives that support NotEquals
    test('Not Equal with same type primitives', () => {
        // is greater than    expect(DefaultComparer(true, false)).toBe(ComparersResult.NotEquals);  
        
    });
    
    test('InvalidTypeErrors', () => {
        expect(() => DefaultComparer({}, 0)).toThrow(/^Type is/);
        expect(() => DefaultComparer(0, {})).toThrow(/^Type is/);
        expect(() => DefaultComparer([], 0)).toThrow(/^Type is/);
        expect(() => DefaultComparer(0, [])).toThrow(/^Type is/);
    });
    test('GreaterThan primitives', () => {
        expect(DefaultComparer(0, 1)).toBe(ComparersResult.LessThan);
        expect(DefaultComparer(0.4, 0.44)).toBe(ComparersResult.LessThan);
        expect(DefaultComparer(false, true)).toBe(ComparersResult.LessThan);
        expect(DefaultComparer('A', 'B')).toBe(ComparersResult.LessThan);
    });    
    test('GreaterThan primitives', () => {
        expect(DefaultComparer(1, 0)).toBe(ComparersResult.GreaterThan);
        expect(DefaultComparer(0.44, 0.4)).toBe(ComparersResult.GreaterThan);
        expect(DefaultComparer(true, false)).toBe(ComparersResult.GreaterThan);
        expect(DefaultComparer('B', 'A')).toBe(ComparersResult.GreaterThan);
    });        
});

// function BooleanComparer(value1: any, value2: any): ComparersResult
describe('Comparers.BooleanComparer', () => {
    test('Equals', () => {
        expect(BooleanComparer(true, true)).toBe(ComparersResult.Equals);
        expect(BooleanComparer(false, false)).toBe(ComparersResult.Equals);
        expect(BooleanComparer(null, null)).toBe(ComparersResult.Equals);
        expect(BooleanComparer(undefined, undefined)).toBe(ComparersResult.Equals);
    });    
    test('Not Equals', () => {
        expect(BooleanComparer(true, false)).toBe(ComparersResult.NotEquals);
        expect(BooleanComparer(false, true)).toBe(ComparersResult.NotEquals);
        expect(BooleanComparer(true, null)).toBe(ComparersResult.NotEquals);
        expect(BooleanComparer(undefined, true)).toBe(ComparersResult.NotEquals);
        expect(BooleanComparer(false, null)).toBe(ComparersResult.NotEquals);
        expect(BooleanComparer(undefined, false)).toBe(ComparersResult.NotEquals);
    });        
    test('InvalidTypeErrors', () => {
        expect(() => BooleanComparer({}, false)).toThrow(/^Type is/);
        expect(() => BooleanComparer(false, {})).toThrow(/^Type is/);
        expect(() => BooleanComparer([], false)).toThrow(/^Type is/);
        expect(() => BooleanComparer(false, [])).toThrow(/^Type is/);
        expect(() => BooleanComparer(false, 0)).toThrow(/^Type is/);
        expect(() => BooleanComparer(0, false)).toThrow(/^Type is/);
        expect(() => BooleanComparer(false, 'A')).toThrow(/^Type is/);
        expect(() => BooleanComparer('A', false)).toThrow(/^Type is/);
        expect(() => BooleanComparer(null, 'A')).toThrow(/^Type is/);   // null is valid
        expect(() => BooleanComparer('A', null)).toThrow(/^Type is/);
    });
});

// function BooleanComparer(value1: any, value2: any): ComparersResult
describe('Comparers.CaseInsensitiveComparer', () => {
    test('Equals', () => {
        expect(CaseInsensitiveComparer('', '')).toBe(ComparersResult.Equals);
        expect(CaseInsensitiveComparer('A', 'A')).toBe(ComparersResult.Equals);
        expect(CaseInsensitiveComparer('A', 'a')).toBe(ComparersResult.Equals);
        expect(CaseInsensitiveComparer('a', 'A')).toBe(ComparersResult.Equals);

        expect(CaseInsensitiveComparer(null, null)).toBe(ComparersResult.Equals);
        expect(CaseInsensitiveComparer(undefined, undefined)).toBe(ComparersResult.Equals);
    });    
    test('Not Equals', () => {
        expect(CaseInsensitiveComparer('A', null)).toBe(ComparersResult.NotEquals);
        expect(CaseInsensitiveComparer(undefined, 'A')).toBe(ComparersResult.NotEquals);
        expect(CaseInsensitiveComparer(undefined, null)).toBe(ComparersResult.NotEquals);
    });      
    test('Less Than', () => {
        expect(CaseInsensitiveComparer('A', 'B')).toBe(ComparersResult.LessThan);
        expect(CaseInsensitiveComparer('a', 'b')).toBe(ComparersResult.LessThan);
        expect(CaseInsensitiveComparer('', 'A')).toBe(ComparersResult.LessThan);
        expect(CaseInsensitiveComparer('A', 'b')).toBe(ComparersResult.LessThan);
        expect(CaseInsensitiveComparer('a', 'B')).toBe(ComparersResult.LessThan);
    });   
    test('Greater Than', () => {
        expect(CaseInsensitiveComparer('B', 'A')).toBe(ComparersResult.GreaterThan);
        expect(CaseInsensitiveComparer('b', 'a')).toBe(ComparersResult.GreaterThan);
        expect(CaseInsensitiveComparer('A', '')).toBe(ComparersResult.GreaterThan);
        expect(CaseInsensitiveComparer('b', 'A')).toBe(ComparersResult.GreaterThan);
        expect(CaseInsensitiveComparer('B', 'a')).toBe(ComparersResult.GreaterThan);
    });            
    test('InvalidTypeErrors', () => {
        expect(() => CaseInsensitiveComparer({}, '')).toThrow(/^Type is/);
        expect(() => CaseInsensitiveComparer('', {})).toThrow(/^Type is/);
        expect(() => CaseInsensitiveComparer([], '')).toThrow(/^Type is/);
        expect(() => CaseInsensitiveComparer('', [])).toThrow(/^Type is/);
        expect(() => CaseInsensitiveComparer('', 0)).toThrow(/^Type is/);
        expect(() => CaseInsensitiveComparer(0, '')).toThrow(/^Type is/);
        expect(() => CaseInsensitiveComparer(false, 'A')).toThrow(/^Type is/);
        expect(() => CaseInsensitiveComparer('A', false)).toThrow(/^Type is/);
    });
});

describe('Comparers.DateTimeComparer', () => {
    test('Equals', () => {
        expect(DateTimeComparer(null, null)).toBe(ComparersResult.Equals);
        expect(DateTimeComparer(undefined, undefined)).toBe(ComparersResult.Equals);
        let date1 = new Date(2000, 10, 1, 2, 3, 4);
        expect(DateTimeComparer(date1, date1)).toBe(ComparersResult.Equals);
    });
    test('Undetermined', () => {
        let date1 = new Date(2000, 10, 1, 2, 3, 4);
        expect(DateTimeComparer(date1, null)).toBe(ComparersResult.Undetermined);
        expect(DateTimeComparer(undefined, date1)).toBe(ComparersResult.Undetermined);
        expect(DateTimeComparer(undefined, null)).toBe(ComparersResult.Undetermined);
    });          
    test('LessThan', () => {
        let date1 = new Date(2000, 10, 1);
        let date2 = new Date(2000, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2000, 10, 2);
        let date6 = new Date(2000, 10, 1, 1, 0, 0);
        let date7 = new Date(2000, 10, 1, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateTimeComparer(date1, date2)).toBe(ComparersResult.LessThan);
        expect(DateTimeComparer(date3, date1)).toBe(ComparersResult.LessThan);
        expect(DateTimeComparer(date1, date2)).toBe(ComparersResult.LessThan);
        expect(DateTimeComparer(date6, date2)).toBe(ComparersResult.LessThan);
        expect(DateTimeComparer(date1, date2)).toBe(ComparersResult.LessThan);
        expect(DateTimeComparer(date7, date5)).toBe(ComparersResult.LessThan);
        expect(DateTimeComparer(date1, date2)).toBe(ComparersResult.LessThan);
        expect(DateTimeComparer(date1, date8)).toBe(ComparersResult.LessThan);
    });    
    test('GreaterThan', () => {
        let date1 = new Date(2000, 10, 1);
        let date2 = new Date(2000, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2000, 10, 2);
        let date6 = new Date(2000, 10, 1, 1, 0, 0);
        let date7 = new Date(2000, 10, 1, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateTimeComparer(date2, date1)).toBe(ComparersResult.GreaterThan);
        expect(DateTimeComparer(date1, date3)).toBe(ComparersResult.GreaterThan);
        expect(DateTimeComparer(date2, date1)).toBe(ComparersResult.GreaterThan);
        expect(DateTimeComparer(date2, date6)).toBe(ComparersResult.GreaterThan);
        expect(DateTimeComparer(date2, date1)).toBe(ComparersResult.GreaterThan);
        expect(DateTimeComparer(date5, date7)).toBe(ComparersResult.GreaterThan);
        expect(DateTimeComparer(date2, date1)).toBe(ComparersResult.GreaterThan);
        expect(DateTimeComparer(date8, date1)).toBe(ComparersResult.GreaterThan);
    });        

    test('InvalidTypeErrors', () => {
        let date1 = new Date(2000, 10, 1);        
        expect(() => DateTimeComparer({}, date1)).toThrow(/^Type is/);
        expect(() => DateTimeComparer(date1, {})).toThrow(/^Type is/);
        expect(() => DateTimeComparer([], date1)).toThrow(/^Type is/);
        expect(() => DateTimeComparer(date1, [])).toThrow(/^Type is/);
        expect(() => DateTimeComparer(date1, 0)).toThrow(/^Type is/);
        expect(() => DateTimeComparer(0, date1)).toThrow(/^Type is/);
        expect(() => DateTimeComparer(date1, 'A')).toThrow(/^Type is/);
        expect(() => DateTimeComparer('A', date1)).toThrow(/^Type is/);
        expect(() => DateTimeComparer(date1, true)).toThrow(/^Type is/);
        expect(() => DateTimeComparer(true, date1)).toThrow(/^Type is/);
    });    
});


describe('Comparers.DateOnlyComparer', () => {
    test('Equals', () => {
        expect(DateOnlyComparer(null, null)).toBe(ComparersResult.Equals);
        expect(DateOnlyComparer(undefined, undefined)).toBe(ComparersResult.Equals);
        let date1 = new Date(2000, 10, 1);
        let date2 = new Date(2000, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 10, 1, 2, 3, 5);
        expect(DateOnlyComparer(date1, date1)).toBe(ComparersResult.Equals);
        expect(DateOnlyComparer(date2, date1)).toBe(ComparersResult.Equals);
        expect(DateOnlyComparer(date1, date2)).toBe(ComparersResult.Equals);
        expect(DateOnlyComparer(date2, date3)).toBe(ComparersResult.Equals);
        expect(DateOnlyComparer(date3, date2)).toBe(ComparersResult.Equals)
    });
    test('Undetermined', () => {
        let date1 = new Date(2000, 10, 1, 2, 3, 4);
        expect(DateOnlyComparer(date1, null)).toBe(ComparersResult.Undetermined);
        expect(DateOnlyComparer(undefined, date1)).toBe(ComparersResult.Undetermined);
        expect(DateOnlyComparer(undefined, null)).toBe(ComparersResult.Undetermined);
    });            
    test('LessThan', () => {
        let date1 = new Date(2000, 10, 1);
        let date2 = new Date(2000, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2000, 10, 2);
        let date6 = new Date(2000, 10, 1, 1, 0, 0);
        let date7 = new Date(2000, 10, 1, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateOnlyComparer(date3, date2)).toBe(ComparersResult.LessThan);
        expect(DateOnlyComparer(date3, date1)).toBe(ComparersResult.LessThan);
        expect(DateOnlyComparer(date1, date5)).toBe(ComparersResult.LessThan);
        expect(DateOnlyComparer(date6, date5)).toBe(ComparersResult.LessThan);
        expect(DateOnlyComparer(date7, date8)).toBe(ComparersResult.LessThan);
    });    
    test('GreaterThan', () => {
        let date1 = new Date(2000, 10, 1);
        let date2 = new Date(2000, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2000, 10, 2);
        let date6 = new Date(2000, 10, 1, 1, 0, 0);
        let date7 = new Date(2000, 10, 1, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateOnlyComparer(date2, date3)).toBe(ComparersResult.GreaterThan);
        expect(DateOnlyComparer(date1, date3)).toBe(ComparersResult.GreaterThan);
        expect(DateOnlyComparer(date5, date1)).toBe(ComparersResult.GreaterThan);
        expect(DateOnlyComparer(date5, date6)).toBe(ComparersResult.GreaterThan);
        expect(DateOnlyComparer(date8, date7)).toBe(ComparersResult.GreaterThan);
    });    


    test('InvalidTypeErrors', () => {
        let date1 = new Date(2000, 10, 1);        
        expect(() => DateOnlyComparer({}, date1)).toThrow(/^Type is/);
        expect(() => DateOnlyComparer(date1, {})).toThrow(/^Type is/);
        expect(() => DateOnlyComparer([], date1)).toThrow(/^Type is/);
        expect(() => DateOnlyComparer(date1, [])).toThrow(/^Type is/);
        expect(() => DateOnlyComparer(date1, 0)).toThrow(/^Type is/);
        expect(() => DateOnlyComparer(0, date1)).toThrow(/^Type is/);
        expect(() => DateOnlyComparer(date1, 'A')).toThrow(/^Type is/);
        expect(() => DateOnlyComparer('A', date1)).toThrow(/^Type is/);
        expect(() => DateOnlyComparer(date1, true)).toThrow(/^Type is/);
        expect(() => DateOnlyComparer(true, date1)).toThrow(/^Type is/);
    });    
});

describe('Comparers.DateAsMonthYearComparer', () => {
    test('Equals', () => {
        expect(DateAsMonthYearComparer(null, null)).toBe(ComparersResult.Equals);
        expect(DateAsMonthYearComparer(undefined, undefined)).toBe(ComparersResult.Equals);
        let date1 = new Date(2000, 10, 5);
        let date2 = new Date(2000, 10, 4, 2, 3, 4);
        let date3 = new Date(2000, 10, 1);
        let date4 = new Date(2000, 10, 30);

        expect(DateAsMonthYearComparer(date1, date1)).toBe(ComparersResult.Equals);
        expect(DateAsMonthYearComparer(date1, date2)).toBe(ComparersResult.Equals);
        expect(DateAsMonthYearComparer(date2, date1)).toBe(ComparersResult.Equals);
        expect(DateAsMonthYearComparer(date2, date3)).toBe(ComparersResult.Equals);
        expect(DateAsMonthYearComparer(date4, date1)).toBe(ComparersResult.Equals)
    });
    test('Undetermined', () => {
        let date1 = new Date(2000, 10, 1, 2, 3, 4);
        expect(DateAsMonthYearComparer(date1, null)).toBe(ComparersResult.Undetermined);
        expect(DateAsMonthYearComparer(undefined, date1)).toBe(ComparersResult.Undetermined);
        expect(DateAsMonthYearComparer(undefined, null)).toBe(ComparersResult.Undetermined);
    });            
    test('LessThan', () => {
        let date1 = new Date(2000, 10, 1);
        let date2 = new Date(2000, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2000, 10, 2);
        let date6 = new Date(2000, 11);
        let date7 = new Date(2001, 10, 1, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateAsMonthYearComparer(date3, date2)).toBe(ComparersResult.LessThan);
        expect(DateAsMonthYearComparer(date3, date1)).toBe(ComparersResult.LessThan);
        expect(DateAsMonthYearComparer(date1, date6)).toBe(ComparersResult.LessThan);
        expect(DateAsMonthYearComparer(date5, date6)).toBe(ComparersResult.LessThan);
        expect(DateAsMonthYearComparer(date6, date8)).toBe(ComparersResult.LessThan);
        expect(DateAsMonthYearComparer(date6, date7)).toBe(ComparersResult.LessThan);
    });    
    test('GreaterThan', () => {
        let date1 = new Date(2000, 10, 1);
        let date2 = new Date(2000, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2000, 10, 2);
        let date6 = new Date(2000, 11, 15);
        let date7 = new Date(2001, 10, 1, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateAsMonthYearComparer(date2, date3)).toBe(ComparersResult.GreaterThan);
        expect(DateAsMonthYearComparer(date1, date3)).toBe(ComparersResult.GreaterThan);
        expect(DateAsMonthYearComparer(date6, date1)).toBe(ComparersResult.GreaterThan);
        expect(DateAsMonthYearComparer(date6, date5)).toBe(ComparersResult.GreaterThan);
        expect(DateAsMonthYearComparer(date8, date6)).toBe(ComparersResult.GreaterThan);
        expect(DateAsMonthYearComparer(date7, date6)).toBe(ComparersResult.GreaterThan);
    });    


    test('InvalidTypeErrors', () => {
        let date1 = new Date(2000, 10, 1);        
        expect(() => DateAsMonthYearComparer({}, date1)).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer(date1, {})).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer([], date1)).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer(date1, [])).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer(date1, 0)).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer(0, date1)).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer(date1, 'A')).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer('A', date1)).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer(date1, true)).toThrow(/^Type is/);
        expect(() => DateAsMonthYearComparer(true, date1)).toThrow(/^Type is/);
    });    
});

describe('Comparers.DateAsAnniversaryComparer', () => {
    test('Equals', () => {
        expect(DateAsAnniversaryComparer(null, null)).toBe(ComparersResult.Equals);
        expect(DateAsAnniversaryComparer(undefined, undefined)).toBe(ComparersResult.Equals);
        let date1 = new Date(2000, 10, 4);
        let date2 = new Date(2000, 10, 4, 2, 3, 4);
        let date3 = new Date(2001, 10, 4);

        expect(DateAsAnniversaryComparer(date1, date1)).toBe(ComparersResult.Equals);
        expect(DateAsAnniversaryComparer(date1, date2)).toBe(ComparersResult.Equals);
        expect(DateAsAnniversaryComparer(date2, date1)).toBe(ComparersResult.Equals);
        expect(DateAsAnniversaryComparer(date2, date3)).toBe(ComparersResult.Equals);
        expect(DateAsAnniversaryComparer(date3, date2)).toBe(ComparersResult.Equals);
    });
    test('Undetermined', () => {
        let date1 = new Date(2000, 10, 1, 2, 3, 4);
        expect(DateAsAnniversaryComparer(date1, null)).toBe(ComparersResult.Undetermined);
        expect(DateAsAnniversaryComparer(undefined, date1)).toBe(ComparersResult.Undetermined);
        expect(DateAsAnniversaryComparer(undefined, null)).toBe(ComparersResult.Undetermined);
    });            
    test('LessThan', () => {
        let date1 = new Date(1997, 10, 1);
        let date2 = new Date(1998, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2006, 10, 2);
        let date6 = new Date(2000, 11, 15);
        let date7 = new Date(2001, 10, 2, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateAsAnniversaryComparer(date3, date2)).toBe(ComparersResult.LessThan);
        expect(DateAsAnniversaryComparer(date3, date1)).toBe(ComparersResult.LessThan);
        expect(DateAsAnniversaryComparer(date1, date6)).toBe(ComparersResult.LessThan);
        expect(DateAsAnniversaryComparer(date1, date5)).toBe(ComparersResult.LessThan);
        expect(DateAsAnniversaryComparer(date8, date6)).toBe(ComparersResult.LessThan);
        expect(DateAsAnniversaryComparer(date7, date6)).toBe(ComparersResult.LessThan);
    });    
    test('GreaterThan', () => {
        let date1 = new Date(1997, 10, 1);
        let date2 = new Date(1998, 10, 1, 2, 3, 4);
        let date3 = new Date(2000, 9, 1);
        let date5 = new Date(2006, 10, 2);
        let date6 = new Date(2000, 11, 15);
        let date7 = new Date(2001, 10, 2, 23, 59, 59);
        let date8 = new Date(2001, 10, 1);
        
        expect(DateAsAnniversaryComparer(date2, date3)).toBe(ComparersResult.GreaterThan);
        expect(DateAsAnniversaryComparer(date1, date3)).toBe(ComparersResult.GreaterThan);
        expect(DateAsAnniversaryComparer(date6, date1)).toBe(ComparersResult.GreaterThan);
        expect(DateAsAnniversaryComparer(date6, date5)).toBe(ComparersResult.GreaterThan);
        expect(DateAsAnniversaryComparer(date6, date8)).toBe(ComparersResult.GreaterThan);
        expect(DateAsAnniversaryComparer(date6, date7)).toBe(ComparersResult.GreaterThan);
    });


    test('InvalidTypeErrors', () => {
        let date1 = new Date(2000, 10, 1);        
        expect(() => DateAsAnniversaryComparer({}, date1)).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer(date1, {})).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer([], date1)).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer(date1, [])).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer(date1, 0)).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer(0, date1)).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer(date1, 'A')).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer('A', date1)).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer(date1, true)).toThrow(/^Type is/);
        expect(() => DateAsAnniversaryComparer(true, date1)).toThrow(/^Type is/);
    });    
});