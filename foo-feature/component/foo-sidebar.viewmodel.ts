import { Signal, computed } from "@angular/core";
import { Store } from "@ngrx/store";
import { selectFooInputText, selectFoos, selectSelectedFooId } from "../_store/foo.selectors";

declare namespace FromCore {
  export const selectPermissions: any;
}

declare namespace FromFoo {
  export const selectFoos: any;
  export const selectFooInputText: any;
  export const selectSelectedFooId: any;
}

declare global {
  export type Foo = {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
  };

  export type FooItemVM = {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly status: 'active' | 'inactive';
    readonly isSelected: boolean;
  };
}

/**
 * Use the ViewModel type to define a contract between the view and the rest of the application.
 * 
 * This is an opportunity to add clarity and intention as well as making code easier to read and maintain.
 * 
 * The most important thing is aiming to have the 'contract' be readable from both sides, so that we're
 * never asking the question(s)
 * 
 * From view model side: "What will the component/view do with this data or flag?"
 * 
 * From view side: "What am I supposed to do with this data or flag?"
 * 
 */
export type FooSidebarVM = {
  readonly showLoadingSpinner: boolean;
  readonly showFooMessageInput: boolean;
  readonly fooMessageInputValue: string;
  readonly foosToDisplay: FooItemVM[];
  readonly hasResults: boolean;
  readonly showSendMessageButton: boolean;
  readonly disableSendMessageButton: boolean;
  readonly errorMessageToShow: string | null;
};

/**
 * mapTo***VM function. This is where you take in all the relevant data and signals and compute the view model.
 * 
 * It's where you can compute derived data and handle any necessary transformations but if you find this function
 * getting complex consider if some of it can be moved to the store selectors instead.
 * 
 * Be very careful with these mapping functions. One null reference error will break the entire component.
 * Strict typing and tsconfig settings like "strictNullChecks" are your friends. Code linting and SonarQube rules
 * can help catch potential issues early as can time spent on writing unit tests for these functions.
 * 
 * mapToVM functions like this are great for unit testing, think about how many meaningful unit tests you can
 * write for the imagined function below.
 */
export function mapToFooSidebarVM(input: {
  permissions: string[];
  foos: Foo[] | undefined;
  inputText: string;
  selectedId: string | null;
  expanded: boolean;
  searchText: string;
}): FooSidebarVM {
  
  // It's often worth creating intermediate variables for complex conditions to improve readability.
  const canSendMessage = input.permissions.includes('can_send_message');
  const hasFoos = !!input.foos?.length;

  return {
    showLoadingSpinner: input.foos === undefined,
    showFooMessageInput: canSendMessage && hasFoos,
    fooMessageInputValue: input.inputText,
    foosToDisplay: (input.foos ?? []).map(foo => ({
      id: foo.id,
      name: foo.name,
      description: foo.description ?? '',
      status: foo.status,
      isSelected: foo.id === input.selectedId
    })).filter(foo => foo.name.toLowerCase().includes(input.searchText.toLowerCase())),
    hasResults: !!input.foos?.length,
    showSendMessageButton: canSendMessage && hasFoos,
    disableSendMessageButton: !input.selectedId || input.inputText.trim() === '',
    errorMessageToShow: !hasFoos ? 'No foos found.' : null
  };
}

/**
 * VM function that's used inside the component as we almost always need to take in a reference to the
 * store and possibly other signals that are relevant to the component's local UI state.
 */
export function fooSidebarVM(store: Store, searchText: Signal<string>, expanded: Signal<boolean>): Signal<FooSidebarVM> {

  // Domain state (from NgRx as signals)
  const permissions: Signal<string[]> = store.selectSignal(FromCore.selectPermissions);
  const foos: Signal<Foo[] | null | undefined> = store.selectSignal(FromFoo.selectFoos);
  const inputText: Signal<string> = store.selectSignal(FromFoo.selectFooInputText);
  const selectedId: Signal<string | null> = store.selectSignal(FromFoo.selectSelectedFooId);

  return computed(() => {
    return mapToFooSidebarVM({
      permissions: permissions(),
      foos: foos(),
      inputText: inputText(),
      selectedId: selectedId(),
      expanded: expanded(),
      searchText: searchText()
    });
  });
}


