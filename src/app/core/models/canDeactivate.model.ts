export interface ICanComponentDeactivate {
    canDeactivate: () => boolean | Promise<boolean>;
}
