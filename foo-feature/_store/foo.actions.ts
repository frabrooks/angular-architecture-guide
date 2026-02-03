import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Foo } from '../component/foo-sidebar.viewmodel';

export const FooActions = createActionGroup({
  source: 'Foo',
  events: {
    'Navigated to Foo': emptyProps(),
    'Update foo input': props<{ text: string }>(),
    'Selected': props<{ id: string }>(),
    'Load Requested': emptyProps(),
    'Clear Selection': emptyProps(),
    'Load Success': props<{ foos: Foo[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Create Success': props<{ foo: Foo }>(),
    'Create Failure': props<{ error: string }>(),
    'Update Success': props<{ foo: Foo }>(),
    'Update Failure': props<{ error: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),
  },
});

