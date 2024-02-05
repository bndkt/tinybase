import {
  PowerSyncPersister,
  createPowerSyncPersister as createPowerSyncPersisterDecl,
} from '../types/persisters/persister-powersync';
import {UpdateListener, createSqlitePersister} from './sqlite/create';
import {AbstractPowerSyncDatabase} from '@journeyapps/powersync-sdk-common';
import {DatabasePersisterConfig} from '../types/persisters';
import {IdObj} from '../common/obj';
import {Store} from '../types/store';
import {arrayForEach} from '../common/array';
import {promiseNew} from '../common/other';

export const createPowerSyncPersister = ((
  store: Store,
  powerSync: AbstractPowerSyncDatabase,
  configOrStoreTableName?: DatabasePersisterConfig | string,
  onSqlCommand?: (sql: string, args?: any[]) => void,
  onIgnoredError?: (error: any) => void,
): PowerSyncPersister =>
  createSqlitePersister(
    store,
    configOrStoreTableName,
    async (sql: string, args: any[] = []): Promise<IdObj<any>[]> =>
      await promiseNew(async (resolve, reject) => {
        // eslint-disable-next-line no-console
        // console.log('sql/args', sql, args);
        const result = await powerSync.execute(sql, args);

        result?.rows ? resolve(result.rows._array) : reject();
      }),
    (listener: UpdateListener): AbortController => {
      const abortController = new AbortController();

      (async () => {
        for await (const update of powerSync.onChange({
          // tables: ['profiles'],
          rawTableNames: true,
          signal: abortController.signal,
        })) {
          // console.log('ONCHANGE2', update);
          arrayForEach(update.changedTables, (tableName) =>
            listener(tableName),
          );
          // for (const tableName of update.changedTables) {
          //   listener(tableName);
          // }
        }
      })();

      return abortController;

      // const observer = db.onChange();

      // arrayForEach(powerSync.onChange(), (change) => {
      //   // eslint-disable-next-line no-console
      //   console.log(change);
      // });

      // const listen = async () => {
      //   for await (const event of powerSync.onChange()) {
      //     arrayForEach(event.changedTables, (tableName) => {
      //       // eslint-disable-next-line no-console
      //       console.log('changedTable', tableName);
      //     });
      //   }
      // };

      // eslint-disable-next-line no-console
      // console.log('listening!');

      // listen();

      // const listen = async () => {
      //   for await (const event of powerSync.onChange()) {
      //     for (const tableName of event.changedTables) {
      //       observer(null, null, tableName);
      //     }
      //   }
      // };

      // listen();

      // db.on(CHANGE, observer);
      // return observer;
    },
    (abortController: AbortController) => abortController.abort(),
    onSqlCommand,
    onIgnoredError,
    powerSync,
  ) as PowerSyncPersister) as typeof createPowerSyncPersisterDecl;
