import {
  Aggregate,
  AggregateAdd,
  AggregateRemove,
  AggregateReplace,
  GetTableCell,
  Group,
  Having,
  Join,
  Limit,
  Order,
  Queries,
  QueriesListenerStats,
  ResultCellIdsListener,
  ResultCellListener,
  ResultRowIdsListener,
  ResultRowListener,
  ResultTableListener,
  Select,
  Where,
  createQueries as createQueriesDecl,
} from './queries.d';
import {
  Cell,
  CellCallback,
  CellOrUndefined,
  GetCell,
  GetCellChange,
  Row,
  RowCallback,
  Store,
  Table,
  TableCallback,
} from './store.d';
import {Id, IdOrNull, Ids, SortKey} from './common.d';
import {
  IdMap,
  IdMap2,
  mapEnsure,
  mapForEach,
  mapGet,
  mapKeys,
  mapNew,
  mapSet,
  visitTree,
} from './common/map';
import {IdSet, setAdd, setNew} from './common/set';
import {
  arrayEvery,
  arrayForEach,
  arrayIsEmpty,
  arrayIsEqual,
  arrayLength,
  arrayMap,
  arrayPush,
  arraySlice,
  arraySort,
} from './common/array';
import {
  collClear,
  collDel,
  collForEach,
  collHas,
  collIsEmpty,
  collSize,
} from './common/coll';
import {getAggregateValue, numericAggregators} from './common/aggregators';
import {getCellType, setOrDelCell} from './common/cell';
import {getCreateFunction, getDefinableFunctions} from './common/definable';
import {
  getUndefined,
  ifNotUndefined,
  isFunction,
  isUndefined,
} from './common/other';
import {objFreeze, objIds} from './common/obj';
import {EMPTY_STRING} from './common/strings';
import {defaultSorter} from './common';

type StoreWithCreateMethod = Store & {createStore: () => Store};
type SelectClause = (getTableCell: GetTableCell, rowId: Id) => CellOrUndefined;
type JoinClause = [
  Id,
  IdOrNull,
  ((getCell: GetCell, rowId: Id) => Id) | null,
  Ids,
  IdMap<[Id, Id]>,
];
type WhereClause = (getTableCell: GetTableCell) => boolean;
type GroupClause = [Id, Aggregators];
type HavingClause = (getSelectedOrGroupedCell: GetCell) => boolean;
type OrderClause = [
  (getSelectedOrGroupedCell: GetCell, rowId: Id) => SortKey,
  boolean?,
];

type Aggregators = [
  Aggregate,
  AggregateAdd?,
  AggregateRemove?,
  AggregateReplace?,
];

