// tests use Jest v3 syntax with expect().toBe() and expect().toEqual() assertions

// create a subclass of ModuleServicesInstaller to test the base class functionality
import { ModuleServicesInstaller } from "../../src/Services/ModuleServicesInstaller";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { ValidationServices } from "../../src/Services/ValidationServices";

class TestServiceInstaller extends ModuleServicesInstaller<string> {
    constructor() {
        super("testService");
    }
    protected createDefaultService(services: IValidationServices): string {
        return "defaultTestService";
    }
}

declare module "../../src/Interfaces/ValidationServices" {
    interface IValidationServices {
        testService?: string;
    }
}
declare module "../../src/Services/ValidationServices" {
    interface ValidationServices {
        testService?: string;
    }
}

let installer: TestServiceInstaller;
beforeEach(() => {
    installer = new TestServiceInstaller();
});

afterEach(() => {
    installer?.uninstall();
});

describe('ModuleServicesInstaller', () => {
    test('installs the property definition into the prototype of ValidationServices', () => {
        expect(installer.installed).toBe(true);
        expect(Object.getOwnPropertyDescriptor(ValidationServices.prototype, 'testService')).toBeDefined();
    });
    test('should install a new service property on ValidationServices', () => {
        const services = new ValidationServices();

        // Access the testService property to trigger lazy installation
        expect(services.getService("testService")).toBeDefined();
        expect(services.testService).toBe("defaultTestService");
    });
    test('should not overwrite an existing service property on ValidationServices', () => {
        const installer2 = new TestServiceInstaller(); // Attempt to install again
        expect(installer.installed).toBe(true); // Should not install again
        expect(installer2.installed).toBe(false);
    });
        

});