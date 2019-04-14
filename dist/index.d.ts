import { Subject, Observable, Subscription } from 'rxjs';
export declare class StateObservable<S> extends Observable<S> {
    value: S;
    __notifier: Subject<S>;
    __subscription: Subscription;
    constructor(stateSubject: Subject<S>, initialState: S);
}
export declare type StateAndCallbacksFor<A extends Actions> = [StateFor<A>, CallbacksFor<A>];
export declare type StateFor<A extends Actions> = A extends Actions<infer S, any> ? S : never;
export declare type CallbacksFor<A extends Actions> = A extends Actions<any, infer R> ? {
    [T in ActionUnion<R>['type']]: (...payload: ActionByType<ActionUnion<R>, T>['payload']) => void;
} : never;
export declare type Actions<S = any, R extends ActionRecordBase<S> = any> = (state: S) => R;
export declare type ActionRecordBase<S = any> = Record<string, (...args: any[]) => S extends object ? S | void : S>;
export declare type ActionUnion<R extends ActionRecordBase> = {
    [T in keyof R]: {
        type: T;
        payload: Parameters<R[T]>;
    };
}[keyof R];
export declare type ActionByType<A, T> = A extends {
    type: infer T2;
} ? (T extends T2 ? A : never) : never;
export declare interface Epic<S, R extends ActionRecordBase<S>> {
    (action$: Observable<ActionUnion<R>>, state$: StateObservable<S>, actions: CallbacksFor<Actions<S, R>>): any;
}
export declare function useEpics<S, R extends ActionRecordBase<S>>(createActions: Actions<S, R>, initialState: S, epics?: Epic<S, R>[]): StateAndCallbacksFor<typeof createActions>;
export declare function ofTypeOperator<T extends ActionUnion<any>, R extends T = T, K extends R['type'] = R['type']>(...key: K[]): (source: Observable<T>) => Observable<R>;
export declare const ofType: <T extends {
    type: string;
    payload: unknown[];
}>(...keys: string[]) => (source: Observable<T>) => Observable<T>;
