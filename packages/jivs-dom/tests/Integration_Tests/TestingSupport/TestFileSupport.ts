/**
 * Helpers for the top of an integration test file.
 *
 * Typical file:
 * ```ts
 * // When true, emits HTML and element registry information to the console.
 * let verbose = false;
 * useCleanDocument();
 * ```
 * Keep `verbose` in each file and pass it to createTestForm({ verbose }), so a single file can be switched on.
 */
import { createDefaultTestFieldRepository, type TestFieldRepository } from './TestFieldRepository';

/** Empties document.body after every test in the file, so pages built by one test never reach the next. */
export function useCleanDocument(): void
{
    afterEach(() => { document.body.innerHTML = ''; });
}

/**
 * Runs the test once for each Field Identity in the repository. A newly registered identity
 * is therefore covered automatically. Put %s in the title to show the identity name.
 */
export function testEachIdentity(title: string, run: (identityName: string) => void,
    repository: TestFieldRepository = createDefaultTestFieldRepository()): void
{
    test.each(repository.identityNames())(title, run);
}

/** Runs the test once for each field template in the repository. Put %s in the title to show its name. */
export function testEachFieldTemplate(title: string, run: (templateName: string) => void,
    repository: TestFieldRepository = createDefaultTestFieldRepository()): void
{
    test.each(repository.fieldTemplateNames())(title, run);
}
