import {
  A,
  CALLBACK,
  ID,
  METHOD_PREFIX_VERBS,
  OR_UNDEFINED,
  PARTIAL,
  ROW_ID_PARAM,
  SORTED_ARGS,
  SQUARE_BRACKETS,
  STORE,
  THE_STORE,
  VOID,
  getContentDoc,
  getForEachDoc,
  getIdsDoc,
  getTheContentOfTheStoreDoc,
} from '../common/strings';
import {
  ADD,
  BOOLEAN,
  CELL,
  CELL_IDS,
  EMPTY_STRING,
  GET,
  IDS,
  ROW,
  ROW_IDS,
  SORTED_ROW_IDS,
  TABLE,
  TABLES,
  TABLE_IDS,
  VALUE,
  VALUES,
  VALUE_IDS,
} from '../../common/strings';
import {IdMap, mapMap, mapNew} from '../../common/map';
import {
  LINE,
  LINE_TREE,
  comment,
  getCodeFunctions,
  mapUnique,
} from '../common/code';
import {TablesSchema, ValuesSchema} from '../../store.d';
import {arrayForEach, arrayPush} from '../../common/array';
import {Id} from '../../common.d';
import {getSchemaFunctions} from '../common/schema';
import {getTypeFunctions} from '../api/types';
import {objIsEmpty} from '../../common/obj';