export const createQueries: typeof createQueriesDecl = getCreateFunction(
  (store: Store): Queries => {
    const createStore = (store as StoreWithCreateMethod).createStore;
    const [
      getStore,
      getQueryIds,
      forEachQuery,
      hasQuery,
      getTableId,
      ,
      ,
      setDefinition,
      ,
      delDefinition,
      destroy,
      addStoreListeners,
      delStoreListeners,
    ] = getDefinableFunctions<true, undefined>(store, () => true, getUndefined);
    const preStore1 = createStore();
    const preStore2 = createStore();
    const resultStore = createStore();
    const preStoreListenerIds: Map<Id, Map<Store, IdSet>> = mapNew();

    const addPreStoreListener = (
      preStore: Store,
      queryId: Id,
      ...listenerIds: Ids
    ) =>
      arrayForEach(listenerIds, (listenerId) =>
        setAdd(
          mapEnsure(
            mapEnsure<Id, Map<Store, IdSet>>(
              preStoreListenerIds,
              queryId,
              mapNew,
            ),
            preStore,
            setNew,
          ),
          listenerId,
        ),
      );

    const cleanPreStores = (queryId: Id) =>
      arrayForEach([resultStore, preStore2, preStore1], (store) =>
        store.delTable(queryId),
      );

    const synchronizeTransactions = (
      queryId: Id,
      fromStore: Store,
      toStore: Store,
    ) =>
      addPreStoreListener(
        fromStore,
        queryId,
        fromStore.addWillFinishTransactionListener(toStore.startTransaction),
        fromStore.addDidFinishTransactionListener(() =>
          toStore.finishTransaction(),
        ),
      );

    const setQueryDefinition = (
      queryId: Id,
      tableId: Id,
      build: (builders: {
        select: Select;
        join: Join;
        where: Where;
        group: Group;
        having: Having;
        order: Order;
        limit: Limit;
      }) => void,
    ): Queries => {
      setDefinition(queryId, tableId);
      cleanPreStores(queryId);

      let offsetLimit: [offset: number, limit: number] | undefined;
      const selectEntries: [Id, SelectClause][] = [];
      const joinEntries: [IdOrNull, JoinClause][] = [
        [null, [tableId, null, null, [], mapNew()]],
      ];
      const wheres: WhereClause[] = [];
      const groupEntries: [Id, GroupClause][] = [];
      const havings: HavingClause[] = [];
      const orders: OrderClause[] = [];

      const select = (
        arg1: Id | ((getTableCell: GetTableCell, rowId: Id) => CellOrUndefined),
        arg2?: Id,
      ) => {
        const selectEntry: [Id, SelectClause] = isFunction(arg1)
          ? [arrayLength(selectEntries) + EMPTY_STRING, arg1]
          : [
              isUndefined(arg2) ? arg1 : arg2,
              (getTableCell) => getTableCell(arg1, arg2 as Id),
            ];
        arrayPush(selectEntries, selectEntry);
        return {as: (selectedCellId: Id) => (selectEntry[0] = selectedCellId)};
      };

      const join = (
        joinedTableId: Id,
        arg1: Id | ((getCell: GetCell, rowId: Id) => Id | undefined),
        arg2?: Id | ((getCell: GetCell, rowId: Id) => Id | undefined),
      ) => {
        const fromIntermediateJoinedTableId =
          isUndefined(arg2) || isFunction(arg1) ? null : arg1;
        const onArg = isUndefined(fromIntermediateJoinedTableId) ? arg1 : arg2;
        const joinEntry: [Id, JoinClause] = [
          joinedTableId,
          [
            joinedTableId,
            fromIntermediateJoinedTableId,
            isFunction(onArg) ? onArg : (getCell) => getCell(onArg as Id),
            [],
            mapNew(),
          ] as JoinClause,
        ];
        arrayPush(joinEntries, joinEntry);
        return {as: (joinedTableId: Id) => (joinEntry[0] = joinedTableId)};
      };

      const where = (
        arg1: Id | ((getTableCell: GetTableCell) => boolean),
        arg2?: Id | Cell,
        arg3?: Cell,
      ) =>
        arrayPush(
          wheres,
          isFunction(arg1)
            ? arg1
            : isUndefined(arg3)
            ? (getTableCell) => getTableCell(arg1) === arg2
            : (getTableCell) => getTableCell(arg1, arg2 as Id) === arg3,
        );

      const group = (
        selectedCellId: Id,
        aggregate: 'count' | 'sum' | 'avg' | 'min' | 'max' | Aggregate,
        aggregateAdd?: AggregateAdd,
        aggregateRemove?: AggregateRemove,
        aggregateReplace?: AggregateReplace,
      ) => {
        const groupEntry: [Id, GroupClause] = [
          selectedCellId,
          [
            selectedCellId,
            isFunction(aggregate)
              ? [aggregate, aggregateAdd, aggregateRemove, aggregateReplace]
              : (mapGet(
                  numericAggregators,
                  aggregate as Id,
                ) as Aggregators) ?? [(_cells, length) => length],
          ],
        ];
        arrayPush(groupEntries, groupEntry);
        return {as: (groupedCellId: Id) => (groupEntry[0] = groupedCellId)};
      };

      const having = (
        arg1: Id | ((getSelectedOrGroupedCell: GetCell) => boolean),
        arg2?: Cell,
      ) =>
        arrayPush(
          havings,
          isFunction(arg1)
            ? arg1
            : (getSelectedOrGroupedCell) =>
                getSelectedOrGroupedCell(arg1) === arg2,
        );

      const order = (
        arg1: Id | ((getSelectedOrGroupedCell: GetCell, rowId: Id) => SortKey),
        descending?: boolean,
      ) =>
        arrayPush(orders, [
          isFunction(arg1)
            ? arg1
            : (getSelectedOrGroupedCell) => getSelectedOrGroupedCell(arg1) ?? 0,
          descending,
        ]);

      const limit = (arg1: number, arg2?: number) => {
        offsetLimit = isUndefined(arg2) ? [0, arg1] : [arg1, arg2];
      };

      build({select, join, where, group, having, order, limit});

      const selects: IdMap<SelectClause> = mapNew(selectEntries);
      if (collIsEmpty(selects)) {
        return queries;
      }
      const joins: Map<IdOrNull, JoinClause> = mapNew(joinEntries);
      mapForEach(joins, (asTableId, [, fromAsTableId]) =>
        ifNotUndefined(mapGet(joins, fromAsTableId), ({3: toAsTableIds}) =>
          isUndefined(asTableId) ? 0 : arrayPush(toAsTableIds, asTableId),
        ),
      );
      const groups: IdMap<GroupClause> = mapNew(groupEntries);

      let selectJoinWhereStore = preStore1;
      let groupHavingStore = preStore2;

      // ORDER & LIMIT

      if (arrayIsEmpty(orders) && isUndefined(offsetLimit)) {
        groupHavingStore = resultStore;
      } else {
        synchronizeTransactions(queryId, groupHavingStore, resultStore);

        const groupRowIdSorter = (rowId1: Id, rowId2: Id) => {
          const sortKeys1 = mapGet(sortKeysByGroupRowId, rowId1) ?? [];
          const sortKeys2 = mapGet(sortKeysByGroupRowId, rowId2) ?? [];
          const orderIndex = orders.findIndex(
            (_order, index) => sortKeys1[index] !== sortKeys2[index],
          );
          return orderIndex < 0
            ? 0
            : defaultSorter(sortKeys1[orderIndex], sortKeys2[orderIndex]) *
                (orders[orderIndex][1] ? -1 : 1);
        };
        const sortKeysByGroupRowId: IdMap<SortKey[]> = mapNew();
        const sortedGroupRowIds: IdMap<0 | 1> = mapNew();

        addPreStoreListener(
          groupHavingStore,
          queryId,
          arrayIsEmpty(orders)
            ? groupHavingStore.addRowIdsListener(queryId, () =>
                collClear(sortedGroupRowIds),
              )
            : groupHavingStore.addRowListener(
                queryId,
                null,
                (_store, _tableId, groupRowId) => {
                  let newSortKeys = null;
                  if (groupHavingStore.hasRow(queryId, groupRowId)) {
                    const oldSortKeys =
                      mapGet(sortKeysByGroupRowId, groupRowId) ?? [];
                    const groupRow = groupHavingStore.getRow(
                      queryId,
                      groupRowId,
                    );
                    const getCell = (getSelectedOrGroupedCell: Id) =>
                      groupRow[getSelectedOrGroupedCell];
                    newSortKeys = arrayMap(orders, ([getSortKey]) =>
                      getSortKey(getCell, groupRowId),
                    );
                    if (arrayIsEqual(oldSortKeys, newSortKeys)) {
                      if (mapGet(sortedGroupRowIds, groupRowId)) {
                        resultStore.setRow(queryId, groupRowId, groupRow);
                      }
                      return;
                    }
                  }
                  mapSet(sortKeysByGroupRowId, groupRowId, newSortKeys);
                  collClear(sortedGroupRowIds);
                },
              ),
          groupHavingStore.addTableListener(queryId, () => {
            if (collIsEmpty(sortedGroupRowIds)) {
              resultStore.delTable(queryId);
              if (groupHavingStore.hasTable(queryId)) {
                const groupTable = groupHavingStore.getTable(queryId);
                arrayForEach(
                  arraySort(objIds(groupTable), groupRowIdSorter),
                  (id) => mapSet(sortedGroupRowIds, id, 0),
                );
                arrayForEach(
                  ifNotUndefined(
                    offsetLimit,
                    ([offset, limit]) =>
                      arraySlice(
                        mapKeys(sortedGroupRowIds),
                        offset,
                        offset + limit,
                      ),
                    () => mapKeys(sortedGroupRowIds),
                  ) as Ids,
                  (groupRowId) => {
                    resultStore.setRow(
                      queryId,
                      groupRowId,
                      groupTable[groupRowId],
                    );
                    mapSet(sortedGroupRowIds, groupRowId, 1);
                  },
                );
              }
            }
          }),
        );
      }

      // GROUP & HAVING

      if (collIsEmpty(groups) && arrayIsEmpty(havings)) {
        selectJoinWhereStore = groupHavingStore;
      } else {
        synchronizeTransactions(
          queryId,
          selectJoinWhereStore,
          groupHavingStore,
        );

        const groupedSelectedCellIds: IdMap<Set<[Id, Aggregators]>> = mapNew();
        mapForEach(groups, (groupedCellId, [selectedCellId, aggregators]) =>
          setAdd(mapEnsure(groupedSelectedCellIds, selectedCellId, setNew), [
            groupedCellId,
            aggregators,
          ]),
        );

        const groupBySelectedCellIds: IdSet = setNew();
        mapForEach(selects, (selectedCellId) =>
          collHas(groupedSelectedCellIds, selectedCellId)
            ? 0
            : setAdd(groupBySelectedCellIds, selectedCellId),
        );

        const tree = mapNew<Cell, any>();

        const writeGroupRow = (
          leaf: [IdMap2<Cell>, IdSet, Id, Row],
          changedGroupedSelectedCells: IdMap<[Cell]>,
          selectedRowId: Id,
          forceRemove?: 1,
        ) =>
          ifNotUndefined(
            leaf,
            ([selectedCells, selectedRowIds, groupRowId, groupRow]) => {
              mapForEach(
                changedGroupedSelectedCells,
                (selectedCellId, [newCell]) => {
                  const selectedCell = mapEnsure(
                    selectedCells,
                    selectedCellId,
                    mapNew,
                  );
                  const oldLeafCell = mapGet(selectedCell, selectedRowId);
                  const newLeafCell = forceRemove ? undefined : newCell;
                  if (oldLeafCell !== newLeafCell) {
                    const oldNewSet = setNew([[oldLeafCell, newLeafCell]]);
                    const oldLength = collSize(selectedCell);
                    mapSet(selectedCell, selectedRowId, newLeafCell);
                    collForEach(
                      mapGet(groupedSelectedCellIds, selectedCellId),
                      ([groupedCellId, aggregators]) => {
                        const aggregateValue = getAggregateValue(
                          groupRow[groupedCellId],
                          oldLength,
                          selectedCell as IdMap<Cell>,
                          oldNewSet as Set<[CellOrUndefined, CellOrUndefined]>,
                          aggregators,
                        );
                        groupRow[groupedCellId] = (
                          isUndefined(getCellType(aggregateValue))
                            ? null
                            : aggregateValue
                        ) as Cell;
                      },
                    );
                  }
                },
              );
              (collIsEmpty(selectedRowIds) ||
                !arrayEvery(havings, (having) =>
                  having((cellId: Id) => groupRow[cellId]),
                )
                ? groupHavingStore.delRow
                : groupHavingStore.setRow)(queryId, groupRowId, groupRow);
            },
          );

        addPreStoreListener(
          selectJoinWhereStore,
          queryId,
          selectJoinWhereStore.addRowListener(
            queryId,
            null,
            (_store, _tableId, selectedRowId, getCellChange) => {
              const oldPath: CellOrUndefined[] = [];
              const newPath: CellOrUndefined[] = [];
              const changedGroupedSelectedCells: IdMap<[Cell]> = mapNew();
              const rowExists = selectJoinWhereStore.hasRow(
                queryId,
                selectedRowId,
              );
              let changedLeaf = !rowExists;

              collForEach(groupBySelectedCellIds, (selectedCellId) => {
                const [changed, oldCell, newCell] = (
                  getCellChange as GetCellChange
                )(queryId, selectedRowId, selectedCellId);
                arrayPush(oldPath, oldCell);
                arrayPush(newPath, newCell);
                changedLeaf ||= changed;
              });
              mapForEach(groupedSelectedCellIds, (selectedCellId) => {
                const [changed, , newCell] = (getCellChange as GetCellChange)(
                  queryId,
                  selectedRowId,
                  selectedCellId,
                );
                if (changedLeaf || changed) {
                  mapSet(changedGroupedSelectedCells, selectedCellId, [
                    newCell,
                  ]);
                }
              });

              if (changedLeaf) {
                writeGroupRow(
                  visitTree(
                    tree,
                    oldPath,
                    undefined,
                    ([, selectedRowIds, groupRowId]) => {
                      collDel(selectedRowIds, selectedRowId);
                      if (collIsEmpty(selectedRowIds)) {
                        groupHavingStore.delRow(queryId, groupRowId);
                        return 1;
                      }
                    },
                  ),
                  changedGroupedSelectedCells,
                  selectedRowId,
                  1,
                );
              }

              if (rowExists) {
                writeGroupRow(
                  visitTree(
                    tree,
                    newPath,
                    () => {
                      const groupRow: Row = {};
                      collForEach(
                        groupBySelectedCellIds,
                        (selectedCellId) =>
                          (groupRow[selectedCellId] =
                            selectJoinWhereStore.getCell(
                              queryId,
                              selectedRowId,
                              selectedCellId,
                            ) as Cell),
                      );
                      return [
                        mapNew(),
                        setNew(),
                        (
                          groupHavingStore.addRow as (
                            tableId: Id,
                            row: Row,
                            forceId?: 1,
                          ) => Id | undefined
                        )(queryId, groupRow, 1),
                        groupRow,
                      ];
                    },
                    ([, selectedRowIds]) => {
                      setAdd(selectedRowIds, selectedRowId);
                    },
                  ),
                  changedGroupedSelectedCells,
                  selectedRowId,
                );
              }
            },
          ),
        );
      }

      // SELECT & JOIN & WHERE

      synchronizeTransactions(queryId, store, selectJoinWhereStore);

      const writeSelectRow = (rootRowId: Id) => {
        const getTableCell = (arg1: Id, arg2?: Id) =>
          store.getCell(
            ...((isUndefined(arg2)
              ? [tableId, rootRowId, arg1]
              : arg1 === tableId
              ? [tableId, rootRowId, arg2]
              : [
                  mapGet(joins, arg1)?.[0] as Id,
                  mapGet(mapGet(joins, arg1)?.[4], rootRowId)?.[0],
                  arg2,
                ]) as [Id, Id, Id]),
          );
        selectJoinWhereStore.transaction(() =>
          arrayEvery(wheres, (where) => where(getTableCell))
            ? mapForEach(selects, (asCellId, tableCellGetter) =>
                setOrDelCell(
                  selectJoinWhereStore,
                  queryId,
                  rootRowId,
                  asCellId,
                  tableCellGetter(getTableCell, rootRowId),
                ),
              )
            : selectJoinWhereStore.delRow(queryId, rootRowId),
        );
      };

      const listenToTable = (
        rootRowId: Id,
        tableId: Id,
        rowId: Id,
        joinedTableIds: Ids,
      ) => {
        const getCell = (cellId: Id) => store.getCell(tableId, rowId, cellId);
        arrayForEach(joinedTableIds, (remoteAsTableId) => {
          const [realJoinedTableId, , on, nextJoinedTableIds, remoteIdPair] =
            mapGet(joins, remoteAsTableId) as JoinClause;
          const remoteRowId = on?.(getCell, rootRowId);
          const [previousRemoteRowId, previousRemoteListenerId] =
            mapGet(remoteIdPair, rootRowId) ?? [];
          if (remoteRowId != previousRemoteRowId) {
            if (!isUndefined(previousRemoteListenerId)) {
              delStoreListeners(queryId, previousRemoteListenerId);
            }
            mapSet(
              remoteIdPair,
              rootRowId,
              isUndefined(remoteRowId)
                ? null
                : [
                    remoteRowId,
                    ...addStoreListeners(
                      queryId,
                      1,
                      store.addRowListener(realJoinedTableId, remoteRowId, () =>
                        listenToTable(
                          rootRowId,
                          realJoinedTableId,
                          remoteRowId,
                          nextJoinedTableIds,
                        ),
                      ),
                    ),
                  ],
            );
          }
        });
        writeSelectRow(rootRowId);
      };

      const {3: joinedTableIds} = mapGet(joins, null) as JoinClause;
      selectJoinWhereStore.transaction(() =>
        addStoreListeners(
          queryId,
          1,
          store.addRowListener(
            tableId,
            null,
            (_store: Store, _tableId: Id, rootRowId: Id) => {
              if (store.hasRow(tableId, rootRowId)) {
                listenToTable(rootRowId, tableId, rootRowId, joinedTableIds);
              } else {
                selectJoinWhereStore.delRow(queryId, rootRowId);
                collForEach(joins, ({4: idsByRootRowId}) =>
                  ifNotUndefined(
                    mapGet(idsByRootRowId, rootRowId),
                    ([, listenerId]) => {
                      delStoreListeners(queryId, listenerId);
                      mapSet(idsByRootRowId, rootRowId);
                    },
                  ),
                );
              }
            },
          ),
        ),
      );

      return queries;
    };

    const delQueryDefinition = (queryId: Id): Queries => {
      mapForEach(
        mapGet(preStoreListenerIds, queryId),
        (preStore, listenerIds) =>
          collForEach(listenerIds, (listenerId) =>
            preStore.delListener(listenerId),
          ),
      );
      cleanPreStores(queryId);
      delDefinition(queryId);
      return queries;
    };

    const getResultTable = (queryId: Id): Table =>
      resultStore.getTable(queryId);

    const getResultRowIds = (queryId: Id): Ids =>
      resultStore.getRowIds(queryId);

    const getResultRow = (queryId: Id, rowId: Id): Row =>
      resultStore.getRow(queryId, rowId);

    const getResultCellIds = (queryId: Id, rowId: Id): Ids =>
      resultStore.getCellIds(queryId, rowId);

    const getResultCell = (
      queryId: Id,
      rowId: Id,
      cellId: Id,
    ): CellOrUndefined => resultStore.getCell(queryId, rowId, cellId);

    const hasResultTable = (queryId: Id): boolean =>
      resultStore.hasTable(queryId);

    const hasResultRow = (queryId: Id, rowId: Id): boolean =>
      resultStore.hasRow(queryId, rowId);

    const hasResultCell = (queryId: Id, rowId: Id, cellId: Id): boolean =>
      resultStore.hasCell(queryId, rowId, cellId);

    const forEachResultTable = (tableCallback: TableCallback): void =>
      resultStore.forEachTable(tableCallback);

    const forEachResultRow = (queryId: Id, rowCallback: RowCallback): void =>
      resultStore.forEachRow(queryId, rowCallback);

    const forEachResultCell = (
      queryId: Id,
      rowId: Id,
      cellCallback: CellCallback,
    ): void => resultStore.forEachCell(queryId, rowId, cellCallback);

    const addResultTableListener = (
      queryId: IdOrNull,
      listener: ResultTableListener,
    ): Id =>
      resultStore.addTableListener(queryId, (_store, ...args) =>
        listener(queries, ...args),
      );

    const addResultRowIdsListener = (
      queryId: IdOrNull,
      listener: ResultRowIdsListener,
      trackReorder?: boolean,
    ): Id =>
      resultStore.addRowIdsListener(
        queryId,
        (_store, ...args) => listener(queries, ...args),
        trackReorder,
      );

    const addResultRowListener = (
      queryId: IdOrNull,
      rowId: IdOrNull,
      listener: ResultRowListener,
    ): Id =>
      resultStore.addRowListener(queryId, rowId, (_store, ...args) =>
        listener(queries, ...args),
      );

    const addResultCellIdsListener = (
      queryId: IdOrNull,
      rowId: IdOrNull,
      listener: ResultCellIdsListener,
    ): Id =>
      resultStore.addCellIdsListener(queryId, rowId, (_store, ...args) =>
        listener(queries, ...args),
      );

    const addResultCellListener = (
      queryId: IdOrNull,
      rowId: IdOrNull,
      cellId: IdOrNull,
      listener: ResultCellListener,
    ): Id =>
      resultStore.addCellListener(queryId, rowId, cellId, (_store, ...args) =>
        listener(queries, ...args),
      );

    const delListener = (listenerId: Id): Queries => {
      resultStore.delListener(listenerId);
      return queries;
    };

    const getListenerStats = (): QueriesListenerStats => {
      const {
        tables: _1,
        tableIds: _2,
        transaction: _3,
        ...stats
      } = resultStore.getListenerStats();
      return stats;
    };

    const queries: Queries = {
      setQueryDefinition,
      delQueryDefinition,

      getStore,
      getQueryIds,
      forEachQuery,
      hasQuery,
      getTableId,

      getResultTable,
      getResultRowIds,
      getResultRow,
      getResultCellIds,
      getResultCell,
      hasResultTable,
      hasResultRow,
      hasResultCell,

      forEachResultTable,
      forEachResultRow,
      forEachResultCell,

      addResultTableListener,
      addResultRowIdsListener,
      addResultRowListener,
      addResultCellIdsListener,
      addResultCellListener,

      delListener,

      destroy,
      getListenerStats,
    };

    return objFreeze(queries);
  },
);