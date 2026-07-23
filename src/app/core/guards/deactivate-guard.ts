import { CanDeactivateFn } from '@angular/router';
import { ICanComponentDeactivate } from '../models/canDeactivate.model';

export const deactivateGuard: CanDeactivateFn<ICanComponentDeactivate> = (
  component, currentRoute, currentState, nextState
) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};