export const getStoreCoreRefinement = (
  tablesSchema: TablesSchema,
  valuesSchema: ValuesSchema,
  _module: string,
): [string] => {
  const [
    build,
    addImport,
    addType,
    _addInternalFunction,
    _addConstant,
    getImports,
    getTypes,
    _getConstants,
  ] = getCodeFunctions();

  const [mapTablesSchema, mapCellSchema, mapValuesSchema] = getSchemaFunctions(
    tablesSchema,
    valuesSchema,
    () => '',
  );

  const [getTablesTypes, getValuesTypes] = getTypeFunctions(
    addType,
    mapTablesSchema,
    mapCellSchema,
    mapValuesSchema,
  );

  const methods: IdMap<
    [parameters: LINE, returnType: string, doc: string, generic: string]
  > = mapNew();

  const getMethods = (): LINE_TREE =>
    mapMap(methods, ([parameters, returnType, doc, generic], name) => [
      comment(doc),
      name + generic + `(${parameters}): ${returnType};`,
      EMPTY_STRING,
    ]);

  const addMethod = (
    name: Id,
    parameters: LINE,
    returnType: string,
    doc: string,
    generic = EMPTY_STRING,
  ): Id => mapUnique(methods, name, [parameters, returnType, doc, generic]);

  addImport(0, 'tinybase', ID, IDS, STORE + ' as StoreCore');

  let tablesTypes: string[];
  if (objIsEmpty(tablesSchema)) {
    tablesTypes = [
      TABLES,
      TABLES,
      ID,
      TABLE,
      TABLE,
      ROW,
      ROW,
      ID,
      CELL,
      CELL + CALLBACK,
      ROW + CALLBACK,
      TABLE + CALLBACK,
    ];
    addImport(0, 'tinybase', ...tablesTypes);
    arrayPush(tablesTypes, 'GetCellChange', ID, EMPTY_STRING, ID);
  } else {
    addImport(0, 'tinybase', 'CellChange');
    tablesTypes = getTablesTypes();
    arrayForEach([3, 4, 5, 6, 7, 9, 10], (i) => (tablesTypes[i] += '<TId>'));
    tablesTypes[8] += '<TId, CId>';
    arrayPush(
      tablesTypes,
      'TId',
      `<TId extends ${tablesTypes[2]}>`,
      'CId',
      `<TId extends ${tablesTypes[2]}, CId extends ${tablesTypes[7]}>`,
    );
  }

  // Tables, TablesWhenSet, TableId,
  // Table<>, TableWhenSet<>, Row<>, RowWhenSet<>, CellId<>, Cell<>,
  // CellCallback, RowCallback, TableCallback, GetCellChange
  const [
    tablesType,
    tablesWhenSetType,
    tableIdType,
    tableType,
    tableWhenSetType,
    rowType,
    rowWhenSetType,
    cellIdType,
    cellType,
    cellCallbackType,
    rowCallbackType,
    tableCallbackType,
    _getCellChangeType,
    tId,
    tIdGeneric,
    cId,
    cIdGeneric,
  ] = tablesTypes;

  const tableIdParam = 'tableId: ' + tId;
  const rowIdParams = tableIdParam + ', ' + ROW_ID_PARAM;
  const cellIdParams = rowIdParams + ', cellId: ' + cId;

  // getTables, hasTables, setTables, delTables
  arrayForEach(
    [[tablesType], [BOOLEAN], [STORE, 'tables: ' + tablesWhenSetType], [STORE]],
    ([returnType, params], verb) =>
      addMethod(
        METHOD_PREFIX_VERBS[verb] + TABLES,
        params ?? EMPTY_STRING,
        returnType,
        getTheContentOfTheStoreDoc(1, verb),
      ),
  );

  // getTableIds
  addMethod(
    GET + TABLE_IDS,
    EMPTY_STRING,
    tableIdType + SQUARE_BRACKETS,
    getIdsDoc(TABLE, THE_STORE),
  );

  // forEachTable
  addMethod(
    METHOD_PREFIX_VERBS[5] + TABLE,
    'tableCallback: ' + tableCallbackType,
    VOID,
    getForEachDoc(TABLE, THE_STORE),
  );

  // getTable, hasTable, setTable, delTable
  arrayForEach(
    [
      [tableType, tableIdParam],
      [BOOLEAN, tableIdParam],
      [STORE, tableIdParam + ', table: ' + tableWhenSetType],
      [STORE, tableIdParam],
    ],
    ([returnType, params], verb) =>
      addMethod(
        METHOD_PREFIX_VERBS[verb] + TABLE,
        params ?? EMPTY_STRING,
        returnType,
        getContentDoc(verb, 3),
        tIdGeneric,
      ),
  );

  // getRowIds
  addMethod(
    GET + ROW_IDS,
    tableIdParam,
    IDS,
    getIdsDoc(ROW, A + TABLE),
    tIdGeneric,
  );

  // getSortedRowIds
  addMethod(
    GET + SORTED_ROW_IDS,
    tableIdParam + ', cellId?: ' + cellIdType + SORTED_ARGS,
    IDS,
    getIdsDoc(ROW, A + TABLE),
    tIdGeneric,
  );

  // forEachRow
  addMethod(
    METHOD_PREFIX_VERBS[5] + ROW,
    tableIdParam + ', rowCallback: ' + rowCallbackType,
    VOID,
    getForEachDoc(ROW, A + TABLE),
    tIdGeneric,
  );

  // getRow, hasRow, setRow, delRow
  arrayForEach(
    [
      [rowType, rowIdParams, tIdGeneric],
      [BOOLEAN, rowIdParams, tIdGeneric],
      [STORE, rowIdParams + ', row: ' + rowWhenSetType, tIdGeneric],
      [STORE, rowIdParams, tIdGeneric],
    ],
    ([returnType, params, generic], verb) =>
      addMethod(
        METHOD_PREFIX_VERBS[verb] + ROW,
        params ?? EMPTY_STRING,
        returnType,
        getContentDoc(verb, 5),
        generic,
      ),
  );

  // setPartialRow
  addMethod(
    'set' + PARTIAL + ROW,
    tableIdParam + ', ' + ROW_ID_PARAM + ', partialRow: ' + rowWhenSetType,
    STORE,
    getContentDoc(4, 5),
    tIdGeneric,
  );

  // addRow
  addMethod(
    ADD + ROW,
    tableIdParam + ', row: ' + rowWhenSetType,
    ID + OR_UNDEFINED,
    'Add a new ' + ROW,
    tIdGeneric,
  );

  // getCellIds
  addMethod(
    GET + CELL_IDS,
    tableIdParam + ', ' + ROW_ID_PARAM,
    cellIdType + SQUARE_BRACKETS,
    getIdsDoc(CELL, A + ROW),
    tIdGeneric,
  );

  // forEachCell
  addMethod(
    METHOD_PREFIX_VERBS[5] + CELL,
    tableIdParam + ', ' + ROW_ID_PARAM + ', cellCallback: ' + cellCallbackType,
    VOID,
    getForEachDoc(CELL, A + ROW),
    tIdGeneric,
  );

  // getCell, hasCell, setCell, delCell
  arrayForEach(
    [
      [cellType, cellIdParams, cIdGeneric],
      [BOOLEAN, cellIdParams, cIdGeneric],
      [STORE, cellIdParams + ', cell: ' + cellType, cIdGeneric],
      [STORE, cellIdParams, cIdGeneric],
    ],
    ([returnType, params, generic], verb) =>
      addMethod(
        METHOD_PREFIX_VERBS[verb] + CELL,
        params ?? EMPTY_STRING,
        returnType,
        getContentDoc(verb, 7),
        generic,
      ),
  );

  // ---

  let valuesTypes: string[];

  if (objIsEmpty(valuesSchema)) {
    valuesTypes = [VALUES, VALUES, ID, VALUE, VALUE + CALLBACK];
    addImport(0, 'tinybase', ...valuesTypes);
    arrayPush(valuesTypes, 'GetValueChange', 'valueId: Id', EMPTY_STRING);
  } else {
    addImport(0, 'tinybase', 'ValueChange');
    valuesTypes = getValuesTypes();
    valuesTypes[3] += '<VId>';
    arrayPush(valuesTypes, 'valueId: VId', `<VId extends ${valuesTypes[2]}>`);
  }

  // Values, ValuesWhenSet, ValueId,
  // Value<>,
  // ValueCallback, ValuesCallback, GetValueChange
  const [
    valuesType,
    valuesWhenSetType,
    valueIdType,
    valueType,
    valueCallbackType,
    _getValueChangeType,
    vIdParam,
    vIdGeneric,
  ] = valuesTypes;

  // getValues, hasValues, setValues, delValues
  arrayForEach(
    [[valuesType], [BOOLEAN], [STORE, 'values: ' + valuesWhenSetType], [STORE]],
    ([returnType, params], verb) =>
      addMethod(
        METHOD_PREFIX_VERBS[verb] + VALUES,
        params ?? EMPTY_STRING,
        returnType,
        getTheContentOfTheStoreDoc(2, verb),
      ),
  );

  // setPartialValues
  addMethod(
    'set' + PARTIAL + VALUES,
    'partialValues: ' + valuesWhenSetType,
    STORE,
    getTheContentOfTheStoreDoc(2, 4),
  );

  // getValueIds
  addMethod(
    GET + VALUE_IDS,
    EMPTY_STRING,
    valueIdType + SQUARE_BRACKETS,
    getIdsDoc(VALUE, THE_STORE),
  );

  // forEachValue
  addMethod(
    METHOD_PREFIX_VERBS[5] + VALUE,
    'valueCallback: ' + valueCallbackType,
    VOID,
    getForEachDoc(VALUE, THE_STORE),
  );

  // getValue, hasValue, setValue, delValue
  arrayForEach(
    [
      [valueType, vIdParam],
      [BOOLEAN, vIdParam],
      [STORE, vIdParam + ', value: ' + valueType],
      [STORE, vIdParam],
    ],
    ([returnType, params], verb) =>
      addMethod(
        METHOD_PREFIX_VERBS[verb] + VALUE,
        params ?? EMPTY_STRING,
        returnType,
        getContentDoc(verb, 11),
        vIdGeneric,
      ),
  );

  return [
    build(
      `export * from 'tinybase';`,
      ...getImports(0),
      ...getTypes(),
      'interface Refined {',
      ...getMethods(),
      '}',
      EMPTY_STRING,
      'export type Todo = Omit<StoreCore, keyof Refined>;',
      'export type Store = Todo & Refined;',
      EMPTY_STRING,
      comment(`Creates a Store object`),
      'export function createStore(): Store',
    ),
  ];
};