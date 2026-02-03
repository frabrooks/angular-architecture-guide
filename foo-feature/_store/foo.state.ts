export interface FooState {
  inputText: string;
  foos: any[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialFooState: FooState = {
  inputText: '',
  foos: [],
  selectedId: null,
  loading: false,
  error: null
};
