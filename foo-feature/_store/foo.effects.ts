import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

@Injectable()
export class FooEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  // Add effects here as needed
}
