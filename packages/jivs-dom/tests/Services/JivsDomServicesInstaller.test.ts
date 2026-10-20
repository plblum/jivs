/** @jest-environment jsdom */
import { JivsServices } from '@plblum/jivs-engine/build/Services/JivsServices';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { JivsDomServices } from '../../src/Services/JivsDomServices';
import {
    JivsDomServicesInstaller,
    jivsDomServicesInstaller
} from '../../src/Services/JivsDomServicesInstaller';

/**
 * Creates a new engine service container with the DOM service installer loaded.
 */
function setup(): {
    testItem: JivsServices
}
{
    return {
        testItem: new JivsServices()
    };
}

// Importing the module's singleton installs the domServices property on JivsServices.prototype.
describe('JivsDomServicesInstaller singleton installation', () => {
    test('Installs a non-enumerable getter and setter on JivsServices.prototype', () => {
        let descriptor = Object.getOwnPropertyDescriptor(JivsServices.prototype, 'domServices');

        expect(jivsDomServicesInstaller.installed).toBe(true);
        expect(descriptor).toBeDefined();
        expect(descriptor?.enumerable).toBe(false);
        expect(descriptor?.get).toBeDefined();
        expect(descriptor?.set).toBeDefined();
    });

    test('Does not overwrite the installed property when another installer is constructed', () => {
        let descriptor = Object.getOwnPropertyDescriptor(JivsServices.prototype, 'domServices');
        let duplicateInstaller = new JivsDomServicesInstaller();
        let descriptorAfterDuplicate = Object.getOwnPropertyDescriptor(JivsServices.prototype, 'domServices');

        expect(duplicateInstaller.installed).toBe(false);
        expect(descriptorAfterDuplicate?.get).toBe(descriptor?.get);
        expect(descriptorAfterDuplicate?.set).toBe(descriptor?.set);
        expect(jivsDomServicesInstaller.installed).toBe(true);
    });
});

// The installed getter lazily creates one JivsDomServices instance and stores it in the engine service container.
describe('JivsDomServicesInstaller default service', () => {
    test('Creates and caches a JivsDomServices instance on first access', () => {
        let { testItem } = setup();

        let domServices = testItem.domServices;

        expect(domServices).toBeInstanceOf(JivsDomServices);
        expect(testItem.domServices).toBe(domServices);
        expect(testItem.getService('domServices')).toBe(domServices);
    });
});

// The installed setter registers a caller-supplied DOM service through the existing engine service container.
describe('JivsDomServicesInstaller service replacement', () => {
    test('Returns an explicitly assigned DOM service rather than creating the default', () => {
        let { testItem } = setup();
        let replacement = new JivsDomServices();

        testItem.domServices = replacement;

        expect(testItem.domServices).toBe(replacement);
        expect(testItem.getService('domServices')).toBe(replacement);
    });

    test('Uses a DOM service registered directly through setService', () => {
        let { testItem } = setup();
        let replacement = new JivsDomServices();

        testItem.setService('domServices', replacement);

        expect(testItem.domServices).toBe(replacement);
    });

    test('Does not replace an already registered DOM service when reading the property', () => {
        let { testItem } = setup();
        let replacement = {} as IJivsDomServices;
        testItem.setService('domServices', replacement);

        expect(testItem.domServices).toBe(replacement);
        expect(testItem.getService('domServices')).toBe(replacement);
    });
});
