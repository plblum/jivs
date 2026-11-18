import { RelativeDate } from '../src/Calculating_relative_dates';

// All test relative to 2001-05-15
function testRelativeDate(relativeDate: RelativeDate, expectedYear: number, expectedMonth: number, expectedDay: number)
{
    let today = new Date(Date.UTC(2001, 5, 15));

    relativeDate.utcToday = today;
    let resultDate = relativeDate.resolvedDate;
    expect(resultDate.getUTCFullYear()).toBe(expectedYear);
    expect(resultDate.getUTCMonth()).toBe(expectedMonth);
    expect(resultDate.getUTCDate()).toBe(expectedDay);
}
test('The RelativeDate class itself', () => {
    testRelativeDate(new RelativeDate(1, 0), 2001, 5, 16);
    testRelativeDate(new RelativeDate(-1, 0), 2001, 5, 14);    
    testRelativeDate(new RelativeDate(0, 1), 2001, 6, 15); 
    testRelativeDate(new RelativeDate(0, 2), 2001, 7, 14);  // our code adds 30 days for a month. June was 30 days. 
    testRelativeDate(new RelativeDate(0, 0, 1), 2002, 5, 15);  // our code adds 365 days for a year 
    testRelativeDate(new RelativeDate(0, 0, -1), 2000, 5, 15);  // our code adds 365 days for a year     
});
