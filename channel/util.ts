export function fireAndForget(fn: () => unknown) {
    new Promise<void>(resolve => {
        fn();
        resolve();
    });
}