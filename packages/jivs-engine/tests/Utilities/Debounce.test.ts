import { Debouncer } from './../../src/Utilities/Debounce';

describe('Debouncer', () => {
    jest.useFakeTimers();

    let func: jest.Mock;
    let debouncer: Debouncer<(...args: any[]) => void>;
    const waitFor = 250;
    const waitForSmallIncrement = 20;   // always a small amount from waitFor

    beforeEach(() => {
        func = jest.fn();
    });

    test('should execute immediately on the first call when immediate is true', () => {
        debouncer = new Debouncer(func, waitFor, true);
        debouncer.run('test', true);
        expect(func).toHaveBeenCalledWith('test', true);
        expect(func).toHaveBeenCalledTimes(1);

        // Ensure no further calls when time advances
        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledTimes(1);
    });

    test('should debounce subsequent calls', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run('call 1', false);
        jest.advanceTimersByTime(waitForSmallIncrement);
        debouncer.run('call 2', true);
        debouncer.run('call 3', true);
        expect(func).toHaveBeenCalledTimes(0);
        jest.advanceTimersByTime(10);
        debouncer.run('call 4', false);
        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith('call 4', false);
    });

    test('should cancel a debounced call', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run('test', false);
        debouncer.cancel();

        jest.advanceTimersByTime(waitFor);
        expect(func).not.toHaveBeenCalled();
    });

    test('forceRun should execute immediately and cancel any scheduled execution', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run('will be canceled', false);
        debouncer.forceRun('immediate', true);

        expect(func).toHaveBeenCalledWith('immediate', true);
        expect(func).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledTimes(1);
    });

    test('dispose should cancel any pending execution', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run('pending', true);
        debouncer.dispose();

        jest.advanceTimersByTime(waitFor);
        expect(func).not.toHaveBeenCalled();
    });
    test('should handle rapidly changing call uments correctly', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run('call 1', true);
        jest.advanceTimersByTime(waitForSmallIncrement);
        debouncer.run('call 2', false);
        jest.advanceTimersByTime(waitForSmallIncrement);
        debouncer.run('call 3', true);
    
        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith('call 3', true);
    });
    
    test('should allow multiple instances to function independently', () => {
        let waitFor2 = 300;
        let longerThanWaitFor2 = waitFor2 + 100;
        let shorterThanWaitFor2 = waitFor2 - 100;
        debouncer = new Debouncer(func, waitFor2 + shorterThanWaitFor2 - 10);

        const func2 = jest.fn();
        const debouncer2 = new Debouncer(func2, waitFor2);
    
        debouncer.run('instance 1', true);
        debouncer2.run('instance 2', false);
    
        jest.advanceTimersByTime(longerThanWaitFor2);
        expect(func).not.toHaveBeenCalled();  // because its timer is not up yet
        expect(func2).toHaveBeenCalledTimes(1); // because its timer is up
        expect(func2).toHaveBeenCalledWith('instance 2', false);
    
        jest.advanceTimersByTime(shorterThanWaitFor2);
        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith('instance 1', true);
    });
    
    test('immediate flag should not affect subsequent calls', () => {
        debouncer = new Debouncer(func, waitFor, true);
        debouncer.run('immediate call', true);
        expect(func).toHaveBeenCalledTimes(1);
    
        jest.advanceTimersByTime(waitForSmallIncrement);
        debouncer.run('subsequent call', false);
        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledTimes(2);
        expect(func).toHaveBeenCalledWith('subsequent call', false);
    });
    
    test('dispose should prevent any future executions even if run is called', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run('before dispose', true);
        debouncer.dispose();
        debouncer.run('after dispose', true);
    
        jest.advanceTimersByTime(waitFor);
        expect(func).not.toHaveBeenCalled();
    });
    
    test('disposing an instance should not affect other instances', () => {
        const func2 = jest.fn();
        const debouncer2 = new Debouncer(func2, 300);
    
        debouncer.run('instance 1', true);
        debouncer2.run('instance 2', false);
        debouncer.dispose();
    
        jest.advanceTimersByTime(300);
        expect(func).not.toHaveBeenCalled();  // disposed, should not fire
        expect(func2).toHaveBeenCalledTimes(1);
        expect(func2).toHaveBeenCalledWith('instance 2', false);
    });
    test('should reset isCalled flag correctly when the immediate option is used', () => {
        debouncer = new Debouncer(func, waitFor, true);
        debouncer.run('initial', true);
        jest.advanceTimersByTime(waitFor);
        debouncer.run('after wait', false);
        expect(func).toHaveBeenCalledTimes(1);        
        jest.advanceTimersByTime(waitFor);

        expect(func).toHaveBeenCalledTimes(2);
        expect(func).toHaveBeenNthCalledWith(1, 'initial', true);
        expect(func).toHaveBeenNthCalledWith(2, 'after wait', false);
    });
    
    test('should properly handle back-to-back immediate calls', () => {
        debouncer = new Debouncer(func, waitFor, true);
        debouncer.run('first immediate', true);
        debouncer.run('second immediate', false);
    
        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith('first immediate', true);
    
        jest.advanceTimersByTime(waitForSmallIncrement);
        debouncer.run('third immediate', false);
        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledTimes(2);
        expect(func).toHaveBeenNthCalledWith(2, 'third immediate', false);
    });
    
    test('should not execute debounced function if disposed during delay', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run('will be disposed', false);
        jest.advanceTimersByTime(waitForSmallIncrement);
        debouncer.dispose();
    
        jest.advanceTimersByTime(waitForSmallIncrement);
        expect(func).not.toHaveBeenCalled();
    });
    
    test('should handle null and undefined arguments properly', () => {
        debouncer = new Debouncer(func, waitFor);
        debouncer.run(null);
        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledWith(null);
    
        debouncer.run(undefined);
        jest.advanceTimersByTime(waitFor);
        expect(func).toHaveBeenCalledWith(undefined);
    });
        
    test('edge case with very short wait time', () => {
        debouncer = new Debouncer(func, 1); // extremely short wait time
        debouncer.run('quick', true);
        jest.advanceTimersByTime(1);
        debouncer.run('quicker', false);
    
        jest.advanceTimersByTime(1);
        expect(func).toHaveBeenCalledTimes(2);
        expect(func).toHaveBeenNthCalledWith(1, 'quick', true);
        expect(func).toHaveBeenNthCalledWith(2, 'quicker', false);
    });
    test('run does nothing after dispose', () => {
        debouncer = new Debouncer(func, waitFor); 
        debouncer.dispose();
        debouncer.run('call 1', true);
        expect(func).toHaveBeenCalledTimes(0);
    });    
    test('forceRun does nothing after dispose', () => {
        debouncer = new Debouncer(func, waitFor); 
        debouncer.dispose();
        debouncer.forceRun('call 1', true);
        expect(func).toHaveBeenCalledTimes(0);
    });    
});
